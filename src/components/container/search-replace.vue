<template>
  <modal
    :visible="searchReplace"
    icon="search-replace"
    :header="t('search.title')"
    :footer="false"
    class="umo-search-replace-dialog"
    width="420px"
    mode="modeless"
    :z-index="200"
    @close="searchReplace = false"
  >
    <div class="">
      <div class="umo-search-text flex mt-1">
        <t-input
          v-model="searchText"
          :placeholder="t('search.searchText')"
          clearable
          autofocus
          @enter="next"
          class="w-[300px] mr-2 !border-highlight-light dark:!border-highlight-dark rounded-lg !text-text-light dark:!text-text-dark !bg-transparent"
        >
          <template #suffix>
            {{
              searchText !== '' && resultLength !== 0
                ? editor?.storage?.searchAndReplace?.resultIndex + 1
                : 0
            }}
            /
            {{ resultLength }}
          </template>
        </t-input>
        <t-button
          :disabled="resultLength === 0"
          shape="square"
          variant="text"
          @click="next"
          class="p-1 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <icon name="arrow-down" class="icon-next text-xl" />
        </t-button>
        <t-button
          :disabled="resultLength === 0"
          shape="square"
          variant="text"
          @click="previous"
          class="p-1 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <icon name="arrow-down" class="icon-prev text-xl" />
        </t-button>
      </div>
      <div class="umo-replace-text mt-3">
        <t-input
          v-model="replaceText"
          :placeholder="t('search.replaceText')"
          clearable
          class="w-full p-2 bg-transparent border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/70"
        />
      </div>
      <div class="umo-advanced-options mt-3">
        <t-checkbox
          v-model="caseSensitive"
          class="mr-4 text-blue-500 focus:ring-blue-400/50"
        >
          {{ t('search.caseSensitive') }}
        </t-checkbox>
      </div>
      <div class="umo-button-actions mt-3 text-right space-x-2">
        <t-button
          :disabled="resultLength === 0"
          theme="default"
          variant="text"
          @click="replace"
          class="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-300/70 dark:hover:bg-gray-600/70 disabled:opacity-50 disabled:cursor-not-allowed"
          v-text="t('search.replace')"
        >
        </t-button>
        <t-button
          :disabled="resultLength === 0"
          theme="default"
          variant="text"
          @click="replaceAll"
          class="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-300/70 dark:hover:bg-gray-600/70 disabled:opacity-50 disabled:cursor-not-allowed"
          v-text="t('search.replaceAll')"
        >
        </t-button>
        <t-button
          :disabled="resultLength === 0"
          theme="primary"
          @click="next"
          class="px-4 py-2 text-white bg-blue-500/80 rounded-lg hover:bg-blue-600/90 disabled:opacity-50 disabled:cursor-not-allowed"
          v-text="t('search.search')"
        ></t-button>
      </div>
    </div>
  </modal>
</template>

<script setup lang="ts">
import { getSelectionText } from '@/extensions/selection'

const editor = inject('editor')
const searchReplace = inject('searchReplace')

let searchText = $ref<string>('')
let replaceText = $ref<string>('')
const caseSensitive = $ref<boolean>(false)

const resultLength = computed(
  () => editor.value?.storage.searchAndReplace?.results.length || 0,
)

const clear = () => {
  searchText = ''
  replaceText = ''
  editor.value?.commands.resetIndex()
}

const search = (clearIndex = false) => {
  if (!editor.value) {
    return
  }
  if (clearIndex) {
    editor.value.commands.resetIndex()
  }
  editor.value.commands.setSearchTerm(searchText)
  editor.value.commands.setReplaceTerm(replaceText)
  editor.value.commands.setCaseSensitive(caseSensitive)
}

const goToSelection = () => {
  if (!editor.value) {
    return
  }
  const { results, resultIndex } = editor.value.storage.searchAndReplace
  const position = results[resultIndex]
  if (!position) {
    return
  }
  editor.value.commands.setTextSelection(position)
  const { node } = editor.value.view.domAtPos(
    editor.value.state.selection.anchor,
  )
  ;(node as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
}

watch(
  () => searchText.trim(),
  (val: string, oldVal: string) => {
    if (!val) {
      clear()
    }
    if (val !== oldVal) {
      search(true)
    }
  },
)
watch(
  () => replaceText.trim(),
  (val: string, oldVal: string) => (val === oldVal ? null : search()),
)

watch(
  () => caseSensitive,
  (val: boolean, oldVal: boolean) => {
    if (val !== oldVal) {
      search(true)
    }
  },
)

const next = () => {
  editor.value?.commands.nextSearchResult()
  goToSelection()
}

const previous = () => {
  editor.value?.commands.previousSearchResult()
  goToSelection()
}

const replace = () => {
  editor.value?.commands.replace()
  goToSelection()
}

const replaceAll = () => editor.value?.commands.replaceAll()

watch(
  () => searchReplace.value,
  (visible: boolean) => {
    searchText = visible ? getSelectionText(editor.value) : ''
  },
)
</script>

<style lang="less">
.umo-search-replace-dialog {
  .umo-dialog {
    position: absolute;
    right: 25px;
    top: 131px;
    user-select: none;
    background-color: transparent !important;
    backdrop-filter: blur(5px);
    box-shadow: 1px 1px 2px !important;
  }
}

.umo-editor-container.toolbar-classic {
  .umo-dialog {
    top: 65px;
  }
}
</style>

<style lang="less" scoped>
.icon-prev {
  transform: rotate(-180deg);
}
</style>
