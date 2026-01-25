import { websocketService } from '../../services/websocket'

export const getSuggestion = async (
  prefixText: string,
  suffixText: string,
): Promise<string> => {
  try {
    const suggestion = await websocketService.getSuggestion(
      prefixText,
      suffixText,
    )
    return suggestion
  } catch (error) {
    console.error('Failed to get suggestion from WebSocket:', error)
    // Fallback to empty string if WebSocket fails
    return 'Error '
  }
}
