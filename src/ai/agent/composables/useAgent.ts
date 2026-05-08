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
import type { AgentResponseWithMetadata } from '../websocket'

export type { AgentMessage, AgentStatus, HistoryEntry, AgentResponseWithMetadata }

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
  const selectionRange = ref<{ from: number; to: number } | null>(null)

  // Computed
  const hasProposal = computed(
    () =>
      status.value === 'proposing' || status.value === 'awaiting-confirmation',
  )
  const canUndo = computed(() => undoStack.value.length > 0)

  // --- Helpers ---

  /**
   * Apply operation to document based on operation_type and selection state
   */
  function applyOperation(
    originalDoc: TipTapDoc,
    responseDoc: TipTapDoc,
    operation_type: string,
    anchor_id: string | null,
    hasSelection: boolean,
  ): TipTapDoc {
    const responseNodes = responseDoc.content || []

    // If there was a selection and no specific operation_type, treat as selection replacement
    if (hasSelection && (!operation_type || operation_type === 'replace')) {
      // For selection replacement, we can't easily merge at doc level
      // The editor transaction will handle the actual replacement at the selection range
      // Return response as-is - the caller will handle applying it to the selection
      return responseDoc
    }

    switch (operation_type) {
      case 'create':
        // Clear editor, return response as new document
        return responseDoc

      case 'append':
        // Push response nodes onto end of existing document
        return {
          type: 'doc',
          content: [...(originalDoc.content || []), ...responseNodes],
        }

      case 'prepend':
        // Unshift response nodes onto start of existing document
        return {
          type: 'doc',
          content: [...responseNodes, ...(originalDoc.content || [])],
        }

      case 'replace':
        // Replace selected nodes with response nodes
        return responseDoc

      case 'insert':
        // Find node with id == anchor_id, insert response nodes after it
        if (anchor_id && originalDoc.content) {
          const newContent: any[] = []
          let inserted = false

          for (const node of originalDoc.content) {
            newContent.push(node)
            // Check if this node or any child has the anchor_id
            if (!inserted && hasNodeId(node, anchor_id)) {
              newContent.push(...responseNodes)
              inserted = true
            }
          }

          // If anchor not found, append at end
          if (!inserted) {
            newContent.push(...responseNodes)
          }

          return { type: 'doc', content: newContent }
        }
        return responseDoc

      default:
        // Default: treat as replace/create
        return responseDoc
    }
  }

  /**
   * Check if a node or its children has a specific id
   */
  function hasNodeId(node: any, id: string): boolean {
    if (node.attrs?.id === id) return true
    if (node.attrs?.anchor_id === id) return true
    if (node.content) {
      for (const child of node.content) {
        if (hasNodeId(child, id)) return true
      }
    }
    return false
  }

  /**
   * Merge response document into original at selection position
   * For selection-based replacements, we replace content at the selection range
   */
  function mergeAtSelection(
    originalDoc: TipTapDoc,
    responseDoc: TipTapDoc,
    range: { from: number; to: number },
  ): TipTapDoc {
    // Since we're working with JSON, we need a simplified approach
    // The actual replacement happens at the editor transaction level
    // Here we construct a document that shows the diff properly

    const originalNodes = originalDoc.content || []
    const responseNodes = responseDoc.content || []

    // For a proper merge, we need to know which nodes were selected
    // Since we don't have node-level position mapping in JSON,
    // we'll return a document that combines both for diff display
    // The actual application will use editor commands to replace the selection

    // Create a merged document:
    // - Mark selected nodes as "removed" in diff by not including them
    // - Include response nodes as "added"
    // - Include non-selected nodes as "unchanged"

    // For now, return the response merged with original context
    // This creates a document showing what the result should look like
    return {
      type: 'doc',
      content: responseNodes.length > 0 ? responseNodes : originalNodes,
    }
  }

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
      documentName?: string,
    ) => Promise<AgentResponseWithMetadata | ReadableStream<string>>,
    model?: string,
    documentName?: string,
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

    // Store selection range for later use when applying response
    selectionRange.value = hasSelection
      ? { from: selection.from, to: selection.to }
      : null

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
      documentName,
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
        documentName,
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
          const responseDoc = parsed as TipTapDoc

          // Check if we had a selection when sending the prompt
          const hadSelection = selectionRange.value !== null

          // If there was a selection, merge response into original
          if (hadSelection) {
            proposedContent.value = mergeAtSelection(
              originalSnapshot.value,
              responseDoc,
              selectionRange.value!,
            )
          } else {
            proposedContent.value = responseDoc
          }

          assistantMsg.status = 'complete'
          const operationLabel = hadSelection ? 'selection update' : 'update'
          assistantMsg.content =
            `I've prepared changes to your document (${operationLabel}). Review the diff below and accept or reject.`

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
          // When there's a selection but only text response, show in sidebar
          assistantMsg.status = 'complete'
          assistantMsg.content = streamingContent.value
          status.value = 'idle'
        }
      } else {
        // Static response with operation metadata
        const { doc: responseDoc, operation_type, anchor_id } = result

        // Check if we had a selection when sending the prompt
        const hadSelection = selectionRange.value !== null

        // If there was a selection, merge response into original at selection position
        if (hadSelection && (!operation_type || operation_type === 'replace')) {
          // Merge response document nodes into original document
          proposedContent.value = mergeAtSelection(
            originalSnapshot.value,
            responseDoc,
            selectionRange.value!,
          )
        } else {
          // Apply the operation to get the proposed content
          proposedContent.value = applyOperation(
            originalSnapshot.value,
            responseDoc,
            operation_type,
            anchor_id,
            hadSelection,
          )
        }

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

        const operationLabel = hadSelection ? 'selection update' : (operation_type || 'update')
        const assistantMsg = addMessage(
          'assistant',
          `I've prepared changes to your document (${operationLabel}). Review the inline diff and accept or reject.`,
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

    // Check if this was a selection-based change
    const hadSelection = selectionRange.value !== null

    if (hadSelection && selectionRange.value) {
      // For selection-based changes, use editor commands to replace just the selection
      const { from, to } = selectionRange.value

      // Clean up diff marks first
      acceptDiffDocument(editor)

      // Replace the selection with the proposed content
      // Focus and set selection first
      editor.commands.focus()
      editor.commands.setTextSelection({ from, to })

      // Insert the new content (this replaces the selection)
      const newNodes = proposedContent.value.content || []
      if (newNodes.length > 0) {
        // Clear current selection and insert new nodes
        editor.commands.deleteSelection()
        editor.commands.insertContent(newNodes)
      }
    } else {
      // For full document changes, use the standard accept flow
      // Clean up DiffRemoved and DiffAdded marks
      acceptDiffDocument(editor)
    }

    // Log to history
    addHistoryEntry('accepted', lastPrompt.value)

    addMessage('system', '✅ Changes applied successfully.')

    // Reset proposal state
    status.value = 'applied'
    proposedContent.value = null
    selectionRange.value = null

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
    selectionRange.value = null

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
