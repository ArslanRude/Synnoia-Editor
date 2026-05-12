import { type Editor, Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setCurrentNodeSelection: {
      setCurrentNodeSelection: () => ReturnType
    }
    deleteSelectionNode: {
      deleteSelectionNode: () => ReturnType
    }
    selectVisibleAll: {
      selectVisibleAll: () => ReturnType
    }
  }
}
export default Extension.create({
  name: 'selection',
  priority: 1000,
  addProseMirrorPlugins() {
    const { editor } = this

    return [
      new Plugin({
        key: new PluginKey('selection'),
        props: {
          handleKeyDown(view, event) {
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === 'a'
            ) {
              event.preventDefault()
              return editor.commands.selectAll()
            }

            return false
          },
          decorations(state) {
            if (state.selection.empty) {
              return null
            }

            // if (editor.isFocused) {
            //   return null
            // }

            const decorations: Decoration[] = []
            const { from, to } = state.selection

            state.doc.nodesBetween(from, to, (node, pos) => {
              if (node.isTextblock) {
                const textFrom = Math.max(from, pos + 1)
                const textTo = Math.min(to, pos + node.nodeSize - 1)

                if (textFrom < textTo) {
                  decorations.push(
                    Decoration.inline(textFrom, textTo, {
                      class: 'arslan-text-selection',
                    }),
                  )
                } else if (node.content.size === 0) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: 'arslan-block-selection',
                    }),
                  )
                }

                return false
              }

              if (node.isAtom && pos >= from && pos + node.nodeSize <= to) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: 'arslan-block-selection',
                  }),
                )
              }
            })

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
  addCommands() {
    return {
      setCurrentNodeSelection:
        () =>
        ({ editor, chain }) => {
          editor.commands.selectParentNode()
          const { $anchor } = editor.state.selection
          return chain()
            .setNodeSelection($anchor.pos - $anchor.depth)
            .run()
        },
      deleteSelectionNode:
        () =>
        ({ editor, commands }) => {
          const node = getSelectionNode(editor)
          if (!node) {
            return false
          }
          if (node.attrs.vnode) {
            if (
              editor.isActive('image') ||
              editor.isActive('video') ||
              editor.isActive('audio') ||
              editor.isActive('file')
            ) {
              const { options } = editor.storage
              const { id, src } = node.attrs
              options.onFileDelete?.(id, src)
            }
          }
          if (commands.deleteSelection()) {
            return true
          }
          return commands.deleteNode(node.type.name)
        },
      selectVisibleAll:
        () =>
                ({ state, dispatch, editor }) => {
          const from = 1
          const to = Math.max(from, state.doc.content.size - 1)

          if (to <= from) {
            return editor.commands.selectAll()
          }

          dispatch?.(
            state.tr.setSelection(TextSelection.create(state.doc, from, to)),
          )
          return true
        },
    }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-a': () => this.editor.commands.selectVisibleAll(),
    }
  },
})
export function getSelectionNode(editor: Editor) {
  // @ts-ignore
  const { $anchor, node } = editor.state.selection
  if (node?.type?.isAtom) {
    return node
  }
  editor.commands.selectParentNode()
  return $anchor.node(1) || node
}
export function getSelectionText(editor: Editor) {
  const { from, to, empty } = editor.state.selection
  if (empty) {
    return ''
  }
  return editor.state.doc.textBetween(from, to, '')
}

// Set selection area with selection effect
export function setSelectionText(
  editor: Editor,
  prevDocLength: number,
  from: number,
  to: number,
) {
  const state = editor?.state
  // Calculate new document length
  const newDocLength = state.doc.content.size
  // Calculate actual end position after inserting content
  const newTo = to + (newDocLength - prevDocLength)
  if (newTo <= from) {
    return false
  }
  const selection = TextSelection.create(state.doc, from, newTo)
  const { tr } = editor.view.state
  if (tr && selection) {
    tr.setSelection(selection)
    editor.view.dispatch(tr)
    editor?.commands.focus()
  }
}
