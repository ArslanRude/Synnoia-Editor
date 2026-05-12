import type { TipTapDoc, TipTapNode } from '@/ai/diff'

import type { SynnoiaAgentBackendResponse, SynnoiaDocumentOperation, SynnoiaAgentIntent } from './types'

export interface DocumentOperationResult {
  doc: TipTapDoc
  error?: string
}

export function parseTipTapDoc(value: TipTapDoc | string | null | undefined): TipTapDoc | null {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as TipTapDoc
    } catch {
      return null
    }
  }

  return value
}

export function parseGeneratedDocument(value: unknown): TipTapDoc | null {
  const directDoc = parseTipTapDoc(value as TipTapDoc | string | null | undefined)
  if (directDoc?.type === 'doc') {
    return directDoc
  }

  const payload = typeof value === 'string'
    ? safeParseJson(value)
    : value

  const nodes = readBackendNodes(payload)
  if (!Array.isArray(nodes)) {
    return null
  }

  return {
    type: 'doc',
    content: nodes.map(convertBackendNode).filter(Boolean) as TipTapNode[],
  }
}

export function parseStreamedBackendResult(text: string): SynnoiaAgentBackendResponse | null {
  const objects = parseConcatenatedJsonObjects(text)
  if (objects.length === 0) {
    return null
  }

  const routerPayload = objects.find((item) => typeof item.intent === 'string')
  const operationPayload = objects.find(
    (item) => typeof item.operation_type === 'string' || typeof item.task_type === 'string',
  )
  const generatedPayload = [...objects]
    .reverse()
    .find((item) => item.response_json || item.document || item.graph || item.diagram_json || item.action_summary)

  if (!generatedPayload && !routerPayload) {
    return null
  }

  return {
    ...(routerPayload || {}),
    ...(operationPayload || {}),
    ...(generatedPayload || {}),
    intent: normalizeIntent(
      generatedPayload?.intent ||
      routerPayload?.intent ||
      (
        generatedPayload?.document ||
        generatedPayload?.response_json ||
        generatedPayload?.graph ||
        generatedPayload?.diagram_json
          ? 'generation'
          : undefined
      ),
    ),
    operation_type: generatedPayload?.operation_type || operationPayload?.operation_type || '',
    anchor_id: generatedPayload?.anchor_id ?? operationPayload?.anchor_id ?? null,
  }
}

export function applyDocumentOperationToDoc(
  currentDoc: TipTapDoc,
  newContent: TipTapDoc,
  operationType: SynnoiaDocumentOperation | undefined,
  anchorId: string | null | undefined,
): DocumentOperationResult {
  const newNodes = newContent.content || []
  const currentNodes = currentDoc.content || []
  const operation = operationType || 'create'

  switch (operation) {
    case 'create': {
      if (anchorId) {
        return insertAfterAnchor(currentNodes, newNodes, anchorId)
      }

      return {
        doc: {
          type: 'doc',
          content: newNodes,
        },
      }
    }

    case 'append':
      return {
        doc: {
          type: 'doc',
          content: [...currentNodes, ...newNodes],
        },
      }

    case 'prepend':
      return {
        doc: {
          type: 'doc',
          content: [...newNodes, ...currentNodes],
        },
      }

    case 'insert':
      return insertAfterAnchor(currentNodes, newNodes, anchorId)

    case 'replace': {
      const idx = findTopLevelAnchorIndex(currentNodes, anchorId)

      if (idx === -1) {
        return {
          doc: currentDoc,
          error: 'Could not find the target node to replace.',
        }
      }

      const updated = [...currentNodes]
      updated.splice(idx, 1, ...newNodes)

      return {
        doc: {
          type: 'doc',
          content: updated,
        },
      }
    }

    default:
      console.warn('Unknown operation_type:', operationType)
      return { doc: currentDoc }
  }
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parseConcatenatedJsonObjects(raw: string): any[] {
  const messages: any[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) {
        start = i
      }
      depth++
      continue
    }

    if (char === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        const candidate = raw.slice(start, i + 1)
        try {
          messages.push(JSON.parse(candidate))
        } catch {
          return []
        }
        start = -1
      }
    }
  }

  return depth === 0 ? messages : []
}

function normalizeIntent(value: unknown): SynnoiaAgentIntent | undefined {
  return value === 'chitchat' ||
    value === 'clarification' ||
    value === 'communication' ||
    value === 'generation'
    ? value
    : undefined
}

function readBackendNodes(payload: any): any[] | null {
  if (Array.isArray(payload?.nodes)) {
    return payload.nodes
  }

  if (Array.isArray(payload?.document?.nodes)) {
    return payload.document.nodes
  }

  if (Array.isArray(payload?.document?.document?.nodes)) {
    return payload.document.document.nodes
  }

  return null
}

function convertBackendNode(node: any): TipTapNode | null {
  if (!node || typeof node !== 'object') {
    return null
  }

  if (node.type === 'heading') {
    return {
      type: 'heading',
      attrs: cleanAttrs({
        id: node.id,
        toc_id: node.toc_id,
        level: node.level || 1,
        lineHeight: node.lineHeight,
        textAlign: node.textAlign,
        indent: node.indent,
        margin: normalizeMargin(node.margin),
      }),
      content: textContent(node.text),
    }
  }

  if (node.type === 'paragraph') {
    return {
      type: 'paragraph',
      attrs: cleanAttrs({
        id: node.id,
        textAlign: node.textAlign,
        lineHeight: node.lineHeight,
        indent: node.indent,
        margin: normalizeMargin(node.margin),
      }),
      content: convertSegments(node.segments, node.text),
    }
  }

  return {
    type: 'paragraph',
    attrs: cleanAttrs({ id: node.id }),
    content: textContent(node.text || ''),
  }
}

function convertSegments(segments: any[] | undefined, fallbackText: string | undefined): TipTapNode[] {
  if (!Array.isArray(segments) || segments.length === 0) {
    return textContent(fallbackText || '')
  }

  return segments
    .map((segment) => {
      const text = typeof segment?.text === 'string' ? segment.text : ''
      if (!text) {
        return null
      }

      return {
        type: 'text',
        text,
      }
    })
    .filter(Boolean) as TipTapNode[]
}

function textContent(text: string | undefined): TipTapNode[] {
  return text ? [{ type: 'text', text }] : []
}

function cleanAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(attrs).filter(([, value]) => value !== undefined && value !== null),
  )
}

function normalizeMargin(margin: any): Record<string, string> | undefined {
  if (!margin || typeof margin !== 'object') {
    return undefined
  }

  return {
    top: stripPx(margin.top),
    bottom: stripPx(margin.bottom),
  }
}

function stripPx(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value).replace(/px$/i, '')
}

function insertAfterAnchor(
  currentNodes: TipTapNode[],
  newNodes: TipTapNode[],
  anchorId: string | null | undefined,
): DocumentOperationResult {
  const idx = findTopLevelAnchorIndex(currentNodes, anchorId)

  if (idx === -1) {
    return {
      doc: {
        type: 'doc',
        content: [...currentNodes, ...newNodes],
      },
    }
  }

  const updated = [...currentNodes]
  updated.splice(idx + 1, 0, ...newNodes)

  return {
    doc: {
      type: 'doc',
      content: updated,
    },
  }
}

function findTopLevelAnchorIndex(
  nodes: TipTapNode[],
  anchorId: string | null | undefined,
): number {
  if (!anchorId) {
    return -1
  }

  return nodes.findIndex((node) => node.attrs?.id === anchorId)
}
