<template>
  <div class="arslan-page-container">
    <container-toc v-if="pageOptions.showToc" @close="pageOptions.showToc = false" />
    <div class="arslan-zoomable-container arslan-scrollbar">
      <div class="arslan-zoomable-content bg-highlight-light text-text-light dark:bg-highlight-dark dark:text-text-dark"
        :style="{
          width: pageZoomWidth,
          height: pageZoomHeight,
        }">
        <t-watermark class="arslan-page-content" :alpha="pageOptions.watermark.alpha" v-bind="watermarkOptions"
          :watermark-content="pageOptions.watermark" :style="{
            '--arslan-page-background': pageOptions.background,
            '--arslan-page-margin-top': (pageOptions.margin?.top ?? '0') + 'cm',
            '--arslan-page-margin-bottom':
              (pageOptions.margin?.bottom ?? '0') + 'cm',
            '--arslan-page-margin-left': (pageOptions.margin?.left ?? '0') + 'cm',
            '--arslan-page-margin-right':
              (pageOptions.margin?.right ?? '0') + 'cm',
            '--arslan-page-width': pageSize.width + 'cm',
            '--arslan-page-height': pageSize.height + 'cm',
            width: pageSize.width + 'cm',
            transform: `scale(${pageOptions.zoomLevel ? pageOptions.zoomLevel / 100 : 1})`,
          }">
          <div class="arslan-page-node-header" contenteditable="false">
            <div class="arslan-page-corner corner-tl" style="width: var(--arslan-page-margin-left)"></div>

            <div class="arslan-page-node-header-content"></div>
            <div class="arslan-page-corner corner-tr" style="width: var(--arslan-page-margin-right)"></div>
          </div>
          <div class="arslan-page-node-content">
            <editor>
              <template #bubble_menu="props">
                <slot name="bubble_menu" v-bind="props" />
              </template>
            </editor>
          </div>
          <div class="arslan-page-node-footer" contenteditable="false">
            <div class="arslan-page-corner corner-bl" style="width: var(--arslan-page-margin-left)"></div>
            <div class="arslan-page-node-footer-content"></div>
            <div class="arslan-page-corner corner-br" style="width: var(--arslan-page-margin-right)"></div>
          </div>
        </t-watermark>
      </div>
    </div>
    <t-image-viewer v-model:visible="imageViewer.visible" v-model:index="currentImageIndex" :images="previewImages"
      @close="imageViewer.visible = false" />
    <t-back-top :container="`${container} .arslan-zoomable-container`" :visible-height="300" size="small"
      :offset="['25px', '30px']">
      <div
        class="w-full h-full flex items-center justify-center bg-highlight-light text-text-light dark:bg-highlight-dark dark:text-text-dark shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-115">
        <t-icon name="arrow-up" class="text-current text-2xl" />
      </div>
    </t-back-top>
    <container-search-replace />
    <container-print />
  </div>
</template>

<script setup lang="ts">
import type { WatermarkOption } from '@/types'

const container = inject('container')
const imageViewer = inject('imageViewer')
const pageOptions = inject('page')

// Page size
const pageSize = $computed(() => {
  const { width, height } = pageOptions.value.size ?? { width: 0, height: 0 }
  return {
    width: pageOptions.value.orientation === 'portrait' ? width : height,
    height: pageOptions.value.orientation === 'portrait' ? height : width,
  }
})
// Page size after zoom
const pageZoomWidth = $computed(() => {
  return `calc(${pageSize.width}cm * ${pageOptions.value.zoomLevel ? pageOptions.value.zoomLevel / 100 : 1})`
})

// Update page height when content changes
let pageZoomHeight = $ref('')
const setPageZoomHeight = () => {
  const el = document.querySelector(`${container} .arslan-page-content`)
  if (!el) {
    console.warn('The element <.arslan-page-content> does not exist.')
    return
  }
  pageZoomHeight = `${(el.clientHeight * (pageOptions.value.zoomLevel ?? 1)) / 100}px`
}
watch(
  () => [
    pageOptions.value.zoomLevel,
    pageOptions.value.size,
    pageOptions.value.orientation,
  ],
  async () => {
    await nextTick()
    setTimeout(() => {
      setPageZoomHeight()
    }, 100)
  },
  { immediate: true, deep: true },
)

