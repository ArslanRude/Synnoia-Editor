<template>
  <div v-if="$toolbar.mode !== 'classic'" class="umo-toolbar-headding" :disabled="!editor?.isEditable">
    <div class="umo-heading-container">
      <div class="card custom-style-card" @click="showCustomStyleForm = true" title="Create a custom heading style">
        <div class="title">+</div>
        <div class="subtitle">Custom</div>
      </div>
      <template v-for="(item, index) in options" :key="item.value">
        <div class="card" :class="{ active: item.value === currentValue && editor?.isEditable }"
          @click="setHeading(item.value)">
          <div class="title" :class="item.desc">{{ item.label }}</div>
          <div class="subtitle">{{ item.desc }}</div>
          <div v-if="customStyles.some((style) => style.value === item.value)" class="delete-icon"
            @click.stop="confirmDeleteStyle(item.value)" title="Delete this style">
            ×
          </div>
        </div>
      </template>
    </div>

    <!-- Custom Style Form Modal with Tailwind CSS -->
    <div v-if="showCustomStyleForm" class="backdrop-blur-sm fixed inset-0 flex justify-center items-center z-50">
      <div class="rounded-lg p-4 w-[450px] max-w-[95%] shadow-lg max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-base font-semibold text-text-light dark:text-text-dark m-0">{{ t('Create New Style') }}</h3>
          <button @click="showCustomStyleForm = false"
            class="bg-transparent border-none text-xl cursor-pointer text-gray-500 dark:text-gray-400">×</button>
        </div>
        <div class="flex flex-col gap-3 w-full">
          <div class="flex items-center gap-2">
            <label class="w-24 text-sm text-text-light dark:text-text-dark">Name:</label>
            <input v-model="newStyleName" placeholder="e.g., Custom Heading"
              class="flex-1 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
          <div class="flex items-center gap-2">
            <label class="w-24 text-sm text-text-light dark:text-text-dark">Description:</label>
            <input v-model="newStyleDesc" placeholder="e.g., Custom description"
              class="flex-1 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
          <div class="flex items-center gap-2">
            <label class="w-24 text-sm text-text-light dark:text-text-dark">Font Size:</label>
            <input v-model="newStyleFontSize" type="number" placeholder="e.g., 16" min="8" max="72"
              class="flex-1 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
          <div class="flex items-center gap-2">
            <label class="w-24 text-sm text-text-light dark:text-text-dark">Font Family:</label>
            <select v-model="newStyleFontFamily"
              class="flex-1 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
              <option value="">Default</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="w-24 text-sm text-text-light dark:text-text-dark">Font Weight:</label>
            <select v-model="newStyleFontWeight"
              class="flex-1 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
              <option value="">Default</option>
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="bolder">Bolder</option>
              <option value="lighter">Lighter</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="w-24 text-sm text-text-light dark:text-text-dark">Color:</label>
            <input v-model="newStyleColor" type="color"
              class="w-10 p-0 border-none rounded cursor-pointer bg-transparent" />
            <input v-model="newStyleColor" placeholder="e.g., #000000"
              class="flex-1 p-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showCustomStyleForm = false"
            class="px-3 py-1.5 rounded text-sm cursor-pointer bg-transparent border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white">{{
              t('Cancel') }}</button>
          <button @click="createCustomStyle"
            class="px-3 py-1.5 rounded text-sm cursor-pointer bg-blue-600 text-white border-none">{{ t('Create')
            }}</button>
        </div>
      </div>
    </div>
  </div>
  <menus-button v-else :text="t('base.heading.tip')" hide-text menu-type="select" :style="{ width: '76px' }"
    :placeholder="t('base.heading.text')" borderless :select-value="currentValue" @menu-click="setHeading">
    <t-option v-for="item in options" :key="item.value" class="umo-heading-select-option" :value="item.value"
      :label="item.label">
      <div class="heading-size" :class="item.desc">{{ item.label }}</div>
    </t-option>
  </menus-button>
</template>

<script setup lang="ts">
const container = inject('container')
const editor = inject('editor')
const $toolbar = useState('toolbar', inject('options'))

const options = $ref([
  { label: t('base.heading.paragraph'), desc: 'text', value: 'paragraph' },
])
for (const i of Array.from({ length: 6 }).keys()) {
  const level = i + 1
  options.push({
    label: `${t('base.heading.text', { level })}`,
    desc: `h${level}`,
    value: level,
  })
}
// Custom styles array to store user-defined heading styles
const customStyles = $ref([])

// State for custom style form visibility and input
const showCustomStyleForm = ref(false)
const newStyleName = ref('')
const newStyleDesc = ref('')
const newStyleFontSize = ref('')
const newStyleFontFamily = ref('')
const newStyleFontWeight = ref('')
const newStyleColor = ref('')

const currentValue = computed(() => {
  const heading = (level: any) => editor.value?.isActive('heading', { level })
  if (editor.value) {
    if (editor.value?.isActive('paragraph')) {
      return 'paragraph'
    }
    if (heading(1)) {
      return 1
    }
    if (heading(2)) {
      return 2
    }
    if (heading(3)) {
      return 3
    }
    if (heading(4)) {
      return 4
    }
    if (heading(5)) {
      return 5
    }
    if (heading(6)) {
      return 6
    }
  }
  return ''
})

const setHeading = (value: any) => {
  if (value === 'paragraph') {
    editor.value?.chain().focus().setParagraph().run()
  } else {
    editor.value?.chain().focus().toggleHeading({ level: value }).run()
  }
}

