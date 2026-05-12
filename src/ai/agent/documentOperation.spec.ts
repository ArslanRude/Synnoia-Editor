import { describe, expect, it } from 'vitest'

import type { TipTapDoc } from '@/ai/diff'

import { applyDocumentOperationToDoc, parseGeneratedDocument, parseStreamedBackendResult } from './documentOperation'

const currentDoc: TipTapDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', attrs: { id: 'a' }, content: [{ type: 'text', text: 'A' }] },
    { type: 'paragraph', attrs: { id: 'b' }, content: [{ type: 'text', text: 'B' }] },
  ],
}

const generatedDoc: TipTapDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', attrs: { id: 'x' }, content: [{ type: 'text', text: 'X' }] },
  ],
}

describe('applyDocumentOperationToDoc', () => {
  it('replaces the whole document for create without an anchor', () => {
    const result = applyDocumentOperationToDoc(currentDoc, generatedDoc, 'create', null)

    expect(result.doc.content).toEqual(generatedDoc.content)
  })

  it('inserts after the anchor for create with an anchor', () => {
    const result = applyDocumentOperationToDoc(currentDoc, generatedDoc, 'create', 'a')

    expect(result.doc.content.map((node) => node.attrs?.id)).toEqual(['a', 'x', 'b'])
  })

  it('appends generated nodes', () => {
    const result = applyDocumentOperationToDoc(currentDoc, generatedDoc, 'append', null)

    expect(result.doc.content.map((node) => node.attrs?.id)).toEqual(['a', 'b', 'x'])
  })

  it('prepends generated nodes', () => {
    const result = applyDocumentOperationToDoc(currentDoc, generatedDoc, 'prepend', null)

    expect(result.doc.content.map((node) => node.attrs?.id)).toEqual(['x', 'a', 'b'])
  })

  it('inserts after an anchor and appends when the anchor is missing', () => {
    const anchored = applyDocumentOperationToDoc(currentDoc, generatedDoc, 'insert', 'b')
    const missing = applyDocumentOperationToDoc(currentDoc, generatedDoc, 'insert', 'missing')

    expect(anchored.doc.content.map((node) => node.attrs?.id)).toEqual(['a', 'b', 'x'])
    expect(missing.doc.content.map((node) => node.attrs?.id)).toEqual(['a', 'b', 'x'])
  })

  it('replaces only the anchor node', () => {
    const result = applyDocumentOperationToDoc(currentDoc, generatedDoc, 'replace', 'a')

    expect(result.doc.content.map((node) => node.attrs?.id)).toEqual(['x', 'b'])
  })

  it('does nothing and returns an error when replace anchor is missing', () => {
    const result = applyDocumentOperationToDoc(currentDoc, generatedDoc, 'replace', 'missing')

    expect(result.error).toBe('Could not find the target node to replace.')
    expect(result.doc).toBe(currentDoc)
  })
})

describe('parseGeneratedDocument', () => {
  it('converts backend document.document.nodes into TipTap JSON', () => {
    const result = parseGeneratedDocument({
      document: {
        document: {
          nodes: [
            {
              type: 'heading',
              level: 1,
              text: 'Introduction',
              id: 'sec-intro',
              lineHeight: '1.2',
              margin: { top: '0', bottom: '8px' },
            },
            {
              type: 'paragraph',
              id: 'p-intro-1',
              segments: [
                {
                  text: 'Football is one of the most influential sports.',
                },
              ],
            },
          ],
        },
      },
    })

    expect(result).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: {
            id: 'sec-intro',
            level: 1,
            lineHeight: '1.2',
            margin: { top: '0', bottom: '8' },
          },
          content: [{ type: 'text', text: 'Introduction' }],
        },
        {
          type: 'paragraph',
          attrs: {
            id: 'p-intro-1',
          },
          content: [{ type: 'text', text: 'Football is one of the most influential sports.' }],
        },
      ],
    })
  })
})

describe('parseStreamedBackendResult', () => {
  it('recovers generation payload from streamed concatenated JSON', () => {
    const result = parseStreamedBackendResult(
      '{"rephrased_query":"Write an essay","intent":"generation","clarification_question":"","chitchat_response":""}' +
      '{"task_type":"write","operation_type":"create","anchor_id":null,"write_outline":[],"diagram_outline":[]}' +
      '{"document":{"document":{"nodes":[{"type":"heading","level":1,"text":"Introduction","id":"sec-intro"}]}},"action_summary":"Created essay."}',
    )

    expect(result?.intent).toBe('generation')
    expect(result?.operation_type).toBe('create')
    expect(result?.anchor_id).toBeNull()
    expect(result?.action_summary).toBe('Created essay.')
    expect(parseGeneratedDocument(result?.document)?.content[0]).toEqual({
      type: 'heading',
      attrs: {
        id: 'sec-intro',
        level: 1,
      },
      content: [{ type: 'text', text: 'Introduction' }],
    })
  })

  it('recovers diagram_json from streamed diagram payload', () => {
    const result = parseStreamedBackendResult(
      '{"rephrased_query":"Make a diagram","intent":"generation"}' +
      '{"task_type":"diagram","diagram_outline":[{"title":"Flow","diagram_type":"flowchart","instructions":"Show steps."}]}' +
      '{"diagram_json":{"cells":[{"id":"2","value":"Start","vertex":"1","parent":"1","geometry":{"x":120,"y":80,"width":120,"height":60}}]},"action_summary":"Created diagram."}',
    )

    expect(result?.intent).toBe('generation')
    expect(result?.task_type).toBe('diagram')
    expect(result?.diagram_json).toEqual({
      cells: [
        {
          id: '2',
          value: 'Start',
          vertex: '1',
          parent: '1',
          geometry: {
            x: 120,
            y: 80,
            width: 120,
            height: 60,
          },
        },
      ],
    })
  })
})
