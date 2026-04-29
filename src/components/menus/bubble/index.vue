<template>
  <bubble-menu
    class="arslan-editor-bubble-menu"
    :editor="editor!"
    :tippy-options="tippyOpitons"
  >
    <menus-bubble-menus v-if="options?.document?.enableBubbleMenu">
      <template #bubble_menu="props">
        <slot name="bubble_menu" v-bind="props" />
      </template>
    </menus-bubble-menus>
  </bubble-menu>
</template>

<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3'
import type { Instance } from 'tippy.js'

const editor = inject('editor')
const options = inject('options')

// Bubble menu
let tippyInstance = $ref<Instance | null>(null)
const tippyOpitons = $ref<Partial<Instance>>({
  appendTo: 'parent',
  maxWidth: 580,
  zIndex: 110,
  onShow(instance: Instance) {
    tippyInstance = instance
  },
  onDestroy() {
    tippyInstance = null
  },
})

// Destroy tippy
onUnmounted(() => {
  if (tippyInstance) {
    tippyInstance.destroy()
    tippyInstance = null
  }
})
</script>

<style lang="less">
.arslan-editor-bubble-menu {
  border-radius: var(--arslan-radius);
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  padding: 8px 10px;
  box-shadow: var(--arslan-shadow);
  border: 1px solid var(--arslan-border-color);
  background-color: var(--arslan-color-white);

  &:empty {
    display: none;
  }

  .arslan-menu-button.show-text .arslan-button-content .arslan-button-text {
    display: none !important;
  }

  .arslan-menu-button.huge {
    height: var(--td-comp-size-xs);
    min-width: unset;

    .arslan-button-content {
      min-width: unset !important;

      .arslan-icon {
        font-size: 16px;
        margin-top: 0;
      }
    }
  }
}
</style>

