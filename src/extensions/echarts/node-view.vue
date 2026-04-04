<template>
  <node-view-wrapper
    :id="'chartNode-' + node.attrs.id"
    ref="containerRef"
    class="arslan-node-view"
    :style="nodeStyle"
  >
    <div
      class="arslan-node-container arslan-node-echarts"
      :class="{
        'is-draggable': node.attrs.draggable,
        'arslan-hover-shadow': !options.document?.readOnly,
        'arslan-select-outline': !node.attrs.draggable,
      }"
    >
      <drager
        :selected="selected"
        :rotatable="false"
        :boundary="false"
        :draggable="
          Boolean(node.attrs.draggable) && !options.document?.readOnly
        "
        :disabled="options.document?.readOnly"
        :angle="0"
        :width="Number(node.attrs.width)"
        :height="Number(node.attrs.height)"
        :min-width="400"
        :min-height="200"
        :max-width="maxWidth"
        :z-index="10"
        @resize="onResize"
        @focus="selected = true"
      >
        <div :id="'chart-' + node.attrs.id" class="arslan-node-echarts-body"></div>
      </drager>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
// tiptap component
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
// drag component
import Drager from 'es-drager'

import {
  calbaseConfigData,
  calbaseConfigOptions,
} from '@/extensions/echarts/cal-service'
// Import echart service to initialize loading cdn echart.js script otherwise
import { useEchartsLoader } from '@/extensions/echarts/init-service'

const { node, updateAttributes } = defineProps(nodeViewProps)
const options = inject('options')
const { loadEchartScript } = useEchartsLoader(options.value)
const containerRef = ref(null)
const maxWidth = $ref(0)
let selected = $ref(false)
let myChart: any = null

// Load data
onMounted(async () => {
  await loadData()
})

// Initialize style, need to add name in margin and nodeAlign
const nodeStyle = $computed(() => {
  const { nodeAlign, margin } = node.attrs
  const marginTop =
    margin?.top && margin?.top !== '' ? `${margin.top}px` : undefined
  const marginBottom =
    margin?.bottom && margin?.bottom !== '' ? `${margin.bottom}px` : undefined
  return {
    'justify-content': nodeAlign,
    marginTop,
    marginBottom,
  }
})
const onResize = ({ width, height }: { width: number; height: number }) => {
  updateAttributes({
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
  })
  if (myChart !== null) {
    myChart.resize()
  }
}

// onBeforeUnmount(() => {
// })

onClickOutside(containerRef, () => {
  selected = false
})
// Load data
const loadData = async () => {
  await nextTick()
  // Ensure loadData is called after echarts is loaded
  await loadEchartScript()
  // Next, initialize the chart and set the configuration
  if (typeof echarts !== 'undefined') {
    const { chartOptions, chartConfig, id, mode } = node.attrs
    // Based on the parameters, achieve different effects
    if (myChart !== null) {
      myChart.dispose()
      myChart = null
    }
    if (mode === 1) {
      if (chartConfig !== null) {
        const newData = calbaseConfigData(chartConfig.data)
        const resOptions = calbaseConfigOptions(
          newData,
          chartConfig.config,
          options.value,
        )
        if (resOptions !== null) {
          myChart = echarts.init(document.getElementById(`chart-${id}`))
          myChart.setOption(resOptions)
        }
      }
    } else if (chartOptions !== null) {
      myChart = echarts.init(document.getElementById(`chart-${id}`))
      myChart.setOption(chartOptions)
    }
  }
}

// Watch node.attrs changes and reload data when changes occur
watch(
  () => node.attrs,
  async (newAttrs: any, oldAttrs: any) => {
    // Avoid repeated calls to loadData during initial mounting
    if (
      newAttrs !== undefined &&
      oldAttrs !== undefined &&
      newAttrs !== oldAttrs
    ) {
      // Avoid repeated calls to loadData during initial mounting
      let isLoad = false
      for (const attr1 in oldAttrs) {
        if (attr1 === 'height' || attr1 === 'width' || attr1 === 'src') {
          continue
        }
        if (oldAttrs[attr1] !== newAttrs[attr1]) {
          isLoad = true
          break
        }
      }
      if (isLoad) {
        await loadData() // Second and subsequent calls to loadData when attributes change
      }
    }
  },
  { deep: true, immediate: false },
)
</script>

<style lang="less">
.arslan-node-view {
  .arslan-node-echarts {
    max-width: 100%;
    position: relative;
    &:not(.is-draggable) .es-drager {
      max-width: 100%;
      max-height: 100%;
      transform: translateX(0px) translateY(0px) rotate(0deg) !important;
    }
    .arslan-node-echarts-body {
      display: block;
      min-width: 400px;
      min-height: 200px;
      width: 100%;
      height: 100%;
      border: none;
      /* pointer-events: none; */
      background-color: var(--arslan-color-white);
    }
  }
}
</style>

