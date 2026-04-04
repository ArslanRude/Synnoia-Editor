import type { InsterContentType, SetContentType } from '@/types'

export const contentTransform = <T extends InsterContentType | SetContentType>(
  content: T,
) => {
  // Handle empty content or non-string content
  if (content && typeof content === 'string' && !content.startsWith('<')) {
    // Handle line breaks in plain text
    console.log(content.split('\n'))
    return content
      .split('\n')
      .map((line) => `<p>${line}</p>`)
      .join('')
  }

  return content
}
