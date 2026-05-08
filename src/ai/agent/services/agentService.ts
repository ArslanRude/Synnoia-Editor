/**
 * AI Agent Service
 *
 * Client-side service for communicating with the AI backend.
 * Uses WebSocket for real-time communication.
 */
import type { TipTapDoc } from '@/ai/diff'

import type { AgentRequest, SynnoiaAgentBackendRequest, SynnoiaAgentBackendResponse } from '../types'
import { agentWebSocketService, type AgentResponseWithMetadata } from '../websocket'

/**
 * Send a prompt to the Synnoia Agent backend via WebSocket.
 * Transforms the frontend AgentRequest to the backend format.
 * Returns either a TipTapDoc (static) or a ReadableStream (streaming).
 */
export async function sendSynnoiaAgentRequest(
  prompt: string,
  document: TipTapDoc,
  selectionText = '',
  selectionDoc?: TipTapDoc,
  parentNode?: TipTapDoc,
  model?: string,
  documentName?: string,
): Promise<AgentResponseWithMetadata | ReadableStream<string>> {
  // Get document text content
  const getDocText = (doc: TipTapDoc): string => {
    if (!doc.content) return ''
    return doc.content
      .map((node: any) => {
        if (node.type === 'text') return node.text || ''
        if (node.content) return getDocText({ type: 'doc', content: node.content })
        return ''
      })
      .join(' ')
  }

  const docText = getDocText(document)

  // Transform to backend format
  const backendRequest: SynnoiaAgentBackendRequest = {
    query: prompt,
    document_name: documentName || 'Untitled Document',
    doc_text: selectionText || docText,
    doc_json: selectionDoc || document,
  }

  try {
    const result = await agentWebSocketService.sendSynnoiaAgentRequest(backendRequest)
    return result
  } catch (err: any) {
    if (err.message?.includes('timed out')) {
      throw new Error('Agent request timed out')
    }
    throw err
  }
}

/**
 * Send a prompt to a generic agent backend via WebSocket.
 * Returns either a TipTapDoc (static) or a ReadableStream (streaming).
 */
export async function sendAgentRequest(
  prompt: string,
  document: TipTapDoc,
  selectionText = '',
  selectionDoc?: TipTapDoc,
  parentNode?: TipTapDoc,
  model?: string,
  documentName?: string,
): Promise<AgentResponseWithMetadata | ReadableStream<string>> {
  const request: AgentRequest = {
    prompt,
    document,
    selectionDoc,
    parentNode,
    selectionText,
    hasSelection: !!selectionDoc,
    model,
    documentName,
  }

  try {
    const result = await agentWebSocketService.sendAgentRequest(request)
    return result
  } catch (err: any) {
    if (err.message?.includes('timed out')) {
      throw new Error('Agent request timed out')
    }
    throw err
  }
}

/**
 * Mock handler for development — returns a slightly modified version of the document.
 * Used when no backend is available.
 */
export async function sendMockAgentRequest(
  prompt: string,
  document: TipTapDoc,
  _selectionText = '',
  _selectionDoc?: TipTapDoc,
  _parentNode?: TipTapDoc,
  _model?: string,
  _documentName?: string,
): Promise<AgentResponseWithMetadata> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1500 + Math.random() * 1000),
  )

  // Create a modified copy of the document
  const modified = JSON.parse(JSON.stringify(document)) as TipTapDoc

  if (modified.content && modified.content.length > 0) {
    // Add an AI-generated paragraph at the end
    modified.content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `[AI Agent] Response to "${prompt}": This is a mock change to demonstrate the diff system. In production, this would be the AI-modified document.`,
        },
      ],
    })

    // If prompt mentions "concise" or "shorter", trim some content
    if (
      prompt.toLowerCase().includes('concise') ||
      prompt.toLowerCase().includes('shorter')
    ) {
      if (modified.content.length > 3) {
        modified.content = modified.content.slice(
          0,
          Math.ceil(modified.content.length / 2),
        )
      }
    }

    // If prompt mentions "heading" or "title", add one
    if (
      prompt.toLowerCase().includes('heading') ||
      prompt.toLowerCase().includes('title')
    ) {
      modified.content.unshift({
        type: 'heading',
        attrs: { level: 2 },
        content: [
          {
            type: 'text',
            text: 'AI-Generated Section',
          },
        ],
      })
    }
  }

  return {
    doc: modified,
    operation_type: '',
    anchor_id: null,
  }
}
