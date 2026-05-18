import { AGENT_WEBSOCKET_CONFIG } from './config'
import type { TipTapDoc } from '@/ai/diff'
import type { AgentRequest, SynnoiaAgentBackendRequest, SynnoiaAgentBackendResponse } from './types'

export interface AgentResponseWithMetadata {
  doc: TipTapDoc
  operation_type: 'create' | 'append' | 'prepend' | 'replace' | 'insert' | ''
  anchor_id: string | null
}

export interface SynnoiaAgentCallbacks {
  onProcessing?: (message: string) => void
  onToken?: (token: string, response: SynnoiaAgentBackendResponse) => void
  onFinal?: (response: SynnoiaAgentBackendResponse) => void
  onError?: (message: string) => void
}

type PendingMessage = {
  mode: 'legacy' | 'synnoia'
  resolve: (value: any) => void
  reject: (error: Error) => void
  callbacks?: SynnoiaAgentCallbacks
}

export class AgentWebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private connectionPromise: Promise<void> | null = null
  private pendingMessage: PendingMessage | null = null
  private messageBuffer: string[] = []

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    if (this.isConnecting) {
      return this.connectionPromise ?? Promise.resolve()
    }

    this.isConnecting = true

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(AGENT_WEBSOCKET_CONFIG.URL)

        this.ws.onopen = () => {
          console.log('Agent WebSocket connected')
          this.reconnectAttempts = 0
          this.isConnecting = false
          this.connectionPromise = null
          resolve()
        }

        this.ws.onmessage = (event) => {
          const responses = parseWebSocketMessages(event.data)

          if (responses.length > 0) {
            for (const response of responses) {
              if (!this.pendingMessage) {
                break
              }

              this.pendingMessage.mode === 'synnoia'
                ? this.handleSynnoiaMessage(response)
                : this.handleLegacyMessage(response)
            }
            return
          }

          {
            // If JSON parse fails, treat as streaming chunk
            if (this.pendingMessage) {
              if (this.pendingMessage.mode === 'synnoia') {
                this.pendingMessage.callbacks?.onToken?.(event.data, { token: event.data, status: 'streaming' })
              } else {
                const stream = new ReadableStream<string>({
                  start(controller) {
                    controller.enqueue(event.data)
                    controller.close()
                  },
                })
                this.pendingMessage.resolve(stream)
                this.pendingMessage = null
              }
            }
          }
        }

        this.ws.onclose = () => {
          console.log('Agent WebSocket disconnected')
          this.isConnecting = false
          this.connectionPromise = null
          this.ws = null

          // Reject any pending message
          if (this.pendingMessage) {
            this.pendingMessage.reject(new Error('WebSocket disconnected'))
            this.pendingMessage = null
          }

          // Attempt to reconnect
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('Agent WebSocket error:', error)
          this.isConnecting = false
          this.connectionPromise = null
          reject(new Error('WebSocket connection failed'))
        }
      } catch (error) {
        this.isConnecting = false
        this.connectionPromise = null
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })

    return this.connectionPromise
  }

  private handleSynnoiaMessage(response: SynnoiaAgentBackendResponse): void {
    if (!this.pendingMessage) {
      return
    }

    // 1. Error handling
    if (response.error || response.status === 'error' || (response as any).type === 'error') {
      const message = response.error || response.message || 'Agent request failed.'
      this.pendingMessage.callbacks?.onError?.(message)
      this.pendingMessage.reject(new Error(message))
      this.pendingMessage = null
      return
    }

    // 2. Processing status (do not resolve promise)
    if (response.status === 'processing' || (response as any).type === 'status') {
      this.pendingMessage.callbacks?.onProcessing?.(
        response.message || 'Processing your request...',
      )
      return
    }

    // 3. Streaming / planning tokens — ALWAYS call onToken first before checking for final
    // This captures: type='token' (raw chars), type='values' (LangGraph state with outlines),
    // type='messages', and any message carrying write_outline / diagram_outline.
    const isStreamingEvent = (
      response.status === 'streaming' ||
      (response as any).type === 'token' ||
      (response as any).type === 'values' ||
      (response as any).type === 'messages' ||
      response.write_outline ||
      response.diagram_outline
    )

    if (isStreamingEvent) {
      const token = response.token ?? response.chunk ?? (response as any).message ?? response.response ?? ''
      this.pendingMessage.callbacks?.onToken?.(token, response)

      // Only fall through to promise resolution if this message ALSO carries a final payload
      const hasFinalpayload = (
        (response as any).type === 'complete' ||
        response.response_json ||
        response.chitchat_response ||
        response.clarification_question
      )
      if (!hasFinalpayload) {
        return  // pure streaming event — do NOT resolve promise
      }
      // has both streaming data AND final payload — fall through to resolve below
    }

    // 4. Final result — resolve promise
    if (
      (response as any).type === 'complete' ||
      response.response_json ||
      response.chitchat_response ||
      response.clarification_question ||
      isBackendFinalEnvelope(response)
    ) {
      this.pendingMessage.callbacks?.onFinal?.(response)
      this.pendingMessage.resolve(response)
      this.pendingMessage = null
      return
    }

    // 5. status='complete' with no payload — gracefully ignore
    if (response.status === 'complete') {
      return
    }
  }

  private handleLegacyMessage(response: SynnoiaAgentBackendResponse): void {
    if (!this.pendingMessage) {
      return
    }

    if (response.error || response.status === 'error') {
      this.pendingMessage.reject(new Error(response.error || response.message || 'Agent request failed.'))
      this.pendingMessage = null
      return
    }

    const responseJson = typeof response.response_json === 'string'
      ? JSON.parse(response.response_json)
      : response.response_json

    const hasValidDoc = responseJson &&
      responseJson.type === 'doc' &&
      responseJson.content &&
      responseJson.content.length > 0

    if (hasValidDoc) {
      const result: AgentResponseWithMetadata = {
        doc: responseJson as TipTapDoc,
        operation_type: response.operation_type || '',
        anchor_id: response.anchor_id || null
      }
      this.pendingMessage.resolve(result)
      this.pendingMessage = null
      return
    }

    if (response.response) {
      const stream = new ReadableStream<string>({
        start(controller) {
          controller.enqueue(response.response || '')
          controller.close()
        },
      })
      this.pendingMessage.resolve(stream)
      this.pendingMessage = null
      return
    }

    if (response.streaming) {
      this.messageBuffer = []
      const stream = new ReadableStream<string>({
        start(controller) {
          if (response.response) {
            controller.enqueue(response.response)
          }
        },
      })
      this.pendingMessage.resolve(stream)
      this.pendingMessage = null
    }
  }

  // Native WebSocket ping/pong handled by browser and FastAPI backend
  // ws_ping_interval=20s is configured in FastAPI uvicorn
  // No custom heartbeat needed - browser handles it automatically

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= AGENT_WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached for Agent WebSocket')
      return
    }

    this.reconnectAttempts++
    console.log(
      `Attempting to reconnect Agent WebSocket (${this.reconnectAttempts}/${AGENT_WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS})...`,
    )

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Agent WebSocket reconnection failed:', error)
      })
    }, AGENT_WEBSOCKET_CONFIG.RECONNECT_DELAY * this.reconnectAttempts)
  }

  async sendAgentRequest(request: AgentRequest): Promise<AgentResponseWithMetadata | ReadableStream<string>> {
    // Ensure connection is established
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      try {
        await this.connect()
      } catch (error) {
        throw new Error('Failed to connect to Agent WebSocket server')
      }
    }

    return new Promise((resolve, reject) => {
      this.pendingMessage = { mode: 'legacy', resolve, reject }

      const message = JSON.stringify(request)

      try {
        this.ws!.send(message)
      } catch (error) {
        this.pendingMessage = null
        reject(new Error('Failed to send message'))
      }
    })
  }

  async sendSynnoiaAgentRequest(
    request: SynnoiaAgentBackendRequest,
    callbacks: SynnoiaAgentCallbacks = {},
  ): Promise<SynnoiaAgentBackendResponse> {
    // Ensure connection is established
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      try {
        await this.connect()
      } catch (error) {
        throw new Error('Failed to connect to Agent WebSocket server')
      }
    }

    return new Promise((resolve, reject) => {
      this.pendingMessage = { mode: 'synnoia', resolve, reject, callbacks }

      const message = JSON.stringify(request)

      try {
        this.ws!.send(message)
      } catch (error) {
        this.pendingMessage = null
        reject(new Error('Failed to send message'))
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnecting = false
    this.connectionPromise = null
    this.pendingMessage = null
    this.messageBuffer = []
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Create a singleton instance
export const agentWebSocketService = new AgentWebSocketService()

function hasActionableFinalResponse(response: SynnoiaAgentBackendResponse): boolean {
  return Boolean(
    response.response_json ||
    response.document ||
    response.graph ||
    response.diagram_json ||
    response.action_summary ||
    (
      response.intent !== undefined &&
      response.intent !== 'generation'
    ),
  )
}

function isBackendFinalEnvelope(response: SynnoiaAgentBackendResponse): boolean {
  return response.status === undefined &&
    (
      Object.prototype.hasOwnProperty.call(response, 'response_json') ||
      Object.prototype.hasOwnProperty.call(response, 'operation_type') ||
      Object.prototype.hasOwnProperty.call(response, 'graph') ||
      Object.prototype.hasOwnProperty.call(response, 'diagram_json') ||
      Object.prototype.hasOwnProperty.call(response, 'action_summary') ||
      Object.prototype.hasOwnProperty.call(response, 'chitchat_response') ||
      Object.prototype.hasOwnProperty.call(response, 'clarification_question')
    )
}

function parseWebSocketMessages(raw: string): SynnoiaAgentBackendResponse[] {
  try {
    return [JSON.parse(raw) as SynnoiaAgentBackendResponse]
  } catch {
    return parseConcatenatedJsonObjects(raw)
  }
}

function parseConcatenatedJsonObjects(raw: string): SynnoiaAgentBackendResponse[] {
  const messages: SynnoiaAgentBackendResponse[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) {
        start = i
      }
      depth++
      continue
    }

    if (char === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        const candidate = raw.slice(start, i + 1)
        try {
          messages.push(JSON.parse(candidate) as SynnoiaAgentBackendResponse)
        } catch {
          return []
        }
        start = -1
      }
    }
  }

  return depth === 0 ? messages : []
}
