import type { Editor } from '@tiptap/vue-3'

import type { TipTapNode } from '@/ai/diff'
import { shortId } from '@/utils/short-id'

interface RenderDiagramOptions {
  graph: string
  title?: string
  diagramType?: string
  domain?: string
}

interface DrawioExportResult {
  data: string
  bounds?: {
    width?: number
    height?: number
  }
}

const DEFAULT_DIAGRAM_WIDTH = 720
const DEFAULT_DIAGRAM_HEIGHT = 420
const MIN_DIAGRAM_WIDTH = 560
const MIN_DIAGRAM_HEIGHT = 320

export async function renderDiagramInEditor(
  editor: Editor,
  options: RenderDiagramOptions,
): Promise<void> {
  const node = await createDiagramImageNode(options)
  editor.commands.setImage(node.attrs)
}

export async function createDiagramImageNode(
  options: RenderDiagramOptions,
): Promise<TipTapNode> {
  if (isDrawioXmlEmpty(options.graph)) {
    throw new Error('Diagram XML contains no visible shapes.')
  }

  const exported = await exportDrawioXmlToSvg(options)
  const id = shortId(10)
  const fixedSrc = createFixedSvgDataUrl(exported.data)
  const name = `${sanitizeName(options.title || options.diagramType || 'diagram')}-${shortId()}.svg`
  const width = Math.max(exported.bounds?.width || DEFAULT_DIAGRAM_WIDTH, MIN_DIAGRAM_WIDTH)
  const height = Math.max(exported.bounds?.height || DEFAULT_DIAGRAM_HEIGHT, MIN_DIAGRAM_HEIGHT)

  return {
    type: 'image',
    attrs: {
      id,
      type: 'diagrams',
      name,
      size: dataUrlSize(fixedSrc),
      src: fixedSrc,
      width,
      height,
      content: exported.data,
    },
  }
}

export function isDrawioXmlEmpty(xml: string): boolean {
  const text = xml.trim()
  if (!text) {
    return true
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')
  if (doc.querySelector('parsererror')) {
    return false
  }

  const cells = [...doc.querySelectorAll('mxCell')]
  return !cells.some((cell) => {
    const id = cell.getAttribute('id')
    if (id === '0' || id === '1') {
      return false
    }

    return Boolean(
      cell.getAttribute('vertex') ||
      cell.getAttribute('edge') ||
      cell.getAttribute('value') ||
      cell.getAttribute('style'),
    )
  })
}

export function diagramJsonToDrawioXml(value: unknown): string | null {
  const payload = typeof value === 'string' ? parseJsonMaybe(value) : value
  if (!payload || typeof payload !== 'object') {
    return typeof value === 'string' && value.trim().startsWith('<mxGraphModel')
      ? value
      : null
  }

  const model = (payload as any).mxGraphModel || payload
  const cells = readCells(model)
  if (cells.length === 0) {
    return null
  }

  const attrs = {
    dx: model.dx ?? 694,
    dy: model.dy ?? 511,
    grid: model.grid ?? 1,
    gridSize: model.gridSize ?? 10,
    guides: model.guides ?? 1,
    tooltips: model.tooltips ?? 1,
    connect: model.connect ?? 1,
    arrows: model.arrows ?? 1,
    fold: model.fold ?? 1,
    page: model.page ?? 1,
    pageScale: model.pageScale ?? 1,
    pageWidth: model.pageWidth ?? 850,
    pageHeight: model.pageHeight ?? 1100,
    math: model.math ?? 0,
    shadow: model.shadow ?? 0,
  }

  return `<mxGraphModel ${attrsToXml(attrs)}>
  <root>
${cells.map(cellToXml).join('\n')}
  </root>
</mxGraphModel>`
}

function parseJsonMaybe(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed.startsWith('<mxGraphModel')) {
    return null
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

function readCells(model: any): any[] {
  const root = model?.root || model?.diagram?.root
  const cells = root?.mxCell || root?.cells || model?.cells || model?.mxCell

  if (Array.isArray(cells)) {
    return ensureRootCells(cells)
  }

  return ensureRootCells([])
}

function ensureRootCells(cells: any[]): any[] {
  const normalized = [...cells]
  if (!normalized.some((cell) => String(cell.id) === '0')) {
    normalized.unshift({ id: '0' })
  }
  if (!normalized.some((cell) => String(cell.id) === '1')) {
    normalized.splice(1, 0, { id: '1', parent: '0' })
  }
  return normalized
}

function cellToXml(cell: any): string {
  const attrs = { ...cell }
  const geometry = attrs.mxGeometry || attrs.geometry
  delete attrs.mxGeometry
  delete attrs.geometry

  if (!geometry) {
    return `    <mxCell ${attrsToXml(attrs)} />`
  }

  return `    <mxCell ${attrsToXml(attrs)}>
      <mxGeometry ${attrsToXml({ ...geometry, as: geometry.as || 'geometry' })} />
    </mxCell>`
}

function attrsToXml(attrs: Record<string, unknown>): string {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${escapeXml(String(value))}"`)
    .join(' ')
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function exportDrawioXmlToSvg({
  graph,
  domain = 'https://embed.diagrams.net',
}: RenderDiagramOptions): Promise<DrawioExportResult> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe')
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Timed out while rendering diagram.'))
    }, 20000)

    const cleanup = () => {
      window.clearTimeout(timeout)
      window.removeEventListener('message', onMessage)
      frame.remove()
    }

    const postMessage = (message: Record<string, unknown>) => {
      frame.contentWindow?.postMessage(JSON.stringify(message), '*')
    }

    const onMessage = (evt: MessageEvent) => {
      if (evt.source !== frame.contentWindow || typeof evt.data !== 'string') {
        return
      }

      try {
        const msg = JSON.parse(evt.data)

        if (msg.event === 'configure') {
          postMessage({ action: 'configure', config: {} })
          return
        }

        if (msg.event === 'init') {
          postMessage({
            action: 'load',
            autosave: 0,
            xml: graph,
          })
          return
        }

        if (msg.event === 'load') {
          window.setTimeout(() => {
            postMessage({
              action: 'export',
              format: 'xmlsvg',
              xml: graph,
              spinKey: 'export',
              border: 8,
            })
          }, 500)
          return
        }

        if (msg.event === 'export') {
          cleanup()
          resolve({
            data: msg.data,
            bounds: msg.bounds,
          })
        }
      } catch (error) {
        cleanup()
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }

    window.addEventListener('message', onMessage)
    frame.style.position = 'fixed'
    frame.style.left = '-10000px'
    frame.style.top = '-10000px'
    frame.style.width = '1200px'
    frame.style.height = '900px'
    frame.style.opacity = '0'
    frame.style.pointerEvents = 'none'
    frame.src = `${domain}?ui=atlas&proto=json&libraries=1&configure=1&noSaveBtn=1&lang=en`
    document.body.appendChild(frame)
  })
}

