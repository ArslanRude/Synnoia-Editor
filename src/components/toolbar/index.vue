<template>
  <div v-if="$toolbar.show" class="flex relative mx-3 mb-2 select-none">
    <toolbar-ribbon
      v-if="$toolbar.mode === 'ribbon'"
      :menus="toolbarMenus"
      :current-menu="currentMenu"
      @menu-change="menuChange"
    >
      <template
        v-for="item in options.toolbar?.menus"
        :key="item"
        #[`toolbar_${item}`]="props"
      >
        <slot :name="`toolbar_${item}`" v-bind="props" />
      </template>
    </toolbar-ribbon>
    <toolbar-classic
      v-if="$toolbar.mode === 'classic'"
      :menus="toolbarMenus"
      :current-menu="currentMenu"
      @menu-change="menuChange"
    >
      <template
        v-for="item in options.toolbar?.menus"
        :key="item"
        #[`toolbar_${item}`]="props"
      >
        <slot :name="`toolbar_${item}`" v-bind="props" />
      </template>
    </toolbar-classic>
    <div
      :class="[
        'flex items-center px-2.5 py-1 gap-2',
        $toolbar.mode === 'ribbon' ? 'absolute right-0' : '',
      ]"
    >
      <t-popup
        v-if="options.document.readOnly !== true"
        v-model="statusPopup"
        :attach="container"
        trigger="click"
        placement="bottom-right"
        @visible-change="(visible: boolean) => (statusPopup = visible)"
      >
        <t-button
          class="p-0 min-w-0 h-auto hover:bg-gray-100 dark:hover:bg-gray-700 [&:not(:last-child)]:mr-[3px]"
          :class="{ 'bg-gray-100 dark:bg-gray-700': statusPopup }"
          variant="text"
          size="small"
        >
          <span class="flex items-center text-xs cursor-pointer">
            <span
              class="w-2.5 h-2.5 rounded-full bg-red-600 mr-1.5"
              :class="{ 'bg-red-600': !online }"
            ></span>
            <span class="text-gray-500 dark:text-gray-400">
              <span
                v-if="savedAt"
                v-text="t('save.savedAtText', { time: timeAgo(savedAt) })"
              ></span>
              <span
                v-else
                class="text-red-500"
                v-text="t('save.unsaved')"
              ></span>
            </span>
          </span>
        </t-button>
        <template #content>
          <div
            class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg space-y-3 min-w-[250px] text-sm text-gray-700 dark:text-gray-200"
          >
            <div>
              {{ t('save.network') }}
              {{ online ? t('save.online') : t('save.offline') }}
            </div>
            <div>
              {{ t('save.savedAt') }}
              <span
                v-if="savedAt"
                v-text="t('save.savedAtText', { time: timeAgo(savedAt) })"
              ></span>
              <span v-else v-text="t('save.unsaved')"></span>
            </div>
            <div
              class="flex space-x-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
            >
              <t-button
                size="small"
                @click="saveContent"
                v-text="t('save.text')"
              ></t-button>
              <t-button
                size="small"
                variant="outline"
                @click="setContentFromCache"
                v-text="t('save.cache.text')"
              >
              </t-button>
            </div>
          </div>
        </template>
      </t-popup>
      <t-dropdown
        trigger="click"
        size="small"
        placement="bottom-right"
        :popup-props="{
          destroyOnClose: true,
          attach: container,
        }"
        @click="toggleToolbarMode"
      >
        <t-button
          class="rounded transition-colors"
          variant="text"
          size="small"
        >
        <div class="flex items-center p-2 rounded-xl hover:bg-primary-light ">
          <icon name="expand-down" class="text-text-light dark:text-text-dark " />
          <span
            class="flex items-center sm:inline hidden ml-1 text-text-light dark:text-text-dark"
          >
            {{ t('toolbar.toggle') }}
          </span>
        </div>
        </t-button>
        <template #dropdown>
          <t-dropdown-menu
            v-for="item in editorModeOptions"
            :key="item.value as string"
            :content="item.label"
            :value="item.value"
            :divider="item.divider"
            :active="item.value === $toolbar.mode"
          >
            <template #prefixIcon>
              <icon :name="item.prefixIcon" />
            </template>
          </t-dropdown-menu>
        </template>
      </t-dropdown>
    </div>
  </div>
  <tooltip v-else :content="t('toolbar.show')" placement="bottom-right">
    <div
      class="cursor-pointer absolute right-5 text-lg p-[3px_6px] z-[99] bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-b-md border border-t-0 border-gray-200 dark:border-gray-600 hover:shadow-sm hover:text-red-500 dark:hover:text-red-400 transition-colors"
      @click="$toolbar.show = true"
    >
      <icon name="arrow-down" />
    </div>
  </tooltip>
</template>

<script setup lang="ts">
import type { DropdownOption } from 'tdesign-vue-next'

import { timeAgo } from '@/utils/time-ago'
const emits = defineEmits(['menu-change'])

const container = inject('container')
const editor = inject('editor')
const savedAt = inject('savedAt')
const options = inject('options')
const $toolbar = useState('toolbar', options)
let statusPopup = $ref(false)
const online = useOnline()

// Toolbar menus
const defaultToolbarMenus = [
  { label: t('toolbar.base'), value: 'base' },
  { label: t('toolbar.insert'), value: 'insert' },
  { label: t('toolbar.table'), value: 'table' },
  { label: t('toolbar.tools'), value: 'tools' },
  { label: t('toolbar.page'), value: 'page' },
  { label: t('toolbar.export'), value: 'export' },
]
let toolbarMenus = defaultToolbarMenus
if (options.value.toolbar?.menus) {
  toolbarMenus = options.value.toolbar?.menus.map(
    (item: any) => defaultToolbarMenus.filter((menu) => menu.value === item)[0],
  )
}
let currentMenu = $ref(toolbarMenus[0].value)
const menuChange = (menu: string) => {
  currentMenu = menu
  emits('menu-change', menu)
}
// Watch if the current editing element is table then switch to table menu
watch(
  () => editor.value?.isActive('table'),
  (val: boolean, oldVal: boolean) => {
    if (val) {
      currentMenu = 'table'
    } else if (!val && oldVal) {
      currentMenu = 'base'
    }
  },
)

// Switch editor mode
const editorModeOptions = [
  {
    label: t('toolbar.ribbon'),
    value: 'ribbon',
    prefixIcon: 'toolbar-ribbon',
  },
  {
    label: t('toolbar.classic'),
    value: 'classic',
    prefixIcon: 'toolbar-classic',
  },
  {
    label: t('toolbar.hide'),
    value: 'hideToolbar',
    prefixIcon: 'hide-toolbar',
  },
]

const toggleToolbarMode = ({ value }: DropdownOption) => {
  if (value === 'hideToolbar') {
    $toolbar.value.show = false
  } else {
    $toolbar.value.show = true
    $toolbar.value.mode = value as string
  }
}

// Save document
const saveContentMethod = inject('saveContent') as () => void
const saveContent = () => {
  saveContentMethod()
  statusPopup = false
}

// Restore document from cache
const setContentFromCache = () => {
  const document = useState('document', options)
  const { content } = document.value
  if (!content || content === '' || content === '<p></p>') {
    const dialog = useAlert({
      attach: container,
      theme: 'info',
      header: t('save.cache.error.title'),
      body: t('save.cache.error.message'),
      onConfirm() {
        dialog.destroy()
      },
    })
    return
  }
  statusPopup = false
  editor.value?.chain().setContent(content, true).focus().run()
}
</script>
