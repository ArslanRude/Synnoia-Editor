/**
 * TipTap JSON Diff Engine
 *
 * Compares two TipTap JSON documents and produces a flat list of diff operations
 * for visual rendering in the DiffPreview component.
 */

export interface DiffOp {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  path: string
  oldNode?: TipTapNode
  newNode?: TipTapNode
  textPreview?: string
}

export interface TipTapNode {
  type: string
  content?: TipTapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

export interface TipTapDoc {
  type: 'doc'
  content: TipTapNode[]
}

/**
 * Extract plain text from a TipTap node recursively
 */
export function nodeToText(node: TipTapNode): string {
  if (node.text) return node.text
  if (!node.content) return ''
  return node.content.map(nodeToText).join('')
}

/**
 * Compute a simple hash/fingerprint of a node for fast comparison
 */
function nodeFingerprint(node: TipTapNode): string {
  return JSON.stringify(node)
}

/**
 * Deep equality check for two TipTap nodes
 */
function nodesEqual(a: TipTapNode, b: TipTapNode): boolean {
  return nodeFingerprint(a) === nodeFingerprint(b)
}

/**
 * Compute a human-readable label for a node type
 */
function nodeLabel(node: TipTapNode): string {
  const text = nodeToText(node)
  const preview = text.length > 80 ? text.slice(0, 80) + '…' : text
  return `${node.type}${preview ? ': ' + preview : ''}`
}

/**
 * LCS-based diff of two arrays of TipTapNodes.
 * Returns DiffOp[] with added/removed/unchanged/modified entries.
 */
export function computeDiff(
  oldDoc: TipTapDoc | null,
  newDoc: TipTapDoc | null,
): DiffOp[] {
  const oldNodes = oldDoc?.content ?? []
  const newNodes = newDoc?.content ?? []

  if (oldNodes.length === 0 && newNodes.length === 0) return []

  // Build LCS table
  const m = oldNodes.length
  const n = newNodes.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (nodesEqual(oldNodes[i - 1], newNodes[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to produce diff
  const ops: DiffOp[] = []
  let i = m
  let j = n

  const pendingOps: DiffOp[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && nodesEqual(oldNodes[i - 1], newNodes[j - 1])) {
      pendingOps.push({
        type: 'unchanged',
        path: `content[${i - 1}]`,
        oldNode: oldNodes[i - 1],
        newNode: newNodes[j - 1],
        textPreview: nodeLabel(oldNodes[i - 1]),
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Check if this is a modification (similar type at same approximate position)
      if (
        i > 0 &&
        oldNodes[i - 1] &&
        oldNodes[i - 1].type === newNodes[j - 1].type &&
        !nodesEqual(oldNodes[i - 1], newNodes[j - 1])
      ) {
        pendingOps.push({
          type: 'modified',
          path: `content[${i - 1}]`,
          oldNode: oldNodes[i - 1],
          newNode: newNodes[j - 1],
          textPreview: nodeLabel(newNodes[j - 1]),
        })
        i--
        j--
      } else {
        pendingOps.push({
          type: 'added',
          path: `content[${j - 1}]`,
          newNode: newNodes[j - 1],
          textPreview: nodeLabel(newNodes[j - 1]),
        })
        j--
      }
    } else if (i > 0) {
      pendingOps.push({
        type: 'removed',
        path: `content[${i - 1}]`,
        oldNode: oldNodes[i - 1],
        textPreview: nodeLabel(oldNodes[i - 1]),
      })
      i--
    }
  }

  // Reverse since we backtracked
  pendingOps.reverse()
  ops.push(...pendingOps)

  return ops
}

/**
 * Filter only changed ops (exclude unchanged) for display
 */
export function getChangedOps(ops: DiffOp[]): DiffOp[] {
  return ops.filter((op) => op.type !== 'unchanged')
}

/**
 * Check if two documents are identical
 */
export function documentsEqual(
  a: TipTapDoc | null,
  b: TipTapDoc | null,
): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  return JSON.stringify(a) === JSON.stringify(b)
}
