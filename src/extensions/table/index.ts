import Table from '@tiptap/extension-table'
import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// Parse CSS rules from clipboard Excel (convert CSS string to object)
const parseCSS = (cssRules: string) => {
  const results: any = {}
  const rules = cssRules
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
  rules.forEach((rule) => {
    const [property, value] = rule.split(':').map((part) => part.trim())
    if (property && value) {
      results[property] = value
    }
  })
  return results
}

// Method to extract style rules
const extractStyles = (styleText: string) => {
  const regex = /\.(\w+)\s*\{([^}]+)\}/g
  let match
  const styles: any = {}

  while ((match = regex.exec(styleText)) !== null) {
    // const className = match[1]
    // const cssRules = match[2]
    const [, className, cssRules] = match
    const parsedRules = parseCSS(cssRules)
    styles[className] = parsedRules
  }

  return styles
}

const CustomTable = Table.extend({
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      // Handle table style issues when pasting from Microsoft Excel
      new Plugin({
        key: new PluginKey('handleExcelPaste'),
        props: {
          handlePaste(view, event) {
            const { clipboardData } = event
            if (!clipboardData) return false

            const html = clipboardData.getData('text/html')
            if (!html) return false

            const parser = new DOMParser()
            const doc = parser.parseFromString(html, 'text/html')
            const excel = doc
              ?.querySelector('html')
              ?.getAttribute('xmlns:x')
              ?.includes('office:excel')
            if (!excel) {
              return false
            }

            const table = doc.querySelector('table')
            if (!table) return false

            const styleText = Array.from(doc.head.querySelectorAll('style'))
              .map((style) => style.textContent)
              .join('\n')

            // Extract all style rules
            const styles = extractStyles(styleText)

            // Add cell styles
            table.querySelectorAll('td, th').forEach((cell: any) => {
              const style: any = styles[cell.getAttribute('class')]
              if (style?.background) {
                cell.style.background = style.background
              }
              if (style?.color) {
                cell.style.color = style.color
              }
              if (style?.['text-align']) {
                cell.setAttribute('align', style['text-align'])
              }
            })

            // Use ProseMirror's DOMParser to convert table to ProseMirror node
            const { schema } = view.state
            const fragment =
              ProseMirrorDOMParser.fromSchema(schema).parse(table)
            const transaction = view.state.tr.replaceSelectionWith(fragment)
            view.dispatch(transaction)

            return true
          },
        },
      }),
    ]
  },
})

export default CustomTable.configure({
  allowTableNodeSelection: true,
  resizable: true,
})
