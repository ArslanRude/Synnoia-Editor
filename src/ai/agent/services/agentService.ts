/**
 * AI Agent Service
 *
 * Client-side service for communicating with the AI backend.
 * Routes requests through /api/agent (Vite proxy in dev).
 */
import type { TipTapDoc } from '@/ai/diff'

import type { AgentRequest } from '../types'

const AGENT_ENDPOINT = '/api/agent'
const REQUEST_TIMEOUT = 60000 // 60s

/**
 * Send a prompt to the agent backend.
 * Returns either a TipTapDoc (static) or a ReadableStream (streaming).
 */
export async function sendAgentRequest(
  prompt: string,
  document: TipTapDoc,
  selectionText = '',
  selectionDoc?: TipTapDoc,
  parentNode?: TipTapDoc,
  model?: string,
): Promise<TipTapDoc | ReadableStream<string>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(AGENT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        document,
        selectionDoc,
        parentNode,
        selectionText,
        hasSelection: !!selectionDoc,
        model,
      } satisfies AgentRequest),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Agent request failed (${response.status}): ${errorText}`)
    }

    const contentType = response.headers.get('content-type') || ''

    // Streaming response (SSE or ndjson)
    if (
      contentType.includes('text/event-stream') ||
      contentType.includes('application/x-ndjson') ||
      contentType.includes('text/plain')
    ) {
      if (!response.body) {
        throw new Error('Streaming response has no body')
      }

      return response.body.pipeThrough(new TextDecoderStream())
    }

    // Static JSON response
    const data = await response.json()

    // Validate it looks like a TipTap doc
    if (data && data.type === 'doc' && Array.isArray(data.content)) {
      return data as TipTapDoc
    }

    // If response has a content field with the doc
    if (data?.content?.type === 'doc') {
      return data.content as TipTapDoc
    }

    throw new Error('Invalid response format from agent')
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Agent request timed out')
    }
    throw err
  }
}

/**
 * Mock handler for development — returns a slightly modified version of the document.
 * Used when no backend is available.
 */
export async function sendMockAgentRequest(
  prompt: string,
  document: TipTapDoc,
  _selectionText = '',
  _selectionDoc?: TipTapDoc,
  _parentNode?: TipTapDoc,
): Promise<TipTapDoc> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1500 + Math.random() * 1000),
  )

  // Create a modified copy of the document
  const modified = JSON.parse(JSON.stringify(document)) as TipTapDoc

  if (modified.content && modified.content.length > 0) {
    // Add an AI-generated paragraph at the end
    modified.content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `[AI Agent] Response to "${prompt}": This is a mock change to demonstrate the diff system. In production, this would be the AI-modified document.`,
        },
      ],
    })

    // If prompt mentions "concise" or "shorter", trim some content
    if (
      prompt.toLowerCase().includes('concise') ||
      prompt.toLowerCase().includes('shorter')
    ) {
      if (modified.content.length > 3) {
        modified.content = modified.content.slice(
          0,
          Math.ceil(modified.content.length / 2),
        )
      }
    }

    // If prompt mentions "heading" or "title", add one
    if (
      prompt.toLowerCase().includes('heading') ||
      prompt.toLowerCase().includes('title')
    ) {
      modified.content.unshift({
        type: 'heading',
        attrs: { level: 2 },
        content: [
          {
            type: 'text',
            text: 'AI-Generated Section',
          },
        ],
      })
    }
  }

  return modified
}
