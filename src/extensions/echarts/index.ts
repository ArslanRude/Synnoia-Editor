import { mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

import NodeView from './node-view.vue'
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    // Add chart
    setEcharts: {
      setEcharts: (options: any) => ReturnType
    }
    // Update command type definition
    updateEcharts: {
      updateEcharts: (options: any) => ReturnType
    }
  }
}
// Component extends echarts, adapting standard echarts, and can also convert custom attributes
export default Node.create({
  name: 'echarts',
  inline: false,
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      vnode: {
        default: true,
      },
      id: {
        // Graph unique identifier, if generating an image, this is the unique identifier
        default: null,
      },
      name: {
        // Name
        default: null,
      },
      width: {
        default: 530,
      },
      height: {
        default: 300,
      },
      draggable: {
        default: false,
      },
      mode: {
        // When setting the chart, the default mode is 0, which means directly using echarts' options, json: source code mode, 1: visualization mode, can be configured to create charts
        default: 1,
      },
      chartOptions: {
        // Display configuration, echarts' options, mode==0 uses
        default: null,
        // When parsing HTML, try to parse chartOptions from string back to object
        parseHTML: (element) => {
          const _data = element.hasAttribute('chart-options')
            ? element.getAttribute('chart-options')
            : null
          return _data ? JSON.parse(_data) : null
        },
        renderHTML: (attributes) => ({
          // When rendering HTML, ensure chartOptions is serialized to string
          'chart-options': attributes.chartOptions
            ? JSON.stringify(attributes.chartOptions)
            : null,
        }),
      },
      chartConfig: {
        // Basic configuration, later adapt custom data collection and configuration information mode==1 uses
        default: null,
        parseHTML: (element) => {
          const _data = element.hasAttribute('chart-config')
            ? element.getAttribute('chart-config')
            : null
          return _data ? JSON.parse(_data) : null
        },
        renderHTML: (attributes) => ({
          'chart-config': attributes.chartConfig
            ? JSON.stringify(attributes.chartConfig)
            : null,
        }),
      },
      src: '', // Image address path, also records image unique identifier
      describe: {
        // Description information
        default: null,
      },
    }
  },
  parseHTML() {
    return [{ tag: 'echarts' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['echarts', mergeAttributes(HTMLAttributes)]
  },
  addNodeView() {
    return VueNodeViewRenderer(NodeView)
  },
  addCommands() {
    return {
      setEcharts:
        (options) =>
        ({ commands, editor }) => {
          return commands.insertContentAt(editor.state.selection.anchor, {
            type: this.name,
            attrs: options,
          })
        },
      // Add update command
      updateEcharts:
        (options) =>
        ({ commands, editor, tr }) => {
          // Get the currently selected node
          editor.commands.selectParentNode()
          const { selection } = editor.state
          tr.setSelection(selection)
          const { doc } = tr
          const { from, to } = selection
          doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === this.name) {
              // Update the attributes of the selected node
              commands.updateAttributes(this.name, options)
              return false
            }
            return true
          })
          return true
        },
    }
  },
})
