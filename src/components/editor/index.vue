<template>
  <!-- <button @click="handleButtonClick" class="demo-button z-50"
    style="position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
    Export JSON
  </button>
  <div class="json-import-box z-50"
    style="position: fixed; top: 70px; right: 20px; padding: 15px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; width: 300px;">
    <textarea v-model="jsonInput" placeholder="Paste JSON here..." rows="6"
      style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical;" />
    <button @click="handleImportJson"
      style="margin-top: 10px; width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Import JSON to Document
    </button>
  </div> -->
  <editor-content class="arslan-editor-content" :class="{
    'show-bookmark': page.showBookmark,
    'show-line-number': page.showLineNumber,
    'format-painter': editor?.view?.painter?.enabled,
    'is-empty': editor?.isEmpty && editor?.state.doc.childCount <= 1,
    'is-readonly': !editor?.editable,
    'show-model': assistant,
  }" :editor="editor" :style="{
    lineHeight: defaultLineHeight,
  }" :spellcheck="options.document?.enableSpellcheck && $document.enableSpellcheck
    " />
  <template v-if="editor && !destroyed && !page.preview?.enabled && editor.isEditable">
    <menus-context-block v-if="options.document?.enableBlockMenu" />
    <menus-bubble v-if="options.document?.enableBubbleMenu"
      v-show="!editor?.view?.painter?.enabled && !editor?.isEmpty" />
    <menus-bubble-link v-if="editor?.storage.link.edit" />
  </template>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'

import { getDefaultExtensions, inputAndPasteRules } from '@/extensions'
import { contentTransform } from '@/utils/content-transform'
import { websocketService } from '@/services/websocket'

const destroyed = inject('destroyed')
const page = inject('page')
const options = inject('options')
const uploadFileMap = inject('uploadFileMap')
// Assistant
const assistant = inject('assistant')

const $document = useState('document', options)

const defaultLineHeight = $computed(
  () =>
    options.value.dicts?.lineHeights?.find((item: any) => item.default)?.value,
)

const container = inject('container')
const extensions: any[] = getDefaultExtensions({
  container,
  options,
  uploadFileMap,
})

const editorInstance: Editor = new Editor({
  editable: !options.value.document?.readOnly,
  autofocus: options.value.document?.autofocus,
  content: contentTransform(options.value.document?.content),
  enableInputRules: inputAndPasteRules(options),
  enablePasteRules: inputAndPasteRules(options),
  editorProps: {
    attributes: {
      class: 'arslan-editor',
    },
    ...options.value.document?.editorProps,
  },
  parseOptions: options.value.document?.parseOptions,
  extensions: [...extensions, ...options.value.extensions],
  onUpdate({ editor }) {
    const throttleFn = useThrottleFn(() => {
      $document.value.content = editor.getHTML()
    }, 1000)
    void throttleFn()
  },
})
const editor = inject('editor')
editor.value = editorInstance
editor.value.storage.container = container
watch(
  () => options.value,
  () => {
    editor.value.storage.options = options.value
  },
  { immediate: true, deep: true },
)

// JSON import functionality
let jsonInput = $ref('')

const handleImportJson = () => {
  if (!jsonInput.trim()) {
    alert('Please enter JSON content')
    return
  }

  try {
    const parsedContent = JSON.parse(jsonInput)
    editor.value.commands.setContent(parsedContent)
    alert('Document imported successfully!')
    jsonInput = ''
  } catch (error) {
    alert('Invalid JSON format: ' + (error as Error).message)
  }
}



const handleButtonClick = () => {
  const { state } = editor.value
  const { selection } = state

  // Check if there's a non-empty selection
  const isSelectionEmpty = selection.empty || selection.from === selection.to

  let content
  if (isSelectionEmpty) {
    // No selection, get entire document
    content = editor.value.getJSON()
  } else {
    // Get only selected content
    const slice = selection.content()
    content = {
      type: 'doc',
      content: slice.content.toJSON()
    }
  }

  console.log(content)

  // Create a text file with the content
  const contentStr = JSON.stringify(content, null, 2)
  const blob = new Blob([contentStr], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  // Create a temporary link and trigger download
  const a = document.createElement('a')
  a.href = url
  a.download = isSelectionEmpty ? 'editor-content.json' : 'selection.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Dynamically import katex style
const loadTatexStyle = () => {
  const katexStyleElement = document.querySelector('#katex-style')
  if (
    katexStyleElement === null &&
    !options.value.toolbar?.disableMenuItems.includes('math')
  ) {
    const style = document.createElement('link')
    style.href = `${options.value.cdnUrl}/libs/katex/katex.min.css`
    style.rel = 'stylesheet'
    style.id = 'katex-style'
    document.querySelector('head')?.append(style)
  }
}

onMounted(() => {
  loadTatexStyle()
  // Initialize WebSocket connection
  websocketService.connect().catch(error => {
    console.error('Failed to connect to WebSocket:', error)
  })
})

// Destroy editor instance
onBeforeUnmount(() => {
  editorInstance.destroy()
  // Disconnect WebSocket
  websocketService.disconnect()
})
</script>

<style lang="less">
@import '@/assets/styles/editor.less';
@import '@/assets/styles/drager.less';
</style>