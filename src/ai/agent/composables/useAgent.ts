/**
 * AI Agent Composable
 *
 * Encapsulates all agent state logic: status machine, document snapshots,
 * diff computation, accept/reject flow, undo stack, and change history.
 */
import type { Editor } from '@tiptap/vue-3'

import { acceptDiffDocument, createDiffDocument, rejectDiffDocument } from '@/ai/diff'
import { documentsEqual, type TipTapDoc } from '@/ai/diff'

import { applyDocumentOperationToDoc, isEmptyStarterDocument, parseGeneratedDocument, parseStreamedBackendResult } from '../documentOperation'
import { createDiagramImageNode, diagramJsonToDrawioXml, isDrawioXmlEmpty } from '../diagram'
import type { AgentMessage, AgentMessageBlock, AgentOutlineBlockItem, AgentStatus, HistoryEntry, SynnoiaAgentBackendResponse, UndoEntry } from '../types'
import type { AgentResponseWithMetadata, SynnoiaAgentCallbacks } from '../websocket'

export type { AgentMessage, AgentStatus, HistoryEntry, AgentResponseWithMetadata }

export function useAgent() {
  // Reactive state
  const status = ref<AgentStatus>('idle')
  const messages = ref<AgentMessage[]>([])
  const history = ref<HistoryEntry[]>([])
  const undoStack = ref<UndoEntry[]>([])
  const originalSnapshot = ref<TipTapDoc | null>(null)
  const proposedContent = ref<TipTapDoc | null>(null)
  const directProposal = ref(false)
  const lastPrompt = ref<string>('')
  const streamingContent = ref<string>('')
  const errorMessage = ref<string>('')
  const selectionRange = ref<{ from: number; to: number } | null>(null)

  // --- Real-time streaming state (shown in StreamingBlock sidebar widget) ---
  const streamingNode = ref<string>('')
  const streamingTokens = ref<string>('')
  const streamingSummary = ref<string>('')
  const planningItems = ref<AgentOutlineBlockItem[]>([])

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
      callbacks?: SynnoiaAgentCallbacks,
    ) => Promise<SynnoiaAgentBackendResponse>,
    model?: string,
    documentName?: string,
  ): Promise<void> {
    if (status.value === 'thinking') return

    lastPrompt.value = prompt
    errorMessage.value = ''
    originalSnapshot.value = captureSnapshot(editor)
    proposedContent.value = null
    directProposal.value = false
    streamingContent.value = ''

    // Reset streaming sidebar state for fresh request
    streamingNode.value = ''
    streamingTokens.value = ''
    streamingSummary.value = ''
    planningItems.value = []

    addMessage('user', prompt)
    status.value = 'thinking'

    const { selection } = editor.state
    const hasSelection = !selection.empty
    const selectionText = hasSelection
      ? editor.state.doc.textBetween(selection.from, selection.to)
      : ''

    selectionRange.value = hasSelection
      ? { from: selection.from, to: selection.to }
      : null

    let selectionDoc: TipTapDoc | undefined
    if (hasSelection) {
      const slice = selection.content()
      selectionDoc = {
        type: 'doc',
        content: slice.content.toJSON(),
      }
    }

    let parentNode: TipTapDoc | undefined
    if (hasSelection) {
      const $from = selection.$from
      const parent = $from.parent
      const depth = $from.depth

      parentNode = depth > 0
        ? {
            type: 'doc',
            content: [parent.toJSON()],
          }
        : originalSnapshot.value
    }

    console.log('[Agent Request]', {
      prompt,
      model,
      documentName,
      hasSelection,
      documentSize: JSON.stringify(originalSnapshot.value).length,
    })

    let assistantMsg: AgentMessage | undefined
    let receivedStream = false

    const ensureAssistantMessage = (): AgentMessage => {
      if (!assistantMsg) {
        assistantMsg = addMessage('assistant', '', {
          status: 'streaming',
        })
      }
      return assistantMsg
    }

    const completeAssistantMessage = (content: string): void => {
      const msg = ensureAssistantMessage()
      msg.blocks = undefined
      msg.content = content
      msg.status = 'complete'
      streamingContent.value = content
    }

    const renderAssistantState = (
      data: SynnoiaAgentBackendResponse,
      messageStatus: AgentMessage['status'] = 'streaming',
    ): void => {
      const blocks = buildAgentBlocks(data)
      if (blocks.length === 0) {
        return
      }

      const msg = ensureAssistantMessage()
      msg.blocks = blocks
      msg.content = ''
      msg.status = messageStatus
    }

    const callbacks: SynnoiaAgentCallbacks = {
      onProcessing(message) {
        const msg = ensureAssistantMessage()
        msg.blocks = [
          { type: 'paragraph', text: message || 'Processing your request...' },
        ]
        msg.content = message || 'Processing your request...'
        msg.status = 'streaming'
      },
      // Full token+state callback — called for every streaming message from backend
      onToken(token, response) {
        const msg = ensureAssistantMessage()
        if (!receivedStream) {
          streamingContent.value = ''
          streamingTokens.value = ''
          msg.content = 'Working on your request...'
          receivedStream = true
        }

        const msgType = (response as any).type as string | undefined

        if (msgType === 'token') {
          // Raw character token from planner or writer node
          const node = (response as any).node || 'agent'
          streamingNode.value = node
          streamingTokens.value += token
          streamingContent.value += token
        } else if (msgType === 'values' || msgType === 'messages' || response.write_outline || response.diagram_outline) {
          // LangGraph state snapshot — extract planning outline and summary
          if ((response as any).node === 'planner') {
            streamingNode.value = 'planner'
          }
          if (response.write_outline && Array.isArray(response.write_outline)) {
            planningItems.value = normalizeWriteOutline(response.write_outline)
          }
          if (response.diagram_outline && Array.isArray(response.diagram_outline)) {
            const diagItems = normalizeDiagramOutline(response.diagram_outline)
            // Merge, avoiding duplicates
            const existing = new Set(planningItems.value.map(i => i.title))
            for (const item of diagItems) {
              if (!existing.has(item.title)) planningItems.value.push(item)
            }
          }
          if (response.action_summary) {
            streamingSummary.value = response.action_summary
          }
          // Update sidebar message with current progress
          const progress = parseStreamedBackendResult(streamingContent.value) || response
          renderAssistantState(progress, 'streaming')
        } else {
          // Fallback plain text token
          streamingContent.value += token
          const progress = parseStreamedBackendResult(streamingContent.value)
          if (progress) {
            renderAssistantState(progress, 'streaming')
          }
        }

        msg.status = 'streaming'
      },
      onError(message) {
        const friendlyMessage = formatAgentError(message)
        errorMessage.value = friendlyMessage
        const msg = ensureAssistantMessage()
        msg.blocks = [
          { type: 'heading', text: 'Error' },
          { type: 'paragraph', text: friendlyMessage },
        ]
        msg.content = `Error: ${friendlyMessage}`
        msg.status = 'error'
      },
    }

    try {
      const finalResult = await sendFn(
        prompt,
        originalSnapshot.value,
        selectionText,
        selectionDoc,
        parentNode,
        model,
        documentName,
        callbacks,
      )

      const recoveredResult = recoverFinalResult(finalResult)
      renderAssistantState(recoveredResult)
      await handleFinalResult(editor, recoveredResult, completeAssistantMessage, renderAssistantState)
    } catch (err: any) {
      errorMessage.value = formatAgentError(err?.message || 'An unexpected error occurred')
      if (assistantMsg?.status !== 'error') {
        addMessage('system', `Error: ${errorMessage.value}`, {
          status: 'error',
          blocks: [
            { type: 'heading', text: 'Error' },
            { type: 'paragraph', text: errorMessage.value },
          ],
        })
      }
      status.value = 'idle'
    }
  }

  async function handleFinalResult(
    editor: Editor,
    data: SynnoiaAgentBackendResponse,
    completeAssistantMessage: (content: string) => void,
    renderAssistantState: (
      data: SynnoiaAgentBackendResponse,
      messageStatus?: AgentMessage['status'],
    ) => void,
  ): Promise<void> {
    const intent = data.intent || (data.response_json || data.document || data.graph ? 'generation' : 'communication')

    switch (intent) {
      case 'chitchat':
        renderAssistantState(data, 'complete')
        status.value = 'idle'
        break

      case 'clarification':
        renderAssistantState(data, 'complete')
        status.value = 'idle'
        break

      case 'communication':
        renderAssistantState(data, 'complete')
        status.value = 'idle'
        break

      case 'generation':
        await handleGeneration(editor, data, completeAssistantMessage, renderAssistantState)
        break
    }
  }

  function recoverFinalResult(data: SynnoiaAgentBackendResponse): SynnoiaAgentBackendResponse {
    const streamedResult = parseStreamedBackendResult(streamingContent.value)
    if (!streamedResult) {
      return data
    }

    return {
      ...streamedResult,
      ...data,
      intent: data.intent || streamedResult.intent,
      task_type: data.task_type || streamedResult.task_type,
      write_outline: data.write_outline || streamedResult.write_outline,
      diagram_outline: data.diagram_outline || streamedResult.diagram_outline,
      operation_type: data.operation_type || streamedResult.operation_type,
      anchor_id: data.anchor_id ?? streamedResult.anchor_id,
      document: data.document || streamedResult.document,
      response_json: data.response_json || streamedResult.response_json,
      graph: data.graph || streamedResult.graph,
      diagram_json: data.diagram_json || streamedResult.diagram_json,
      action_summary: data.action_summary || streamedResult.action_summary,
    }
  }

  function hasActionableResult(data: SynnoiaAgentBackendResponse): boolean {
    return Boolean(
      data.response_json ||
      data.document ||
      data.graph ||
      data.diagram_json ||
      data.action_summary ||
      (
        data.intent &&
        data.intent !== 'generation'
      ),
    )
  }

  async function handleGeneration(
    editor: Editor,
    data: SynnoiaAgentBackendResponse,
    completeAssistantMessage: (content: string) => void,
    renderAssistantState: (
      data: SynnoiaAgentBackendResponse,
      messageStatus?: AgentMessage['status'],
    ) => void,
  ): Promise<void> {
    renderAssistantState(data)

    const graphXml = resolveDiagramXml(data)
    if (graphXml) {
      if (isDrawioXmlEmpty(graphXml)) {
        addMessage('system', 'Error: Diagram XML contains no visible shapes.', {
          status: 'error',
          blocks: [
            { type: 'heading', text: 'Error' },
            { type: 'paragraph', text: 'Diagram XML contains no visible shapes. Please check the backend graph/diagram_json output.' },
          ],
        })
        status.value = 'idle'
        return
      }

      const diagramNode = await createDiagramImageNode({
        graph: graphXml,
        title: data.title,
        diagramType: data.diagram_type,
      })
      const beforeDoc = captureSnapshot(editor)
      const diagramOperation = data.anchor_id
        ? 'insert'
        : data.operation_type && data.operation_type !== 'create'
          ? data.operation_type
          : 'append'
      const result = applyDocumentOperationToDoc(
        beforeDoc,
        {
          type: 'doc',
          content: [diagramNode],
        },
        diagramOperation,
        data.anchor_id,
      )

      if (result.error) {
        errorMessage.value = result.error
        addMessage('system', `Error: ${result.error}`, {
          status: 'error',
          blocks: [
            { type: 'heading', text: 'Error' },
            { type: 'paragraph', text: result.error },
          ],
        })
        status.value = 'idle'
        return
      }

      originalSnapshot.value = beforeDoc
      proposedContent.value = result.doc
      directProposal.value = true
      editor.commands.setContent(result.doc)
      renderAssistantState({
        ...data,
        graph: graphXml,
        operation_type: diagramOperation,
        action_summary: data.action_summary || `Previewing ${data.title || data.diagram_type || 'diagram'} in the document. Accept to keep it or reject to restore the previous document.`,
      }, 'complete')

      // Rule 2: Status never goes backwards once user action taken
      if (status.value === 'thinking' || status.value === 'proposing') {
        status.value = 'awaiting-confirmation'
      }
      return
    }

    const responseDoc = parseGeneratedDocument(data.response_json || data.document)
    if (!responseDoc) {
      renderAssistantState(data, 'complete')
      status.value = 'idle'
      return
    }

    const beforeDoc = captureSnapshot(editor)
    const result = applyDocumentOperationToDoc(
      beforeDoc,
      responseDoc,
      data.operation_type,
      data.anchor_id,
    )

    if (result.error) {
      errorMessage.value = result.error
      addMessage('system', `Error: ${result.error}`, {
        status: 'error',
        blocks: [
          { type: 'heading', text: 'Error' },
          { type: 'paragraph', text: result.error },
        ],
      })
      status.value = 'idle'
      return
    }

    // Compute inline diff document
    const diffBeforeDoc = {
      ...beforeDoc,
      content: isEmptyStarterDocument(beforeDoc.content) ? [] : beforeDoc.content,
    }
    const markedDoc = createDiffDocument(diffBeforeDoc, result.doc)

    // Render inline diff
    editor.commands.setContent(markedDoc)

    // Store proposal state
    originalSnapshot.value = beforeDoc
    proposedContent.value = result.doc
    directProposal.value = false

    const operationLabel = data.operation_type || 'update'
    renderAssistantState({
      ...data,
      action_summary: data.action_summary || `I've prepared changes to your document (${operationLabel}). Review the inline diff and accept or reject.`,
    }, 'complete')

    // Rule 2: Status never goes backwards once user action taken
    if (status.value === 'thinking' || status.value === 'proposing') {
      status.value = 'awaiting-confirmation'
    }
  }

  function buildAgentBlocks(data: SynnoiaAgentBackendResponse): AgentMessageBlock[] {
    const blocks: AgentMessageBlock[] = []
    const intent = data.intent ||
      (data.response_json || data.document || data.graph || data.diagram_json ? 'generation' : undefined)

    if (intent && intent !== 'chitchat' && intent !== 'clarification') {
      blocks.push(
        { type: 'heading', text: 'What user wants' },
        { type: 'paragraph', text: describeIntent(intent) },
      )
    }

    if (intent === 'chitchat') {
      addTextSection(blocks, 'Response', data.chitchat_response || data.response)
      return blocks
    }

    if (intent === 'clarification') {
      addTextSection(blocks, 'Please Clarify Your Request', data.clarification_question || data.response)
      return blocks
    }

    if (intent === 'communication') {
      if (data.response) {
        blocks.push({ type: 'paragraph', text: data.response })
      }
      return blocks
    }

    if (intent === 'generation') {
      const writeOutline = normalizeWriteOutline(data.write_outline)
      if (writeOutline.length > 0) {
        blocks.push({
          type: 'outline',
          title: 'Planning',
          items: writeOutline,
        })
      }

      const diagramOutline = normalizeDiagramOutline(data.diagram_outline)
      if (diagramOutline.length > 0) {
        blocks.push({
          type: 'outline',
          title: 'Planning',
          items: diagramOutline,
        })
      }

      const generatedJson = data.response_json || data.document
      if (generatedJson) {
        blocks.push({
          type: 'code',
          title: 'JSON',
          language: 'json',
          code: formatJson(generatedJson),
        })
      }

      if (typeof data.graph === 'string' && data.graph.trim()) {
        blocks.push({
          type: 'code',
          title: 'Generated XML',
          language: 'xml',
          code: data.graph,
        })
      }

      if (data.diagram_json) {
        blocks.push({
          type: 'code',
          title: 'Generated Diagram JSON',
          language: 'json',
          code: formatJson(data.diagram_json),
        })
      }

      if (data.action_summary) {
        blocks.push({ type: 'paragraph', text: data.action_summary })
      }
      return blocks
    }

    if (data.response) {
      blocks.push({ type: 'paragraph', text: data.response })
    }

    return blocks
  }

  function addTextSection(
    blocks: AgentMessageBlock[],
    heading: string,
    text: string | null | undefined,
  ): void {
    if (!text) {
      return
    }

    blocks.push(
      { type: 'heading', text: heading },
      { type: 'paragraph', text },
    )
  }

  function describeIntent(intent: string): string {
    const descriptions: Record<string, string> = {
      communication: 'User wants communication.',
      generation: 'User wants editing in the document.',
      chitchat: 'User is chatting.',
      clarification: 'User request needs clarification.',
    }

    return descriptions[intent] || `User intent: ${intent}.`
  }

  function inferTaskType(data: SynnoiaAgentBackendResponse): string {
    if ((data.graph || data.diagram_json) && !data.response_json && !data.document) {
      return 'diagram'
    }

    if (data.response_json || data.document) {
      return 'write'
    }

    return ''
  }

  function normalizeWriteOutline(value: unknown): AgentOutlineBlockItem[] {
    if (!Array.isArray(value)) return []
    return value.map((item: any, index) => ({
      title: String(item?.title || item?.section || item?.step || `Step ${index + 1}`),
      instructions: item?.instructions || item?.description || '',
      nodeTypes: Array.isArray(item?.node_types) ? item.node_types : Array.isArray(item?.nodes) ? item.nodes : (Array.isArray(item?.nodeTypes) ? item.nodeTypes : []),
    }))
  }

  function normalizeDiagramOutline(value: unknown): AgentOutlineBlockItem[] {
    if (!Array.isArray(value)) return []
    return value.map((item: any, index) => ({
      title: item.title ? `Generate Diagram: ${item.title}` : (item.type ? `Generate Diagram: ${item.type}` : `Diagram ${index + 1}`),
      instructions: item?.instructions || item?.description || '',
      diagramType: item?.diagram_type || item?.type || item?.diagramType || 'diagram',
    }))
  }

  function formatJson(value: unknown): string {
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2)
      } catch {
        return value
      }
    }
    return JSON.stringify(value, null, 2)
  }

  function formatAgentError(message: string): string {
    const normalized = message.toLowerCase()

    if (normalized.includes('insufficient_quota') || normalized.includes('exceeded your current quota')) {
      return 'The AI request could not be completed because the connected OpenAI account has reached its quota or billing limit. Please check the backend API key billing/usage settings, then try again.'
    }

    if (normalized.includes('rate limit') || normalized.includes('429')) {
      return 'The AI service is temporarily rate-limited. Please wait a moment and try again.'
    }

    if (normalized.includes('timeout')) {
      return 'The AI request took too long to finish. Please try again with a shorter request or retry in a moment.'
    }

    if (normalized.includes('failed to connect') || normalized.includes('websocket')) {
      return 'Synnoia could not connect to the local AI backend. Please make sure the backend server is running and try again.'
    }

    return message.replace(/^Agent execution failed:\s*/i, '')
  }

  function resolveDiagramXml(data: SynnoiaAgentBackendResponse): string | null {
    if (typeof data.graph === 'string' && data.graph.trim() && !isDrawioXmlEmpty(data.graph)) {
      return data.graph
    }

    const fromJson = diagramJsonToDrawioXml(data.diagram_json)
    if (fromJson) {
      return fromJson
    }

    return typeof data.graph === 'string' && data.graph.trim()
      ? data.graph
      : null
  }

  /**
   * Send a prompt to the agent. Takes the editor instance and the user prompt.
   * The `sendFn` callback handles the actual API call and returns the proposed content.
   */
  async function sendPromptLegacy(
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

    if (directProposal.value) {
      // Direct proposals (like diagrams) just need status update
      addHistoryEntry('accepted', lastPrompt.value)
      status.value = 'applied'
      proposedContent.value = null
      selectionRange.value = null
      directProposal.value = false

      setTimeout(() => {
        if (status.value === 'applied') status.value = 'idle'
      }, 2000)
      return
    }

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

    // Reset proposal state
    status.value = 'applied'
    proposedContent.value = null
    selectionRange.value = null
    directProposal.value = false

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

    if (directProposal.value && originalSnapshot.value) {
      editor.commands.setContent(originalSnapshot.value)
    } else {
      // Revert DiffAdded and DiffRemoved marks
      rejectDiffDocument(editor)
    }

    addHistoryEntry('rejected', lastPrompt.value)

    // Reset
    status.value = 'rejected'
    proposedContent.value = null
    selectionRange.value = null
    directProposal.value = false

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
    directProposal.value = false
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

    // Streaming sidebar state
    streamingNode,
    streamingTokens,
    streamingSummary,
    planningItems,

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
