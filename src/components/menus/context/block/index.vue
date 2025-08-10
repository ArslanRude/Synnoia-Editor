<template>
  <drag-handle
    :editor="editor"
    :tippy-options="tippyOpitons"
    class="arslan-block-menu-drag-handle"
    :class="{ 'is-empty': editor.isEmpty }"
    @node-change="nodeChange"
  >
    <div
      class="arslan-block-menu-hander"
      :class="`arslan-selected-node-${selectedNode?.type?.name || 'unknown'} `"
    >
      <menus-context-block-node @dropdown-visible="dropdownVisible" />
      <menus-context-block-common
        v-if="
          !editor.isEmpty ||
          editor.isActive('table') ||
          editor.isActive('callout')
        "
        :node="selectedNode"
        :pos="selectedNodePos"
        @dropdown-visible="dropdownVisible"
      />
    </div>
  </drag-handle>
</template>

<script setup lang="ts">
import DragHandle from '@tiptap-pro/extension-drag-handle-vue-3'
import type { Instance } from 'tippy.js'

const editor = inject('editor')
let selectedNode = $ref(null)
let selectedNodePos = $ref(null)

let tippyInstance = $ref<Instance | null>(null)
const tippyOpitons = $ref<Partial<Instance>>({
  zIndex: 20,
  popperOptions: {
    modifiers: [
      {
        name: 'eventListeners',
        options: { scroll: false, resize: false },
      },
    ],
  },
  onMount(instance: Instance) {
    tippyInstance = instance
  },
})

// 菜单位置更新
const updateMenuPostion = useThrottleFn(() => {
  if (!tippyInstance) {
    return
  }
  try {
    const { state, view } = editor.value
    const topPos = state.selection.$from.before(1)
    const topDOM = view.nodeDOM(topPos)
    const rect = topDOM?.getBoundingClientRect()
    if (rect) {
      tippyInstance.setProps({
        getReferenceClientRect: () => rect,
      })
    }
  } catch {}
}, 200)

onMounted(() => {
  editor.value.on('selectionUpdate', updateMenuPostion)
})

const nodeChange = ({ node, pos }: { node: Node | null; pos: number }) => {
  selectedNode = node ?? null
  if (pos !== null) {
    selectedNodePos = pos
  }
}

const dropdownVisible = (visible: boolean) => {
  editor.value.commands.setMeta('lockDragHandle', visible)
}
</script>

<style lang="less">
.arslan-block-menu {
  .arslan-menu-button {
    color: var(--arslan-text-color-light) !important;
  }
  &-drag-handle.is-empty {
    .arslan-block-menu-hander {
      margin-top: 2px;
    }
  }
  &-hander {
    position: absolute;
    display: flex;
    right: -10px;
    top: -5px;
    padding-right: 15px;
    @media print {
      display: none;
    }
    &.arslan-selected-node {
      &-table,
      &-horizontalRule,
      &-ProseMirror-gapcursor {
        margin-top: 5px;
      }
      &-pageBreak {
        margin-top: -6px;
      }
    }
    .arslan-menu-button {
      background-color: var(--arslan-page-background);
      .arslan-button-content {
        color: rgba(0, 0, 0, 0.5);
      }
      &:not(.active):hover {
        background-color: var(--arslan-content-node-selected-background);
      }
      &.active {
        &:hover {
          opacity: 0.8;
        }
        .arslan-button-content {
          color: var(--arslan-text-color-light);
        }
      }
    }
  }
  &-dropdown {
    .arslan-block-menu-group-name {
      padding-left: 15px !important;
    }
    .arslan-dropdown__menu,
    .arslan-dropdown__submenu {
      --td-radius-default: 0;
      padding: 8px 0 !important;
      .arslan-divider {
        margin: 4px 0 2px;
        opacity: 0.5;
      }
      .arslan-dropdown__item {
        padding: 2px 0;
        min-width: 140px !important;
        .arslan-menu-button {
          background-color: transparent;
          padding: 0 15px;
          box-sizing: border-box;
          justify-content: flex-start;
          width: 100%;
          &-wrap {
            display: block !important;
          }
          .arslan-button__text {
            width: 100%;
          }
        }
        .arslan-button-content {
          width: 100%;
          justify-content: flex-start;
          .arslan-button-text {
            color: var(--arslan-text-color);
          }
          .arslan-button-icon {
            margin-right: 3px;
            font-size: 16px;
            color: #666;
          }
          .arslan-button-kbd {
            flex: 1;
            text-align: right;
            color: var(--arslan-text-color-light);
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
          }
          .arslan-heading {
            display: flex;
            color: var(--arslan-text-color);
            .icon-heading {
              font-size: 12px;
              display: inline-block;
              width: 2em;
            }
          }
        }
        &--disabled {
          .arslan-button-content {
            opacity: 0.6;
          }
        }
        &-direction {
          opacity: 0.4;
          font-size: 12px !important;
          margin-right: 8px;
        }
        .arslan-dropdown-item-label {
          padding: 1px 15px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }
    }

    .arslan-delete-node {
      .arslan-button {
        * {
          color: var(--arslan-error-color) !important;
        }
      }
    }
  }
}

.ProseMirror-noderangeselection {
  *::selection {
    background: transparent;
  }
  * {
    caret-color: transparent;
  }
}
</style>

