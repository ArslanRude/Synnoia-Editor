<template>
  <menus-button ico="word" :text="t('export.word')" huge @menu-click="saveWordFile" />
</template>

<script setup lang="ts">
import { saveAs } from 'file-saver'
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
  ImageRun,
  VerticalAlign,
} from 'docx'
import type { JSONContent } from '@tiptap/core'

const editor = inject('editor')
const options = inject('options')

// ─── Numbering references ─────────────────────────────────────────────────────
let orderedListCounter = 0
const BULLET_REF = 'tiptap-bullets'
const getOrderedRef = () => `tiptap-ordered-${++orderedListCounter}`

// ─── Save ─────────────────────────────────────────────────────────────────────
const saveWordFile = () => {
  if (!editor.value) return

  orderedListCounter = 0

  const jsonContent: JSONContent = editor.value.getJSON()
  const { title } = options.value.document ?? {}
  const filename = title?.trim() ? title.trim() : t('document.untitled')

  const orderedRefs: string[] = []
  const children = convertContent(jsonContent, orderedRefs)

  const doc = new Document({
    numbering: {
      config: [
        // ── Bullet list — 9 nesting levels ──────────────────────────────
        {
          reference: BULLET_REF,
          levels: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => ({
            level: lvl,
            format: LevelFormat.BULLET,
            text: ['•', '◦', '▪', '•', '◦', '▪', '•', '◦', '▪'][lvl],
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720 * (lvl + 1), hanging: 360 },
              },
            },
          })),
        },
        // ── Ordered lists — one config per list so each restarts at 1 ──
        ...orderedRefs.map((ref) => ({
          reference: ref,
          levels: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => ({
            level: lvl,
            format: LevelFormat.DECIMAL,
            text: `%${lvl + 1}.`,
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720 * (lvl + 1), hanging: 360 },
              },
            },
          })),
        })),
      ],
    },
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 24 } }, // 12 pt
      },
      paragraphStyles: [
        makeHeadingStyle('Heading1', 'Heading 1', 36, 0),
        makeHeadingStyle('Heading2', 'Heading 2', 32, 1),
        makeHeadingStyle('Heading3', 'Heading 3', 28, 2),
        makeHeadingStyle('Heading4', 'Heading 4', 26, 3),
        makeHeadingStyle('Heading5', 'Heading 5', 24, 4),
        makeHeadingStyle('Heading6', 'Heading 6', 24, 5),
        {
          id: 'Blockquote',
          name: 'Blockquote',
          basedOn: 'Normal',
          run: { italics: true, color: '555555' },
          paragraph: {
            indent: { left: 720 },
            spacing: { before: 120, after: 120 },
            border: {
              left: {
                style: BorderStyle.THICK,
                size: 12,
                color: 'CCCCCC',
                space: 8,
              },
            },
          },
        },
        {
          id: 'CodeBlock',
          name: 'Code Block',
          basedOn: 'Normal',
          run: { font: 'Courier New', size: 20, color: '1F2328' },
          paragraph: {
            spacing: { before: 60, after: 60 },
            shading: { fill: 'F6F8FA', type: ShadingType.CLEAR },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 }, // US Letter
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  })

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${filename}.docx`)
  })
}

// ─── Heading style factory ────────────────────────────────────────────────────
function makeHeadingStyle(id: string, name: string, size: number, outline: number) {
  return {
    id,
    name,
    basedOn: 'Normal',
    next: 'Normal',
    quickFormat: true,
    run: { size, bold: true, font: 'Calibri', color: '000000' },
    paragraph: {
      spacing: { before: 240, after: 120 },
      outlineLevel: outline,
    },
  }
}

// ─── Top-level content converter ─────────────────────────────────────────────
function convertContent(root: JSONContent, orderedRefs: string[]): (Paragraph | Table)[] {
  if (!root.content) return []
  const out: (Paragraph | Table)[] = []
  for (const node of root.content) {
    out.push(...convertNode(node, orderedRefs, 0))
  }
  return out
}

// ─── Node → (Paragraph | Table)[] ────────────────────────────────────────────
function convertNode(
  node: JSONContent,
  orderedRefs: string[],
  depth: number,
): (Paragraph | Table)[] {
  if (!node) return []
  const attrs = node.attrs ?? {}

  switch (node.type) {
    // ── Paragraph ────────────────────────────────────────────────────────
    case 'paragraph': {
      const runs = inlineRuns(node.content)
      // Empty paragraph → emit a blank spacer line
      return [
        new Paragraph({
          children: runs,
          alignment: toAlignment(attrs.textAlign),
          spacing: { after: 120, line: lineHeightTwips(attrs.lineHeight) },
          indent: attrs.indent ? { left: 720 * Number(attrs.indent) } : undefined,
        }),
      ]
    }

    // ── Headings ─────────────────────────────────────────────────────────
    case 'heading': {
      const level = (attrs.level as number) ?? 1
      return [
        new Paragraph({
          heading: toHeadingLevel(level),
          children: inlineRuns(node.content),
          alignment: toAlignment(attrs.textAlign),
        }),
      ]
    }

    // ── Bullet list ──────────────────────────────────────────────────────
    case 'bulletList': {
      const out: Paragraph[] = []
      for (const item of node.content ?? []) {
        out.push(...listItemParagraphs(item, BULLET_REF, depth, orderedRefs))
      }
      return out
    }

    // ── Ordered list ─────────────────────────────────────────────────────
    case 'orderedList': {
      const ref = getOrderedRef()
      orderedRefs.push(ref)
      const out: Paragraph[] = []
      for (const item of node.content ?? []) {
        out.push(...listItemParagraphs(item, ref, depth, orderedRefs))
      }
      return out
    }

    // ── Task list ────────────────────────────────────────────────────────
    case 'taskList': {
      const out: Paragraph[] = []
      for (const item of node.content ?? []) {
        const checked = item.attrs?.checked ?? false
        const prefix = checked ? '☑ ' : '☐ '
        out.push(...taskItemParagraphs(item, prefix, depth, orderedRefs))
      }
      return out
    }

    // ── Blockquote ───────────────────────────────────────────────────────
    case 'blockquote': {
      const out: (Paragraph | Table)[] = []
      for (const child of node.content ?? []) {
        if (child.type === 'paragraph') {
          out.push(
            new Paragraph({
              style: 'Blockquote',
              children: inlineRuns(child.content),
              alignment: toAlignment(child.attrs?.textAlign),
            }),
          )
        } else {
          // Nested block inside blockquote (e.g. code block, list)
          out.push(...convertNode(child, orderedRefs, depth))
        }
      }
      return out
    }

    // ── Code block ───────────────────────────────────────────────────────
    case 'codeBlock': {
      const raw = extractText(node.content)
      const lines = raw.split('\n')
      // Wrap in a light-shaded block: one paragraph per line
      return lines.map(
        (line) =>
          new Paragraph({
            style: 'CodeBlock',
            children: [
              new TextRun({
                text: line === '' ? ' ' : line, // preserve blank lines
                font: 'Courier New',
                size: 20,
              }),
            ],
          }),
      )
    }

    // ── Horizontal rule ──────────────────────────────────────────────────
    case 'horizontalRule': {
      return [
        new Paragraph({
          children: [],
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'AAAAAA', space: 1 },
          },
          spacing: { before: 120, after: 120 },
        }),
      ]
    }

    // ── Hard break (top-level) ───────────────────────────────────────────
    case 'hardBreak': {
      return [new Paragraph({ children: [] })]
    }

    // ── Table ────────────────────────────────────────────────────────────
    case 'table': {
      return [buildTable(node, orderedRefs)]
    }

    // ── Image ────────────────────────────────────────────────────────────
    case 'image': {
      return buildImageParagraph(attrs)
    }

    // ── Fallback: recurse into children ──────────────────────────────────
    default: {
      if (node.content?.length) {
        return node.content.flatMap((child) => convertNode(child, orderedRefs, depth))
      }
      return []
    }
  }
}

// ─── Image paragraph ──────────────────────────────────────────────────────────
function buildImageParagraph(attrs: Record<string, unknown>): Paragraph[] {
  const src = String(attrs.src ?? '')
  const alt = String(attrs.alt ?? '')

  if (src.startsWith('data:')) {
    try {
      const [meta, b64] = src.split(',')
      const mediaType = (meta.match(/data:([^;]+)/)?.[1] ?? 'image/png') as string
      const rawExt = mediaType.split('/')[1]
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt

      const buffer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

      // Width/height attrs may be strings like "400px" or bare numbers (px)
      const parseAttrPx = (v: unknown, fallback: number) => {
        if (v == null) return fallback
        const n = parseFloat(String(v))
        return isNaN(n) ? fallback : n
      }
      const widthPx = parseAttrPx(attrs.width, 400)
      const heightPx = parseAttrPx(attrs.height, 300)

      return [
        new Paragraph({
          children: [
            new ImageRun({
              data: buffer,
              transformation: {
                width: Math.round(widthPx),
                height: Math.round(heightPx),
              },
              type: ext as 'png' | 'jpg' | 'gif' | 'bmp' | 'svg',
            }),
          ],
          spacing: { before: 120, after: 120 },
        }),
      ]
    } catch {
      // fall through to placeholder
    }
  }

  // External URL or failed data-URL → italic placeholder
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: alt ? `[Image: ${alt}]` : `[Image: ${src.slice(0, 80)}]`,
          italics: true,
          color: '888888',
        }),
      ],
    }),
  ]
}

// ─── List item helpers ────────────────────────────────────────────────────────
function listItemParagraphs(
  item: JSONContent,
  ref: string,
  depth: number,
  orderedRefs: string[],
): Paragraph[] {
  if (!item.content) return []
  const out: Paragraph[] = []

  for (const child of item.content) {
    if (child.type === 'paragraph') {
      out.push(
        new Paragraph({
          numbering: { reference: ref, level: depth },
          children: inlineRuns(child.content),
          spacing: { after: 60 },
          alignment: toAlignment(child.attrs?.textAlign),
        }),
      )
    } else if (child.type === 'bulletList') {
      for (const subItem of child.content ?? []) {
        out.push(...listItemParagraphs(subItem, BULLET_REF, depth + 1, orderedRefs))
      }
    } else if (child.type === 'orderedList') {
      const subRef = getOrderedRef()
      orderedRefs.push(subRef)
      for (const subItem of child.content ?? []) {
        out.push(...listItemParagraphs(subItem, subRef, depth + 1, orderedRefs))
      }
    } else if (child.type === 'taskList') {
      for (const taskItem of child.content ?? []) {
        const checked = taskItem.attrs?.checked ?? false
        const prefix = checked ? '☑ ' : '☐ '
        out.push(...taskItemParagraphs(taskItem, prefix, depth + 1, orderedRefs))
      }
    } else {
      // nested block inside list item (e.g. codeBlock, blockquote, image)
      out.push(...(convertNode(child, orderedRefs, depth) as Paragraph[]))
    }
  }
  return out
}

function taskItemParagraphs(
  item: JSONContent,
  prefix: string,
  depth: number,
  orderedRefs: string[],
): Paragraph[] {
  if (!item.content) return []
  const out: Paragraph[] = []
  let first = true

  for (const child of item.content) {
    if (child.type === 'paragraph') {
      const runs = inlineRuns(child.content)
      if (first) {
        runs.unshift(new TextRun({ text: prefix }))
        first = false
      }
      out.push(
        new Paragraph({
          children: runs,
          indent: { left: 720 * (depth + 1), hanging: 360 },
          spacing: { after: 60 },
        }),
      )
    } else {
      out.push(...(convertNode(child, orderedRefs, depth) as Paragraph[]))
    }
  }
  return out
}

// ─── Table builder ────────────────────────────────────────────────────────────
function buildTable(node: JSONContent, orderedRefs: string[]): Table {
  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' }
  const cellBorders = {
    top: cellBorder,
    bottom: cellBorder,
    left: cellBorder,
    right: cellBorder,
    insideH: cellBorder,
    insideV: cellBorder,
  }

  // Calculate equal column widths (9360 DXA = US Letter content width with 1" margins)
  const TABLE_WIDTH = 9360
  const allRows = node.content ?? []
  const firstRow = allRows.find((r) => r.type === 'tableRow')
  const colCount =
    firstRow?.content?.reduce((acc, c) => acc + (c.attrs?.colspan ?? 1), 0) ?? 1
  const colWidth = Math.floor(TABLE_WIDTH / colCount)
  const columnWidths = Array(colCount).fill(colWidth)

  const rows: TableRow[] = []
  for (const rowNode of allRows) {
    if (rowNode.type !== 'tableRow') continue

    const cells: TableCell[] = []
    for (const cellNode of rowNode.content ?? []) {
      const isHeader = cellNode.type === 'tableHeader'
      const colspan = cellNode.attrs?.colspan ?? 1
      const rowspan = cellNode.attrs?.rowspan ?? 1

      // Convert cell paragraphs
      const cellContent = (cellNode.content ?? []).flatMap((p) =>
        convertNode(p, orderedRefs, 0),
      )
      const cellParagraphs = cellContent.filter((n): n is Paragraph => n instanceof Paragraph)

      // Cell background: respect explicit background attr, fall back to header default
      const bgColor = normalizeColorToHex(cellNode.attrs?.background)
        ?? (isHeader ? 'F0F0F0' : 'FFFFFF')

      cells.push(
        new TableCell({
          borders: cellBorders,
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          width: { size: colWidth * colspan, type: WidthType.DXA },
          columnSpan: colspan,
          rowSpan: rowspan,
          verticalAlign: toVerticalAlign(cellNode.attrs?.verticalAlign),
          children: cellParagraphs.length
            ? cellParagraphs
            : [new Paragraph({ children: [] })],
        }),
      )
    }

    rows.push(
      new TableRow({
        tableHeader: rowNode.content?.some((c) => c.type === 'tableHeader') ?? false,
        children: cells,
      }),
    )
  }

  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths,
    borders: {
      top: cellBorder,
      bottom: cellBorder,
      left: cellBorder,
      right: cellBorder,
      insideH: cellBorder,
      insideV: cellBorder,
    },
    rows,
  })
}

// ─── Inline run converter ─────────────────────────────────────────────────────
function inlineRuns(content: JSONContent[] | undefined): (TextRun | ExternalHyperlink)[] {
  if (!content) return []
  return content.flatMap((node) => inlineNode(node))
}

function inlineNode(node: JSONContent): (TextRun | ExternalHyperlink)[] {
  if (!node) return []

  // Hard break inside a paragraph → line break in the same text run
  if (node.type === 'hardBreak') {
    return [new TextRun({ break: 1 })]
  }

  if (node.type === 'text') {
    const marks = node.marks ?? []
    const runProps = marksToRunProps(marks)
    const text = node.text ?? ''

    // Link mark → wrap in ExternalHyperlink
    const linkMark = marks.find((m) => m.type === 'link')
    if (linkMark) {
      return [
        new ExternalHyperlink({
          link: linkMark.attrs?.href ?? '',
          children: [
            new TextRun({
              text,
              style: 'Hyperlink',
              ...runProps,
            }),
          ],
        }),
      ]
    }

    return [new TextRun({ text, ...runProps })]
  }

  // Inline wrapper nodes (mention, emoji, custom inline, etc.)
  if (node.content) {
    return inlineRuns(node.content)
  }

  return []
}

// ─── Marks → TextRun props ────────────────────────────────────────────────────
interface RunProps {
  bold?: boolean
  italics?: boolean
  underline?: { type: UnderlineType }
  strike?: boolean
  color?: string
  highlight?: string
  superScript?: boolean
  subScript?: boolean
  font?: { name: string } // docx requires { name: string }, not plain string
  size?: number           // half-points: 24 = 12pt, 32 = 16pt
  shading?: { fill: string; type: ShadingType }
}

/**
 * Convert a CSS font-size string (or bare number) to docx half-points.
 *  px  → half-pt  = px × 1.5   (96 dpi: 1px = 0.75pt; 1pt = 2 half-pt)
 *  pt  → half-pt  = pt × 2
 *  rem/em → assume 16px base → × 16 × 1.5
 *  bare number → treat as px
 */
function cssFontSizeToHalfPt(value: string | number): number | undefined {
  const str = String(value).trim()
  const num = parseFloat(str)
  if (isNaN(num) || num <= 0) return undefined

  if (str.endsWith('px')) return Math.round(num * 1.5)
  if (str.endsWith('pt')) return Math.round(num * 2)
  if (str.endsWith('rem') || str.endsWith('em')) return Math.round(num * 16 * 1.5)
  // bare number → treat as px (most common from Tiptap FontSize extension)
  return Math.round(num * 1.5)
}

function marksToRunProps(marks: NonNullable<JSONContent['marks']>): RunProps {
  const props: RunProps = {}

  for (const mark of marks) {
    switch (mark.type) {
      // ── Basic formatting ────────────────────────────────────────────
      case 'bold':
      case 'strong':
        props.bold = true
        break

      case 'italic':
      case 'em':
        props.italics = true
        break

      case 'underline':
        props.underline = { type: UnderlineType.SINGLE }
        break

      case 'strike':
      case 'strikethrough':
        props.strike = true
        break

      case 'superscript':
        props.superScript = true
        break

      case 'subscript':
        props.subScript = true
        break

      // ── Inline code ─────────────────────────────────────────────────
      case 'code':
        props.font = { name: 'Courier New' }
        props.size = 20 // 10pt
        // Light grey shading to mimic inline code background
        props.shading = { fill: 'F0F0F0', type: ShadingType.CLEAR }
        break

      // ── Text style (color, fontSize, fontFamily) ─────────────────────
      case 'textStyle': {
        const { color, fontSize, fontFamily, backgroundColor } = mark.attrs ?? {}

        const colorHex = normalizeColorToHex(color)
        if (colorHex) props.color = colorHex

        if (fontSize != null && fontSize !== '') {
          const hp = cssFontSizeToHalfPt(fontSize)
          if (hp) props.size = hp
        }

        if (fontFamily && typeof fontFamily === 'string') {
          // CSS may wrap font name in quotes: "'Inter', sans-serif"
          const cleanName = fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g, '')
          if (cleanName) props.font = { name: cleanName }
        }

        const bgHex = normalizeColorToHex(backgroundColor)
        if (bgHex) {
          props.shading = { fill: bgHex, type: ShadingType.CLEAR }
        }
        break
      }

      // ── Standalone color mark (some Tiptap setups) ───────────────────
      case 'color': {
        const hex = normalizeColorToHex(mark.attrs?.color)
        if (hex) props.color = hex
        break
      }

      // ── Highlight / background ───────────────────────────────────────
      case 'highlight':
      case 'backgroundColor': {
        const hex = normalizeColorToHex(mark.attrs?.color)
        if (!hex) break
        const named = resolveHighlightName(hex)
        if (named) {
          props.highlight = named
        } else {
          props.shading = { fill: hex, type: ShadingType.CLEAR }
        }
        break
      }
    }
  }

  return props
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function toAlignment(align: string | undefined): AlignmentType | undefined {
  const map: Record<string, AlignmentType> = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
    start: AlignmentType.LEFT,
    end: AlignmentType.RIGHT,
  }
  return align ? map[align] : undefined
}

function toHeadingLevel(level: number): HeadingLevel {
  return (
    [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
      HeadingLevel.HEADING_5,
      HeadingLevel.HEADING_6,
    ][level - 1] ?? HeadingLevel.HEADING_1
  )
}

function toVerticalAlign(val: string | undefined): VerticalAlign {
  if (val === 'middle' || val === 'center') return VerticalAlign.CENTER
  if (val === 'bottom') return VerticalAlign.BOTTOM
  return VerticalAlign.TOP
}

/**
 * Convert Tiptap lineHeight (e.g. 1.5, "1.5", "150%") to docx twips (240 = single).
 * Returns undefined if not set, letting docx use its default (single spacing).
 * docx line value: 240 = single, 480 = double, 360 = 1.5×
 */
function lineHeightTwips(value: unknown): number | undefined {
  if (value == null) return undefined
  const str = String(value).trim()
  if (str.endsWith('%')) {
    const pct = parseFloat(str)
    return isNaN(pct) ? undefined : Math.round((pct / 100) * 240)
  }
  const num = parseFloat(str)
  return isNaN(num) ? undefined : Math.round(num * 240)
}

/**
 * Map a normalized 6-digit hex (no #) to Word's named highlight set.
 * Returns undefined for colors not in the named set.
 */
function resolveHighlightName(hex: string): string | undefined {
  const map: Record<string, string> = {
    'FFFF00': 'yellow',
    '00FF00': 'green',
    '00FFFF': 'cyan',
    'FF00FF': 'magenta',
    '0000FF': 'blue',
    'FF0000': 'red',
    'FFFFFF': 'white',
    '000000': 'black',
    '808080': 'darkGray',
    'C0C0C0': 'lightGray',
    '008000': 'darkGreen',
    '008080': 'darkCyan',
    '800080': 'darkMagenta',
    '800000': 'darkRed',
    '000080': 'darkBlue',
    '808000': 'darkYellow',
  }
  return map[hex.toUpperCase()]
}

/**
 * Normalize any CSS color string to a 6-digit hex string (no leading #).
 * Handles: "#RGB", "#RRGGBB", "rgb(r,g,b)", "rgba(r,g,b,a)", bare "RRGGBB".
 * Returns undefined for empty / unrecognised values so callers can skip safely.
 */
function normalizeColorToHex(color: unknown): string | undefined {
  if (!color) return undefined
  const raw = String(color).trim()
  if (!raw) return undefined

  // Already a 6-digit hex (with or without #)
  const hex6 = raw.match(/^#?([0-9a-fA-F]{6})$/)
  if (hex6) return hex6[1].toUpperCase()

  // 3-digit hex shorthand → expand
  const hex3 = raw.match(/^#?([0-9a-fA-F]{3})$/)
  if (hex3) {
    const [r, g, b] = hex3[1].split('')
    return `${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = raw.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/)
  if (rgbMatch) {
    const toHex = (n: string) => parseInt(n, 10).toString(16).padStart(2, '0').toUpperCase()
    return `${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`
  }

  // hsl / hsla — convert to RGB
  const hslMatch = raw.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/)
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360
    const s = parseFloat(hslMatch[2]) / 100
    const l = parseFloat(hslMatch[3]) / 100
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
    const g = Math.round(hue2rgb(p, q, h) * 255)
    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
    return `${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  // CSS named colors (the most common ones Tiptap ships)
  const namedColors: Record<string, string> = {
    black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000',
    blue: '0000FF', yellow: 'FFFF00', cyan: '00FFFF', magenta: 'FF00FF',
    orange: 'FFA500', purple: '800080', pink: 'FFC0CB', gray: '808080',
    grey: '808080', brown: 'A52A2A', transparent: undefined as unknown as string,
  }
  const lower = raw.toLowerCase()
  if (lower in namedColors) return namedColors[lower] ?? undefined

  return undefined
}

function extractText(content: JSONContent[] | undefined): string {
  if (!content) return ''
  return content
    .map((n) => (n.type === 'text' ? (n.text ?? '') : extractText(n.content)))
    .join('')
}
</script>

<style lang="less" scoped></style>