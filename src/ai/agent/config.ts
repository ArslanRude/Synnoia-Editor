export const AGENT_WEBSOCKET_CONFIG = {
  // Production WebSocket URL (Railway)
  PROD_URL: 'wss://synnoiaagent-production.up.railway.app/ws/agent',

  // Local development WebSocket URL (FastAPI backend)
  DEV_URL: 'ws://localhost:8000/ws/agent',

  // Use local backend in development, production URL in production builds
  get URL() {
    // Check if we're in development mode (Vite dev server)
    const isDev = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1')
    const envUrl = import.meta.env.VITE_SYNNOIA_AGENT_WS_URL
    if (envUrl) {
      return envUrl
    }
    return isDev ? this.DEV_URL : this.PROD_URL
  },

  // Connection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,

  // Request settings
  REQUEST_TIMEOUT: 60000, // 60 seconds

  // Heartbeat settings (matches backend ws_ping_interval)
  HEARTBEAT_INTERVAL: 15000, // 15s
  HEARTBEAT_TIMEOUT: 15000, // 15s
}
