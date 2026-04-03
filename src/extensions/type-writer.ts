import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    typewriter: {
      /**
       * Start typewriter effect
       */
      startTypewriter: (content: any, options: TypewriterOptions) => ReturnType
      /**
       * Stop typewriter effect
       */
      stopTypewriter: () => ReturnType
      /**
       * Get current typewriter state
       */
      getTypewriterState: () => any
    }
  }
}

interface TypewriterOptions {
  speed?: number
  step?: number
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

interface TypewriterState {
  isRunning: boolean
  currentParagraph: number
  currentTextNode: number
  currentChar: number
}

interface TypewriterProgress {
  totalChars: number
  typedChars: number
}

const typewriterState = ref({
  isRunning: false,
  currentParagraph: 0,
  currentTextNode: 0,
  currentChar: 0,
})

let typewriterTimer: NodeJS.Timeout | null = null
let typewriterProgress: TypewriterProgress = {
  totalChars: 0,
  typedChars: 0,
}

// Calculate total character count for progress tracking
function calculateTotalChars(content: any[]): number {
  return content.reduce((total, node) => {
    if (node.type === 'paragraph' && node.content) {
      return node.content.reduce((paraTotal: number, textNode: any) => {
        return (
          paraTotal +
          (textNode.type === 'text' ? textNode.text?.length || 0 : 0)
        )
      }, total)
    }
    return total
  }, 0)
}

export default Extension.create({
  name: 'typewriter',
  addCommands() {
    return {
      startTypewriter:
        (content, options) =>
        ({ editor, commands }) => {
          // Immediately return true to indicate command execution started

          ;(async () => {
            try {
              // Clear existing timer
              if (typewriterTimer) {
                clearTimeout(typewriterTimer)
                typewriterTimer = null
              }

              // Reset state
              typewriterState.value = {
                isRunning: true,
                currentParagraph: 0,
                currentTextNode: 0,
                currentChar: 0,
              }

              // Calculate total character count
              typewriterProgress = {
                totalChars: calculateTotalChars(content?.content ?? []),
                typedChars: 0,
              }
              // Insert content
              const typeWriterInsertContent = async (curContent: any) => {
                await new Promise<void>((resolve) => {
                  setTimeout(() => {
                    try {
                      editor
                        .chain()
                        .insertContent(curContent)
                        .focus('end', {
                          scrollIntoView: true,
                        })
                        .run()
                    } catch (e) {}
                    resolve()
                  }, 0)
                })
              }
              // Ensure non-negative number
              const speed = Math.max(options?.speed ?? 1, 0)
              // Process content
              const processNode = async (node: any, isTopLevel = false) => {
                if (node.type === 'paragraph') {
                  // When current node is paragraph, insert paragraph style
                  await typeWriterInsertContent([
                    { type: 'paragraph', attrs: node.attrs },
                  ])
                  // Process paragraph content
                  if (node.content && node.content.length > 0) {
                    for (const [index, childNode] of node.content.entries()) {
                      typewriterState.value.currentTextNode = index
                      await processNode(childNode)
                    }
                  } else {
                    editor.commands.enter()
                  }
                  typewriterState.value.currentParagraph++
                } else if (node.type === 'text') {
                  // Handle text node
                  const text = node.text || ''
                  const marks = node.marks || []
                  const step = options?.step ?? 1
                  for (let i = 0; i < text.length; i += step) {
                    if (!typewriterState.value.isRunning) return // Check if stopped
                    const endIndex = Math.min(i + step, text.length)
                    const currentText = text.slice(i, endIndex)
                    await new Promise<void>((resolve) => {
                      typewriterTimer = setTimeout(async () => {
                        // Insert current character
                        await typeWriterInsertContent([
                          {
                            type: 'text',
                            text: currentText,
                            marks,
                          },
                        ])

                        typewriterState.value.currentChar =
                          i + currentText.length - 1
                        typewriterProgress.typedChars += currentText.length

                        // Update progress callback
                        if (
                          options?.onProgress &&
                          typewriterProgress.totalChars > 0
                        ) {
                          options.onProgress(
                            typewriterProgress.typedChars /
                              typewriterProgress.totalChars,
                          )
                        }

                        resolve()
                      }, speed)
                    })
                  }
                } else if (node.type === 'table') {
                  await typeWriterInsertContent([node, { type: 'paragraph' }])
                  editor.commands.enter()
                } else {
                  if (isTopLevel) {
                    await typeWriterInsertContent([node, { type: 'paragraph' }])
                  } else {
                    await typeWriterInsertContent([node])
                  }
                }
              }
              // End current transaction (ensure previous changes are applied)
              editor.view.dispatch(editor.state.tr) // Apply empty transaction to ensure state update
              // Process all top-level nodes
              for (const node of content?.content ?? []) {
                if (!typewriterState.value.isRunning) break
                await processNode(node, true)
              }
              // Complete callback
              if (typewriterState.value.isRunning && options?.onComplete) {
                options.onComplete()
              }
              typewriterState.value.isRunning = false
            } catch (e) {}
          })()
          return true
        },

      stopTypewriter: () => () => {
        typewriterState.value.isRunning = false
        if (typewriterTimer) {
          clearTimeout(typewriterTimer)
          typewriterTimer = null
        }
        return true
      },

      getTypewriterState: () => () => {
        return {
          isRunning: typewriterState.value.isRunning,
          currentParagraph: typewriterState.value.currentParagraph,
          currentTextNode: typewriterState.value.currentTextNode,
          currentChar: typewriterState.value.currentChar,
        }
      },
    }
  },
})

export const getTypewriterRunState = () => {
  return typewriterState.value.isRunning
}
