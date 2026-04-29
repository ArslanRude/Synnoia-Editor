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
}

export interface AgentResponse {
  content: TipTapDoc | string
  streaming?: boolean
}

export interface UndoEntry {
  originalDoc: TipTapDoc
  appliedDoc: TipTapDoc
  prompt: string
  timestamp: Date
}
