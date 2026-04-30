export const AGENT_WEBSOCKET_CONFIG = {
  // Update this URL to match your FastAPI WebSocket server for AI agent
  URL: 'wss://synnoia-agent.up.railway.app/ws',

  // Connection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,

  // Request settings
  REQUEST_TIMEOUT: 60000, // 60s
}
