export const getSuggestion = async (text: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (text.endsWith('The quick brown')) {
        resolve(' fox jumps over the lazy dog')
      } else if (text.endsWith('Hello world')) {
        resolve(' is a common test phrase')
      } else {
        resolve('Arslan is a common test phrase')
      }
    }, 500)
  })
}
