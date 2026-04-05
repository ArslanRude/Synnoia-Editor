<template>
  <menus-button :ico="content ? 'edit' : 'diagrams'"
    :text="content ? t('tools.diagrams.edit') : t('tools.diagrams.text')" huge @menu-click="dialogVisible = true">
    <modal :visible="dialogVisible" icon="diagrams"
      :header="content ? t('tools.diagrams.edit') : t('tools.diagrams.text')" :footer="false"
      class="arslan-diagrams-dialog" mode="full-screen" @close="dialogVisible = false">
      <div v-if="loading" class="arslan-diagrams-loading">
        <t-loading :text="t('tools.diagrams.loading')" size="small" />
      </div>
      <div class="arslan-diagrams-container"></div>
    </modal>
  </menus-button>
</template>

<script setup lang="ts">
import DiagramEditor from '@/utils/diagram-editor'
import { shortId } from '@/utils/short-id'

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
})

const container = inject('container')
const editor = inject('editor')
const options = inject('options')
const uploadFileMap = inject('uploadFileMap')

let dialogVisible = $ref(false)
let loading = $ref(false)
const diagramEditor = new DiagramEditor({
  domain: (options.value.diagrams?.domain ?? '') as string,
  params: (options.value.diagrams?.params ?? {}) as Record<string, any>,
  container: `${container} .arslan-diagrams-container`,
})

let image = $ref<
  | {
    id: string
    type: string
    src: string
    name: string
    size: number
    width: number
    height: number
    content: string
  }
  | undefined
>()

function fixSvgDarkMode(svgText: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')

  // Check for parse errors
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    console.warn('SVG parse error, returning original')
    return svgText
  }

  // Also fix the root <svg> style attribute which sets background for dark mode
  const svgEl = doc.documentElement
  const svgStyle = svgEl.getAttribute('style') || ''
  if (svgStyle.includes('light-dark') || svgStyle.includes('color-scheme')) {
    // Replace the whole style with a clean white background
    svgEl.setAttribute('style', 'background: #ffffff;')
  }

  // Walk ALL elements and strip light-dark() from inline styles
  const allElements = doc.querySelectorAll('*')
  allElements.forEach((el) => {
    const style = el.getAttribute('style')
    if (!style) return
    if (!style.includes('light-dark') && !style.includes('color-scheme')) return

    // Remove fill, stroke, color, background properties that use light-dark()
    // Split by semicolon, filter out the offending declarations, rejoin
    const cleaned = style
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        if (!s) return false
        const prop = s.split(':')[0].trim().toLowerCase()
        const val = s.slice(s.indexOf(':') + 1).trim()
        // Remove any property whose value contains light-dark() or color-scheme
        if (val.includes('light-dark') || val.includes('color-scheme')) return false
        return true
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

const messageListener = async (evt: MessageEvent) => {
  if (evt?.type !== 'message' || typeof evt?.data !== 'string') {
    return
  }

  const { event, bounds, data } = JSON.parse(evt.data)
  if (event === 'load') {
    loading = false
  }
  if (event === 'export') {
    if (!props.content || (props.content && props.content !== data)) {
      const id = shortId(10)
      const { width, height } = bounds
      const name = `diagrams-${shortId()}.svg`

      // Decode SVG from data URL, apply dark mode fix, then create file
      let svgText = ''
      if (data.startsWith('data:image/svg+xml;base64,')) {
        const base64 = data.slice('data:image/svg+xml;base64,'.length)
        svgText = atob(base64)
      } else if (data.startsWith('data:image/svg+xml,')) {
        svgText = decodeURIComponent(data.slice('data:image/svg+xml,'.length))
      }

      // Apply dark mode fix to strip light-dark() CSS functions
      const fixedSvgText = svgText ? fixSvgDarkMode(svgText) : svgText

      // Convert fixed SVG back to blob
      const blob = new Blob([fixedSvgText], { type: 'image/svg+xml' })
      const file = new File([blob], name, { type: 'image/svg+xml' })

      // Create a new data URL from the fixed SVG for the src
      const fixedDataUrl = 'data:image/svg+xml;base64,' + btoa(fixedSvgText)

      uploadFileMap.value.set(id, file)
      image = {
        id,
        type: 'diagrams',
        name,
        size: file.size,
        src: fixedDataUrl,
        width,
        height,
        content: data,
      }
    }
    dialogVisible = false
    return
  }
  if (event === 'exit') {
    dialogVisible = false
  }
}

watch(
  () => dialogVisible,
  async (val: boolean) => {
    if (!val) {
      window.removeEventListener('message', messageListener)
      diagramEditor.stopEditing()
      if (image?.type) {
        editor.value?.chain().focus().setImage(image, !!props.content).run()
      }
      return
    }
    await nextTick()
    loading = true
    diagramEditor.edit(props.content ?? '')
    window.addEventListener('message', messageListener)
    image = undefined
  },
  { immediate: true },
)
</script>

<style lang="less">
.arslan-diagrams-dialog {
  .arslan-dialog {
    padding: 0 !important;
  }

  .arslan-dialog__header {
    background: var(--arslan-color-white);
    height: var(--td-comp-size-xxxl);
  }

  .arslan-dialog__body {
    padding: 0;
  }
}

.arslan-diagrams-loading {
  width: 100%;
  height: calc(100% - var(--td-comp-size-xxxl));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  background-color: var(--arslan-container-background);
}

.arslan-diagrams-container {
  height: 100%;

  .arslan-diagrams-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
}
</style>
