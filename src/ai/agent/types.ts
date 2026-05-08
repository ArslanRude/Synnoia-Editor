import type { TipTapDoc } from '@/ai/diff'

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'proposing'
  | 'awaiting-confirmation'
  | 'applied'
  | 'rejected'

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  status?: 'streaming' | 'complete' | 'error'
}

export interface HistoryEntry {
  id: string
  action: 'accepted' | 'rejected'
  prompt: string
  timestamp: Date
}

export interface AgentRequest {
  prompt: string
  document: TipTapDoc // Always full document (for context/undo)
  selectionDoc?: TipTapDoc // Selected content as JSON (if selection exists)
  parentNode?: TipTapDoc // Full parent node containing the selection
  selectionText?: string // Plain text of selection (for reference)
  hasSelection: boolean // Flag to indicate selection mode
  model?: string // Selected AI model name
  documentName?: string // Document name
}

export interface AgentResponse {
  content: TipTapDoc | string
  streaming?: boolean
}

/**
 * Backend request format (what the FastAPI server expects)
 */
export interface SynnoiaAgentBackendRequest {
  query: string // User's prompt
  document_name: string // Document name
  doc_text: string // Plain text of document
  doc_json: TipTapDoc | string // TipTap document JSON
}

/**
 * Backend response format (what the FastAPI server returns)
 */
export interface SynnoiaAgentBackendResponse {
  status?: 'processing' | 'error' | 'complete'
  message?: string // Status/processing message
  response?: string // Text response from AI
  response_json?: TipTapDoc | null // Modified document as TipTap JSON
  error?: string // Error message
  pong?: string // Heartbeat response
  streaming?: boolean // Flag for streaming response
  chunk?: string // Streaming chunk
  operation_type?: 'create' | 'append' | 'prepend' | 'replace' | 'insert' | ''
  anchor_id?: string | null
}

export interface UndoEntry {
  originalDoc: TipTapDoc
  appliedDoc: TipTapDoc
  prompt: string
  timestamp: Date
}
