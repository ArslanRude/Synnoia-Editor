<template>
  <menus-button
    v-if="select"
    :text="t('base.fontSize.text')"
    menu-type="select"
    hide-text
    style="width: 80px"
    :select-options="fontSizes"
    :select-value="
      isTypeRunning
        ? null
        : editor?.getAttributes('textStyle').fontSize || '12px'
    "
    v-bind="$attrs"
    :placeholder="t('base.fontSize.text')"
    filterable
    @menu-click="setFontSize"
  >
  </menus-button>
  <menus-button
    v-if="!disableItem('font-size-increase')"
    ico="font-size-increase"
    :text="t('base.fontSize.increase')"
    hide-text
    @menu-click="increaseFontSize"
  />
  <menus-button
    v-if="!disableItem('font-size-decrease')"
    ico="font-size-decrease"
    :text="t('base.fontSize.decrease')"
    hide-text
    @menu-click="decreaseFontSize"
  />
</template>

<script setup lang="ts">
const props = defineProps({
  select: {
    type: Boolean,
    default: true,
  },
})

const editor = inject('editor')
const options = inject('options')
const $toolbar = useState('toolbar', options)
const disableItem = (name: string) => {
  return options.value.toolbar?.disableMenuItems.includes(name)
}
import { getTypewriterRunState } from '@/extensions/type-writer'
let isTypeRunning = $ref(false)
watch(
  () => getTypewriterRunState(),
  (newValue: boolean) => {
    isTypeRunning = newValue
  },
)
const fontSizes = Array.from({length: 96}, (_, i) => ({
  label: String(i+1),
  value: `${i+1}px`,
  order: i+1
}));

// Set font size
const setFontSize = (fontSize: string) => {
  editor.value?.chain().focus().setFontSize(fontSize).run()
}

// Increase font size
const increaseFontSize = () => {
  const { fontSize } = editor.value?.getAttributes('textStyle') ?? {}
  if (fontSize) {
    const size = fontSizes.find(({ value }) => value === fontSize)
    if (!size) {
      return
    }
    const nextFont = fontSizes.find(({ order }) => order === size.order + 1)
    if (nextFont) {
      setFontSize(nextFont.value)
    }
  } else {
    setFontSize('12px')
  }
}

// Decrease font size
const decreaseFontSize = () => {
  const { fontSize } = editor.value?.getAttributes('textStyle') ?? {}
  if (fontSize) {
    const size = fontSizes.find(({ value }) => value === fontSize)
    if (!size) {
      return
    }
    const prevFont = fontSizes.find(({ order }) => order === size.order - 1)
    if (prevFont) {
      setFontSize(prevFont.value)
    }
  } else {
    setFontSize('12px')
  }
}
</script>
