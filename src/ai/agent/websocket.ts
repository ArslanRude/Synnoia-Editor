import { AGENT_WEBSOCKET_CONFIG } from './config'
import type { TipTapDoc } from '@/ai/diff'
import type { AgentRequest } from './types'

export class AgentWebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private pendingMessage: {
    resolve: (value: TipTapDoc | ReadableStream<string>) => void
    reject: (error: Error) => void
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
            const response = JSON.parse(event.data)

            if (this.pendingMessage) {
              if (response.error) {
                this.pendingMessage.reject(new Error(response.error))
              } else if (response.streaming) {
                // Handle streaming response
                this.messageBuffer = []
                const stream = new ReadableStream<string>({
                  start(controller) {
                    // Enqueue the initial chunk
                    if (response.chunk) {
                      controller.enqueue(response.chunk)
                    }
                  },
                })
                this.pendingMessage.resolve(stream)
                this.pendingMessage = null
              } else if (response.content) {
                // Handle static response with content field
                this.pendingMessage.resolve(response.content as TipTapDoc)
                this.pendingMessage = null
              } else if (response.type === 'doc' && Array.isArray(response.content)) {
                // Handle direct TipTapDoc response
                this.pendingMessage.resolve(response as TipTapDoc)
                this.pendingMessage = null
              } else {
                this.pendingMessage.reject(new Error('Invalid response format'))
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

  async sendAgentRequest(request: AgentRequest): Promise<TipTapDoc | ReadableStream<string>> {
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
