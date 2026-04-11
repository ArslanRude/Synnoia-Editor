export const WEBSOCKET_CONFIG = {
  // Update this URL to match your FastAPI WebSocket server
  URL: 'wss://synnoia-tab.up.railway.app/ws',

  // Connection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,

  // Suggestion settings
  DEBOUNCE_DELAY: 2000,
  PREFIX_CONTEXT_LENGTH: 10000,
  SUFFIX_CONTEXT_LENGTH: 10000,
}
