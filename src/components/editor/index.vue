  <template>
    <!-- <button
    @click="handleButtonClick"
    class="demo-button z-50"
    style="position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
  >
    Click me!
  </button> -->
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



const handleButtonClick = () => {
  const text = editor.value.getJSON()
  console.log(text)
  editor.value.commands.insertContent(text)
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

