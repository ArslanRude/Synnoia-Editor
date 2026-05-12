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
  blocks?: AgentMessageBlock[]
  timestamp: Date
  status?: 'streaming' | 'complete' | 'error'
}

export interface AgentMessageBlock {
  type: 'heading' | 'paragraph' | 'outline' | 'code'
  text?: string
  title?: string
  language?: 'json' | 'xml'
  code?: string
  items?: AgentOutlineBlockItem[]
}

export interface AgentOutlineBlockItem {
  title: string
  instructions?: string
  nodeTypes?: string[]
  diagramType?: string
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
  doc_text: string // Plain text of document
  doc_json: string // Stringified TipTap document JSON
  model: string // Selected AI model name
}

/**
 * Backend response format (what the FastAPI server returns)
 */
export type SynnoiaAgentIntent =
  | 'chitchat'
  | 'clarification'
  | 'communication'
  | 'generation'

export type SynnoiaDocumentOperation =
  | 'create'
  | 'append'
  | 'prepend'
  | 'replace'
  | 'insert'
  | ''

export interface SynnoiaAgentBackendResponse {
  status?: 'processing' | 'streaming' | 'error' | 'complete'
  message?: string // Status/processing message
  result?: unknown // Intermediate backend completion envelope
  token?: string // Streaming token
  intent?: SynnoiaAgentIntent // Final response routing intent
  response?: string // Text response from AI
  chitchat_response?: string // Final chitchat response
  clarification_question?: string // Final clarification prompt
  response_json?: TipTapDoc | string | null // Modified document as TipTap JSON
  document?: unknown // Planner/writer document payload from backend
  error?: string // Error message
  pong?: string // Heartbeat response
  streaming?: boolean // Flag for streaming response
  chunk?: string // Streaming chunk
  task_type?: string
  write_outline?: unknown[]
  diagram_outline?: unknown[]
  diagram_json?: unknown
  operation_type?: SynnoiaDocumentOperation
  anchor_id?: string | null
  diagram_type?: string
  title?: string
  graph?: string
  action_summary?: string
}

export interface UndoEntry {
  originalDoc: TipTapDoc
  appliedDoc: TipTapDoc
  prompt: string
  timestamp: Date
}