function createFixedSvgDataUrl(data: string): string {
  const svgText = decodeSvgData(data)
  const fixedSvgText = svgText ? fixSvgDarkMode(svgText) : data

  return `data:image/svg+xml;base64,${encodeBase64(fixedSvgText)}`
}

function decodeSvgData(data: string): string {
  if (data.startsWith('data:image/svg+xml;base64,')) {
    return window.atob(data.slice('data:image/svg+xml;base64,'.length))
  }

  if (data.startsWith('data:image/svg+xml,')) {
    return decodeURIComponent(data.slice('data:image/svg+xml,'.length))
  }

  return data
}

function fixSvgDarkMode(svgText: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')

  if (doc.querySelector('parsererror')) {
    return svgText
  }

  const svgEl = doc.documentElement
  const svgStyle = svgEl.getAttribute('style') || ''
  if (svgStyle.includes('light-dark') || svgStyle.includes('color-scheme')) {
    svgEl.setAttribute('style', 'background: #ffffff;')
  }

  doc.querySelectorAll('*').forEach((el) => {
    const style = el.getAttribute('style')
    if (!style || (!style.includes('light-dark') && !style.includes('color-scheme'))) {
      return
    }

    const cleaned = style
      .split(';')
      .map((item) => item.trim())
      .filter((item) => {
        if (!item) return false
        const val = item.slice(item.indexOf(':') + 1).trim()
        return !val.includes('light-dark') && !val.includes('color-scheme')
      })
      .join('; ')

    if (cleaned) {
      el.setAttribute('style', cleaned)
    } else {
      el.removeAttribute('style')
    }
  })

  return new XMLSerializer().serializeToString(doc)
}

function encodeBase64(value: string): string {
  return window.btoa(unescape(encodeURIComponent(value)))
}

function dataUrlSize(dataUrl: string): number {
  return Math.ceil((dataUrl.length * 3) / 4)
}

function sanitizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'diagram'
}
