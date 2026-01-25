export const WEBSOCKET_CONFIG = {
  // Update this URL to match your FastAPI WebSocket server
  URL: 'ws://localhost:8000/ws',

  // Connection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,

  // Suggestion settings
  DEBOUNCE_DELAY: 2000,
  PREFIX_CONTEXT_LENGTH: 50,
  SUFFIX_CONTEXT_LENGTH: 50,
}
