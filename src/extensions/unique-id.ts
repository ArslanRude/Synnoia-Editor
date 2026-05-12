import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { shortId } from '@/utils/short-id'

export interface UniqueIdOptions {
  attributeName: string
  types: string[]
  generateID: () => string
  filterNodes: (node: any) => boolean
}

export const UniqueId = Extension.create<UniqueIdOptions>({
  name: 'uniqueId',

  addOptions() {
    return {
      attributeName: 'id',
      types: [],
      generateID: () => shortId(10),
      filterNodes: (node) => node.type.name !== 'doc' && node.type.name !== 'text',
    }
  },

  addGlobalAttributes() {
    const { types, attributeName } = this.options

    // We can't easily get all types here because schema might not be fully initialized or it might be too early.
    // However, Tiptap allows passing an empty array to apply to all types if we handle it in the plugin.
    // Actually, for global attributes, we should specify types.
    // We'll use a list of common types if none are provided.
    const targetTypes = types.length > 0 ? types : [
      'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem',
      'blockquote', 'codeBlock', 'image', 'video', 'table', 'tableRow',
      'tableCell', 'tableHeader', 'callout', 'columns', 'column', 'textBox'
    ]

    return [
      {
        types: targetTypes,
        attributes: {
          [attributeName]: {
            default: null,
            parseHTML: element => element.getAttribute(attributeName),
            renderHTML: attributes => {
              if (!attributes[attributeName]) {
                return {}
              }

              return {
                [attributeName]: attributes[attributeName],
              }
            },
            keepOnSplit: false,
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    const { attributeName, generateID, filterNodes } = this.options

    return [
      new Plugin({
        key: new PluginKey('uniqueId'),
        appendTransaction: (transactions, oldState, newState) => {
          const docChanges =
            transactions.some((tr) => tr.docChanged) &&
            !oldState.doc.eq(newState.doc)

          if (!docChanges) {
            return
          }

          const tr = newState.tr
          const usedIds = new Set()

          newState.doc.descendants((node, pos) => {
            if (node.isText) {
              return
            }

            const id = node.attrs[attributeName]

            if (id && !usedIds.has(id)) {
              usedIds.add(id)
              return
            }

            if (filterNodes(node)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                [attributeName]: generateID(),
              })
            }
          })

          return tr.docChanged ? tr : null
        },
        props: {
          transformPasted(slice) {
            const removeIds = (fragment: any): any => {
              const nodes: any[] = []

              fragment.forEach((node: any) => {
                let newNode = node

                if (filterNodes(node) && node.attrs[attributeName]) {
                  newNode = node.type.create(
                    {
                      ...node.attrs,
                      [attributeName]: null,
                    },
                    removeIds(node.content),
                    node.marks,
                  )
                } else if (node.content.size > 0) {
                  newNode = node.copy(removeIds(node.content))
                }

                nodes.push(newNode)
              })

              return fragment.constructor.fromArray(nodes)
            }

            return new (slice.constructor as any)(
              removeIds(slice.content),
              slice.openStart,
              slice.openEnd,
            )
          },
        },
      }),
    ]
  },
})