// Function to create a new custom heading style
const createCustomStyle = () => {
  const customCount = customStyles.length + 1
  const newStyle = {
    label: newStyleName.value || `Custom ${customCount}`,
    desc: newStyleDesc.value || `custom${customCount}`,
    value: `custom-${customCount}`,
    fontSize: newStyleFontSize.value || '',
    fontFamily: newStyleFontFamily.value || '',
    fontWeight: newStyleFontWeight.value || '',
    color: newStyleColor.value || ''
  }
  customStyles.push(newStyle)
  options.push(newStyle)
  showCustomStyleForm.value = false
  newStyleName.value = ''
  newStyleDesc.value = ''
  newStyleFontSize.value = ''
  newStyleFontFamily.value = ''
  newStyleFontWeight.value = ''
  newStyleColor.value = ''
  // Optionally apply the new style immediately
  // editor.value?.chain().focus().setHeading({ class: newStyle.value }).run()
}

// Function to add a new custom heading style (now just toggles form visibility)
const addCustomStyle = () => {
  showCustomStyleForm.value = true
}

// Function to confirm deletion of a custom style
const confirmDeleteStyle = (styleValue: string) => {
  const styleToDelete = customStyles.find((style) => style.value === styleValue)
  if (!styleToDelete) return

  const dialog = useConfirm({
    attach: container,
    theme: 'default',
    header: t('Delete style'),
    body: `${t('Are you sure you want to delete this style')} "${styleToDelete.label}"?
`,
    confirmBtn: {
      theme: 'danger',
      content: t('Delete'),
    },
    cancelBtn: {
      content: t('Cancel'),
    },
    async onConfirm() {
      // Remove from customStyles
      const customIndex = customStyles.findIndex(
        (style) => style.value === styleValue,
      )
      if (customIndex !== -1) customStyles.splice(customIndex, 1)

      // Remove from options
      const optionIndex = options.findIndex((opt) => opt.value === styleValue)
      if (optionIndex !== -1) options.splice(optionIndex, 1)

      dialog.destroy()
    },
  })
}
</script>

<style lang="less" scoped>
.umo-toolbar-headding {
  width: 318px;
  height: 100%;
  position: relative;
  z-index: 10;
  overflow: hidden;
  border-radius: 3px;
  box-sizing: border-box;

  &[disabled='true'] {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.umo-heading-container {
  display: flex;
  flex-flow: row nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  align-content: flex-start;
  border-radius: var(--umo-radius);
  box-sizing: border-box;
  white-space: nowrap;
  height: 100%;

  &::-webkit-scrollbar {
    height: 4px;
    margin-top: 2px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--umo-scrollbar-thumb-color);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--umo-scrollbar-thumb-hover-color);
  }

  /* For Firefox */
  scrollbar-width: thin;
  scrollbar-color: var(--umo-scrollbar-thumb-color) transparent;

  .card {
    border: solid 1px var(--umo-border-color-light);
    border-radius: var(--umo-radius);
    margin: 2px 4px;
    text-align: center;
    padding: 5px 8px;
    box-sizing: border-box;
    cursor: pointer;
    flex: 0 0 68px;
    height: 42px;
    position: relative;

    &:hover,
    &.active {
      border-color: var(--umo-primary-color);
    }

    .title {
      font-size: 11px;
      line-height: 18px;
      font-weight: 600;

      &.text {
        font-size: 12px;
        font-weight: 400;
      }

      &.h1 {
        font-size: 16px;
      }

      &.h2 {
        font-size: 14px;
      }

      &.h3 {
        font-size: 13px;
      }

      &.h4 {
        font-size: 12px;
      }

      &.h5 {
        font-size: 11px;
      }

      &.h6 {
        font-size: 10px;
      }
    }

    .subtitle {
      font-size: 8px;
      color: var(--umo-text-color-light);
      text-transform: capitalize;
      margin-top: 3px;
      line-height: 1;
    }

    .delete-icon {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 10px;
      color: var(--umo-text-color-light);
      cursor: pointer;
      display: none;
      background-color: var(--color-secondary-light);
      border-radius: 50%;
      width: 16px;
      height: 16px;
      line-height: 16px;
      text-align: center;
    }

    &:hover .delete-icon {
      display: block;
    }
  }

  .custom-style-card {
    background-color: rgba(0, 0, 0, 0.05);
    border-style: dashed;
    opacity: 0.8;

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
      border-color: var(--umo-primary-color);
      opacity: 1;
    }
  }
}

.text {
  font-size: 12px;
}

.h1 {
  font-size: 24px;
}

.h2 {
  font-size: 20px;
}

.h3 {
  font-size: 18px;
}

.h4 {
  font-size: 16px;
}

.h5 {
  font-size: 14px;
}

.h6 {
  font-size: 12px;
}
</style>

<style lang="less">
.umo-heading-select-option {
  height: auto !important;

  .heading-size {
    line-height: 2em;
    font-weight: 600;
    min-width: 100px;
    color: var(--umo-text-color);
  }

  .text {
    font-size: 12px;
    font-weight: 400;
    line-height: 2.4em;
  }

  .h1 {
    font-size: 24px;
  }

  .h2 {
    font-size: 20px;
  }

  .h3 {
    font-size: 18px;
  }

  .h4 {
    font-size: 16px;
  }

  .h5 {
    font-size: 14px;
  }

  .h6 {
    font-size: 12px;
  }
}
</style>
