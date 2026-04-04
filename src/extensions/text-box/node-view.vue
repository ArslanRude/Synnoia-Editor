<template>
  <node-view-wrapper :id="node.attrs.id" ref="containerRef" class="arslan-node-view arslan-floating-node" :style="{
    zIndex: 90,
    '--arslan-textbox-border-color': node.attrs.borderColor,
    '--arslan-textbox-border-width': node.attrs.borderWidth + 'px',
    '--arslan-textbox-border-style': node.attrs.borderStyle,
    '--arslan-textbox-background-color': node.attrs.backgroundColor,
  }">
    <div class="arslan-node-container arslan-node-text-box">
      <drager :selected="selected" :disabled="disabled" :draggable="!options?.document?.readOnly" :rotatable="true"
        :boundary="false" :angle="node.attrs.angle" :width="node.attrs.width" :height="node.attrs.height"
        :left="node.attrs.left" :top="node.attrs.top" :min-width="14" :min-height="14" :title="t('node.textBox.tip')"
        @rotate="onRotate" @resize="onResize" @drag="onDrag" @blur="disabled = false" @click="selected = true"
        @dblclick="editTextBox">
        <node-view-content ref="contentRef" class="arslan-node-text-box-content" />
      </drager>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import Drager from 'es-drager'

const { node, updateAttributes } = defineProps(nodeViewProps)

const options = inject('options')

const containerRef = ref(null)
const contentRef = $ref(null)
let selected = $ref(false)
let disabled = $ref(false)

const onRotate = ({ angle }: { angle: number }) => {
  updateAttributes({ angle })
}
const onResize = ({ width, height }: { width: number; height: number }) => {
  updateAttributes({ width, height })
}
const onDrag = ({ left, top }: { left: number; top: number }) => {
  updateAttributes({ left, top })
}

onClickOutside(containerRef, () => {
  selected = false
  disabled = false
})

const editTextBox = () => {
  disabled = true
  const range = document.createRange()
  range.selectNodeContents(contentRef.$el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  contentRef.$el.focus()
}
</script>

<style lang="less">
    .arslan-node-view{
      &,
      & *,
      &::before,
      &::after {
        border: none !important;
      }
    }
.arslan-node-view {
  .arslan-node-text-box {
    position: relative;

    .es-drager {
      user-select: text !important;
      cursor: default !important;
      z-index: 90 !important;
      background-color: var(--arslan-textbox-background-color);

      &.dragging {
        caret-color: transparent;
      }

      &.disabled {
        outline: none;

        &:after {
          display: none !important;
        }
      }

      &.selected {
        .arslan-node-text-box-content {
          outline: none;
        }
      }

      &.disabled.selected {
        .arslan-node-text-box-content {
          outline: var(--arslan-textbox-border-style) var(--arslan-textbox-border-width) var(--arslan-textbox-border-color);
        }
      }
    }

    .arslan-node-text-box-content {
      outline: var(--arslan-textbox-border-style) var(--arslan-textbox-border-width) var(--arslan-textbox-border-color);
      height: 100%;
      padding: 5px;
      box-sizing: border-box;
      overflow: hidden;
    }
  }
}
</style>

