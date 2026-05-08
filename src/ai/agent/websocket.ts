import { AGENT_WEBSOCKET_CONFIG } from './config'
import type { TipTapDoc } from '@/ai/diff'
import type { AgentRequest, SynnoiaAgentBackendRequest, SynnoiaAgentBackendResponse } from './types'

export interface AgentResponseWithMetadata {
  doc: TipTapDoc
  operation_type: 'create' | 'append' | 'prepend' | 'replace' | 'insert' | ''
  anchor_id: string | null
}

export class AgentWebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private pendingMessage: {
    resolve: (value: AgentResponseWithMetadata | ReadableStream<string>) => void
    reject: (error: Error) => void
    onStatus?: (status: string, message: string) => void
  } | null = null
  private messageBuffer: string[] = []

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    if (this.isConnecting) {
      return
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(AGENT_WEBSOCKET_CONFIG.URL)

        this.ws.onopen = () => {
          console.log('Agent WebSocket connected')
          this.reconnectAttempts = 0
          this.isConnecting = false
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const response: SynnoiaAgentBackendResponse = JSON.parse(event.data)

            if (this.pendingMessage) {
              // Handle error response
              if (response.error) {
                this.pendingMessage.reject(new Error(response.error))
                this.pendingMessage = null
                return
              }

              // Handle status/processing messages
              if (response.status === 'processing' && response.message) {
                if (this.pendingMessage.onStatus) {
                  this.pendingMessage.onStatus('processing', response.message)
                }
                return
              }

              // Handle response with response_json (TipTap document - already parsed)
              // Only apply if response_json has actual content
              const hasValidDoc = response.response_json &&
                response.response_json.type === 'doc' &&
                response.response_json.content &&
                response.response_json.content.length > 0

              if (hasValidDoc) {
                const result: AgentResponseWithMetadata = {
                  doc: response.response_json as TipTapDoc,
                  operation_type: response.operation_type || '',
                  anchor_id: response.anchor_id || null
                }
                this.pendingMessage.resolve(result)
                this.pendingMessage = null
                return
              }

              // Handle response with text content only (no document changes or empty response_json)
              if (response.response) {
                // Create a stream from the text response to show in sidebar
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

              // Handle streaming flag
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
                return
              }
            }
          } catch (error) {
            // If JSON parse fails, treat as streaming chunk
            if (this.pendingMessage) {
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

        this.ws.onclose = () => {
          console.log('Agent WebSocket disconnected')
          this.isConnecting = false
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
          reject(new Error('WebSocket connection failed'))
        }
      } catch (error) {
        this.isConnecting = false
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
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
      this.pendingMessage = { resolve, reject }

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
    onStatus?: (status: string, message: string) => void
  ): Promise<AgentResponseWithMetadata | ReadableStream<string>> {
    // Ensure connection is established
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      try {
        await this.connect()
      } catch (error) {
        throw new Error('Failed to connect to Agent WebSocket server')
      }
    }

    return new Promise((resolve, reject) => {
      this.pendingMessage = { resolve, reject, onStatus }

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
    this.pendingMessage = null
    this.messageBuffer = []
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Create a singleton instance
export const agentWebSocketService = new AgentWebSocketService()