// FIXME:
const editorInstance = inject('editor')
watch(
  () => editorInstance.value?.getHTML(),
  () => {
    setPageZoomHeight()
  },
)

// Watermark
const watermarkOptions = $ref<{
  x: number
  y?: number
  width?: number
  height: number
  type?: string
}>({
  x: 0,
  height: 0,
})
watch(
  () => pageOptions.value.watermark,
  ({ type }: Partial<WatermarkOption> = { type: '' }) => {
    if (type === 'compact') {
      watermarkOptions.width = 320
      watermarkOptions.y = 240
    } else {
      watermarkOptions.width = 480
      watermarkOptions.y = 360
    }
  },
  { deep: true, immediate: true },
)

// Image preview
let previewImages = $ref<string[]>([])
let currentImageIndex = $ref<number>(0)

watch(
  () => imageViewer.value.visible,
  async (visible: boolean) => {
    if (!visible) {
      previewImages = []
      currentImageIndex = 0
      return
    }
    await nextTick()
    const images = document.querySelectorAll(
      `${container} .arslan-page-node-content img[src]:not(.arslan-icon)`,
    )
    Array.from(images).forEach((image, index) => {
      const src = image.getAttribute('src')
      const nodeId = image.getAttribute('data-id')
      previewImages.push(src)
      if (nodeId === imageViewer.value.current) {
        currentImageIndex = index
      }
    })
  },
)
</script>

<style lang="less" scoped>
.arslan-page-container {
  height: 100%;
  display: flex;
  position: relative;
}

.arslan-zoomable-container {
  flex: 1;
  padding: 20px 50px;
  scroll-behavior: smooth;

  .arslan-zoomable-content {
    margin: 0 auto;
    box-shadow:
      rgba(0, 0, 0, 0.06) 0px 0px 10px 0px,
      rgba(0, 0, 0, 0.04) 0px 0px 0px 1px;

    .arslan-page-content {
      transform-origin: 0 0;
      box-sizing: border-box;
      display: flex;
      position: relative;
      box-sizing: border-box;
      // background-color: var(--arslan-page-background);
      width: var(--arslan-page-width);
      min-height: var(--arslan-page-height);
      overflow: visible !important;
      display: flex;
      flex-direction: column;

      [contenteditable] {
        outline: none;
      }
    }
  }
}

.arslan-page-node-header {
  height: var(--arslan-page-margin-top);
  overflow: hidden;
}

.arslan-page-node-footer {
  height: var(--arslan-page-margin-bottom);
  overflow: hidden;
}

.arslan-page-node-header,
.arslan-page-node-footer {
  display: flex;
  justify-content: space-between;
}

.arslan-page-corner {
  box-sizing: border-box;
  position: relative;
  z-index: 10;

  @media print {
    opacity: 0;
  }

  &::after {
    position: absolute;
    content: '';
    display: block;
    height: 1cm;
    width: 1cm;
    border: solid 1px rgba(0, 0, 0, 0.08);
  }

  &.corner-tl::after {
    border-top: none;
    border-left: none;
    bottom: 0;
    right: 0;
  }

  &.corner-tr::after {
    border-top: none;
    border-right: none;
    bottom: 0;
    left: 0;
  }

  &.corner-bl::after {
    border-bottom: none;
    border-left: none;
    top: 0;
    right: 0;
  }

  &.corner-br::after {
    border-bottom: none;
    border-right: none;
    top: 0;
    left: 0;
  }
}

.arslan-page-node-header-content,
.arslan-page-node-footer-content {
  flex: 1;
}

.arslan-page-node-content {
  position: relative;
  box-sizing: border-box;
  flex-shrink: 1;
}

:deep(.arslan-back-top) {
  position: absolute;
  border: none;
  border-radius: 20%;
  background: transparent;
}
</style>

