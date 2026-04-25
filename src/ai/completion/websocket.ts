import { WEBSOCKET_CONFIG } from './config'

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private isConnecting = false
  private pendingMessage: {
    resolve: (value: string) => void
    reject: (error: Error) => void
  } | null = null

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
        this.ws = new WebSocket(WEBSOCKET_CONFIG.URL)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
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
              } else if (response.suggestion) {
                // Handle new response format: {suggestion, cached}
                if (response.cached) {
                  console.log('Suggestion served from cache')
                }
                this.pendingMessage.resolve(response.suggestion)
              } else {
                this.pendingMessage.reject(new Error('Invalid response format'))
              }
              this.pendingMessage = null
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
            if (this.pendingMessage) {
              this.pendingMessage.reject(new Error('Invalid response format'))
              this.pendingMessage = null
            }
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
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
          console.error('WebSocket error:', error)
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
    if (this.reconnectAttempts >= WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS})...`,
    )

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error)
      })
    }, WEBSOCKET_CONFIG.RECONNECT_DELAY * this.reconnectAttempts)
  }

  async getSuggestion(prefixText: string, suffixText: string): Promise<string> {
    // Check if both prefix and suffix are empty or only whitespace
    const trimmedPrefix = prefixText.trim()
    const trimmedSuffix = suffixText.trim()
    if (!trimmedPrefix && !trimmedSuffix) {
      return Promise.reject(
        new Error('Cannot send request with empty prefix and suffix'),
      )
    }

    // Ensure connection is established
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      try {
        await this.connect()
      } catch (error) {
        throw new Error('Failed to connect to WebSocket server')
      }
    }

    return new Promise((resolve, reject) => {
      this.pendingMessage = { resolve, reject }

      const message = JSON.stringify({
        prefix_text: prefixText,
        suffix_text: suffixText,
      })

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
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService()
