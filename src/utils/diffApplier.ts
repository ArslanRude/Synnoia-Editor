import type { Editor } from '@tiptap/vue-3'

import type { TipTapDoc, TipTapNode } from './diffEngine'

/**
 * Apply inline diff marks to a new document based on LCS differences.
 * This takes the original doc and the proposed doc, and produces a single TipTapDoc
 * where added nodes have the `diffAdded` mark and removed nodes have the `diffRemoved` mark.
 */
export function createDiffDocument(
  originalDoc: TipTapDoc | null,
  proposedDoc: TipTapDoc | null,
): TipTapDoc {
  if (!originalDoc && !proposedDoc) return { type: 'doc', content: [] }
  if (!originalDoc) return markAllWith(proposedDoc!, 'diffAdded')
  if (!proposedDoc) return markAllWith(originalDoc, 'diffRemoved')

  const diffedContent = computeDiffLevel(originalDoc.content, proposedDoc.content)
  return {
    type: 'doc',
    content: diffedContent,
  }
}

/**
 * Accept changes in a diffed document by removing all diffRemoved nodes
 * and stripping the diffAdded marks from all new nodes.
 */
export function acceptDiffDocument(editor: Editor): void {
  const { tr, doc } = editor.state
  let transaction = tr

  // 1. Delete all nodes/text with diffRemoved mark
  const rangesToRemove: { from: number; to: number }[] = []
  
  doc.descendants((node, pos) => {
    if (node.marks.some((m) => m.type.name === 'diffRemoved')) {
      rangesToRemove.push({ from: pos, to: pos + node.nodeSize })
      return false // Don't descend into removed nodes
    }
  })

  // Remove from end to start to not mess up positions
  for (let i = rangesToRemove.length - 1; i >= 0; i--) {
    const { from, to } = rangesToRemove[i]
    transaction = transaction.delete(from, to)
  }

  // 2. Remove diffAdded mark from everything
  const diffAddedMarkType = editor.schema.marks.diffAdded
  if (diffAddedMarkType) {
    transaction = transaction.removeMark(0, transaction.doc.content.size, diffAddedMarkType)
  }

  editor.view.dispatch(transaction)
}

/**
 * Reject changes in a diffed document by removing all diffAdded nodes
 * and stripping the diffRemoved marks from original nodes to restore them.
 */
export function rejectDiffDocument(editor: Editor): void {
  const { tr, doc } = editor.state
  let transaction = tr

  // 1. Delete all nodes/text with diffAdded mark
  const rangesToRemove: { from: number; to: number }[] = []
  
  doc.descendants((node, pos) => {
    if (node.marks.some((m) => m.type.name === 'diffAdded')) {
      rangesToRemove.push({ from: pos, to: pos + node.nodeSize })
      return false // Don't descend into added nodes
    }
  })

  // Remove from end to start to not mess up positions
  for (let i = rangesToRemove.length - 1; i >= 0; i--) {
    const { from, to } = rangesToRemove[i]
    transaction = transaction.delete(from, to)
  }

  // 2. Remove diffRemoved mark from everything to restore it
  const diffRemovedMarkType = editor.schema.marks.diffRemoved
  if (diffRemovedMarkType) {
    transaction = transaction.removeMark(0, transaction.doc.content.size, diffRemovedMarkType)
  }

  editor.view.dispatch(transaction)
}

// --- Helpers ---

function computeDiffLevel(oldNodes: TipTapNode[] = [], newNodes: TipTapNode[] = []): TipTapNode[] {
  // Simple block-level LCS alignment for demonstration
  // A production version would do a deep text diff for identical block types (e.g. diffing sentences in a paragraph)
  const result: TipTapNode[] = []
  
  if (oldNodes.length === 0 && newNodes.length === 0) return []

  const m = oldNodes.length
  const n = newNodes.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (nodesEqual(oldNodes[i - 1], newNodes[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const pendingOps: { type: 'added'|'removed'|'unchanged', oldN?: TipTapNode, newN?: TipTapNode }[] = []
  let i = m, j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && nodesEqual(oldNodes[i - 1], newNodes[j - 1])) {
      pendingOps.push({ type: 'unchanged', oldN: oldNodes[i - 1], newN: newNodes[j - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      pendingOps.push({ type: 'added', newN: newNodes[j - 1] })
      j--
    } else if (i > 0) {
      pendingOps.push({ type: 'removed', oldN: oldNodes[i - 1] })
      i--
    }
  }

  pendingOps.reverse()

  for (const op of pendingOps) {
    if (op.type === 'unchanged') {
      result.push(op.oldN!)
    } else if (op.type === 'added') {
      result.push(...markAllWith({ type: 'doc', content: [op.newN!] }, 'diffAdded').content)
    } else if (op.type === 'removed') {
      result.push(...markAllWith({ type: 'doc', content: [op.oldN!] }, 'diffRemoved').content)
    }
  }

  return result
}

function nodesEqual(a: TipTapNode, b: TipTapNode): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function markAllWith(doc: TipTapDoc, markType: 'diffAdded' | 'diffRemoved'): TipTapDoc {
  // Deep clone to avoid mutating original
  const clone = JSON.parse(JSON.stringify(doc))
  
  function applyMarkToNode(node: TipTapNode) {
    // If it's a text node, add the mark directly
    if (node.type === 'text') {
      node.marks = node.marks || []
      if (!node.marks.some(m => m.type === markType)) {
        node.marks.push({ type: markType })
      }
    }
    // Note: TipTap marks apply to text nodes primarily. If a block node has no text,
    // the mark won't necessarily show unless the block itself supports marks.
    // For paragraphs and lists, the text inside will get marked.
    if (node.content) {
      if (node.content.length === 0) {
        // Empty blocks (like an empty paragraph) need something to anchor the mark
        // Or we might just ignore empty diffs
      } else {
        for (const child of node.content) {
          applyMarkToNode(child)
        }
      }
    }
  }

  for (const node of clone.content) {
    applyMarkToNode(node)
  }

  return clone
}
