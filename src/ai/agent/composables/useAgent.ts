/**
 * AI Agent Composable
 *
 * Encapsulates all agent state logic: status machine, document snapshots,
 * diff computation, accept/reject flow, undo stack, and change history.
 */
import type { Editor } from '@tiptap/vue-3'

import { acceptDiffDocument, createDiffDocument, rejectDiffDocument } from '@/ai/diff'
import { documentsEqual, type TipTapDoc } from '@/ai/diff'

import type { AgentMessage, AgentStatus, HistoryEntry, UndoEntry } from '../types'

export type { AgentMessage, AgentStatus, HistoryEntry }

export function useAgent() {
  // Reactive state
  const status = ref<AgentStatus>('idle')
  const messages = ref<AgentMessage[]>([])
  const history = ref<HistoryEntry[]>([])
  const undoStack = ref<UndoEntry[]>([])
  const originalSnapshot = ref<TipTapDoc | null>(null)
  const proposedContent = ref<TipTapDoc | null>(null)
  const lastPrompt = ref<string>('')
  const streamingContent = ref<string>('')
  const errorMessage = ref<string>('')

  // Computed
  const hasProposal = computed(
    () =>
      status.value === 'proposing' || status.value === 'awaiting-confirmation',
  )
  const canUndo = computed(() => undoStack.value.length > 0)

  // --- Helpers ---

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }

  function captureSnapshot(editor: Editor): TipTapDoc {
    return editor.getJSON() as TipTapDoc
  }

  function addMessage(
    role: AgentMessage['role'],
    content: string,
    extra?: Partial<AgentMessage>,
  ): AgentMessage {
    const msg: AgentMessage = {
      id: generateId(),
      role,
      content,
      timestamp: new Date(),
      status: 'complete',
      ...extra,
    }
    messages.value.push(msg)
    return msg
  }

  function addHistoryEntry(
    action: HistoryEntry['action'],
    prompt: string,
  ): void {
    history.value.unshift({
      id: generateId(),
      action,
      prompt,
      timestamp: new Date(),
    })
  }

  // --- Core actions ---

  /**
   * Send a prompt to the agent. Takes the editor instance and the user prompt.
   * The `sendFn` callback handles the actual API call and returns the proposed content.
   */
  async function sendPrompt(
    editor: Editor,
    prompt: string,
    sendFn: (
      prompt: string,
      doc: TipTapDoc,
      selectionText: string,
      selectionDoc?: TipTapDoc,
      parentNode?: TipTapDoc,
      model?: string,
    ) => Promise<TipTapDoc | ReadableStream<string>>,
    model?: string,
  ): Promise<void> {
    if (status.value === 'thinking') return

    lastPrompt.value = prompt
    errorMessage.value = ''

    // Capture current document state
    originalSnapshot.value = captureSnapshot(editor)

    // Add user message
    addMessage('user', prompt)

    // Transition to thinking
    status.value = 'thinking'

    // Get selection info
    const { selection } = editor.state
    const hasSelection = !selection.empty
    const selectionText = hasSelection
      ? editor.state.doc.textBetween(selection.from, selection.to)
      : ''

    // Extract selected content as TipTap JSON if selection exists
    let selectionDoc: TipTapDoc | undefined
    if (hasSelection) {
      const slice = selection.content()
      selectionDoc = {
        type: 'doc',
        content: slice.content.toJSON(),
      }
    }

    // Get the full parent node containing the selection
    let parentNode: TipTapDoc | undefined
    if (hasSelection) {
      const $from = selection.$from
      const parent = $from.parent
      const depth = $from.depth

      if (depth > 0) {
        // Get the full parent node at the current depth
        parentNode = {
          type: 'doc',
          content: [parent.toJSON()],
        }
      } else {
        // Selection is at top level, use the full document
        parentNode = originalSnapshot.value
      }
    }

    // Debug: Log what will be sent to the agent
    console.log('[Agent Request]', {
      prompt,
      model,
      hasSelection,
      selectionText: hasSelection ? selectionText : null,
      selectionDocSize: selectionDoc ? JSON.stringify(selectionDoc).length : 0,
      parentNodeSize: parentNode ? JSON.stringify(parentNode).length : 0,
      documentSize: JSON.stringify(originalSnapshot.value).length,
      selectionDoc: hasSelection ? JSON.stringify(selectionDoc, null, 2) : null,
      parentNode: hasSelection ? JSON.stringify(parentNode, null, 2) : null,
    })

    try {
      const result = await sendFn(
        prompt,
        originalSnapshot.value,
        selectionText,
        selectionDoc,
        parentNode,
        model,
      )

      if (result instanceof ReadableStream) {
        // Handle streaming response
        const assistantMsg = addMessage('assistant', '', {
          status: 'streaming',
        })
        streamingContent.value = ''

        const reader = result.getReader()
        const decoder = new TextDecoder()

        let done = false
        while (!done) {
          const chunk = await reader.read()
          done = chunk.done
          if (chunk.value) {
            const text =
              typeof chunk.value === 'string'
                ? chunk.value
                : decoder.decode(chunk.value, { stream: true })
            streamingContent.value += text
            assistantMsg.content = streamingContent.value
          }
        }

        // Try to parse the final streamed content as TipTap JSON
        try {
          const parsed = JSON.parse(streamingContent.value)
          proposedContent.value = parsed as TipTapDoc
          assistantMsg.status = 'complete'
          assistantMsg.content =
            "I've prepared changes to your document. Review the diff below and accept or reject."

          // Compute inline diff document
          const markedDoc = createDiffDocument(
            originalSnapshot.value,
            proposedContent.value,
          )

          // Render inline diff
          editor.commands.setContent(markedDoc)

          status.value = 'awaiting-confirmation'
        } catch {
          // Streamed content is plain text (explanation), not JSON
          assistantMsg.status = 'complete'
          assistantMsg.content = streamingContent.value
          status.value = 'idle'
        }
      } else {
        // Static TipTapDoc response
        proposedContent.value = result

        if (documentsEqual(originalSnapshot.value, proposedContent.value)) {
          addMessage(
            'assistant',
            'No changes needed — the document already matches.',
          )
          status.value = 'idle'
          return
        }

        // Compute inline diff document
        const markedDoc = createDiffDocument(
          originalSnapshot.value,
          proposedContent.value,
        )

        // Render inline diff
        editor.commands.setContent(markedDoc)

        const assistantMsg = addMessage(
          'assistant',
          "I've prepared changes to your document. Review the inline diff and accept or reject.",
        )

        status.value = 'awaiting-confirmation'
      }
    } catch (err: any) {
      errorMessage.value = err?.message || 'An unexpected error occurred'
      addMessage('system', `Error: ${errorMessage.value}`, {
        status: 'error',
      })
      status.value = 'idle'
    }
  }

  /**
   * Accept the proposed changes — apply to editor
   */
  function acceptChanges(editor: Editor): void {
    if (
      status.value !== 'awaiting-confirmation' ||
      !proposedContent.value ||
      !originalSnapshot.value
    ) {
      return
    }

    // Push to undo stack
    undoStack.value.push({
      originalDoc: originalSnapshot.value,
      appliedDoc: proposedContent.value,
      prompt: lastPrompt.value,
      timestamp: new Date(),
    })

    // Clean up DiffRemoved and DiffAdded marks
    acceptDiffDocument(editor)

    // Log to history
    addHistoryEntry('accepted', lastPrompt.value)

    addMessage('system', '✅ Changes applied successfully.')

    // Reset proposal state
    status.value = 'applied'
    proposedContent.value = null

    // Brief status display, then back to idle
    setTimeout(() => {
      if (status.value === 'applied') status.value = 'idle'
    }, 2000)
  }

  /**
   * Reject the proposed changes — discard
   */
  function rejectChanges(editor: Editor): void {
    if (status.value !== 'awaiting-confirmation') return

    // Revert DiffAdded and DiffRemoved marks
    rejectDiffDocument(editor)

    addHistoryEntry('rejected', lastPrompt.value)
    addMessage('system', '❌ Changes rejected.')

    // Reset
    status.value = 'rejected'
    proposedContent.value = null

    setTimeout(() => {
      if (status.value === 'rejected') status.value = 'idle'
    }, 2000)
  }

  /**
   * Undo the last accepted change
   */
  function undoLastChange(editor: Editor): void {
    if (undoStack.value.length === 0) return

    const entry = undoStack.value.pop()!
    editor.commands.setContent(entry.originalDoc)

    addMessage('system', `↩️ Reverted: "${entry.prompt}"`)
  }

  /**
   * Clear conversation
   */
  function clearMessages(): void {
    messages.value = []
    status.value = 'idle'
    proposedContent.value = null
    streamingContent.value = ''
    errorMessage.value = ''
  }

  return {
    // State
    status,
    messages,
    history,
    undoStack,
    originalSnapshot,
    proposedContent,
    lastPrompt,
    streamingContent,
    errorMessage,

    // Computed
    hasProposal,
    canUndo,

    // Actions
    sendPrompt,
    acceptChanges,
    rejectChanges,
    undoLastChange,
    clearMessages,
  }
}
