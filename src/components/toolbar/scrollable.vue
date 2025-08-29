<template>
  <div
    ref="wraperRef"
    class="arslan-scrollable-container"
    :style="{
      paddingLeft: hidePrev ? '10px' : '32px',
      paddingRight: hideNext ? '10px' : '32px',
    }"
  >
    <div
      v-if="!hidePrev"
      class="arslan-scrollable-control scrollable-left"
      @click="scrollLeft"
    >
      <icon name="arrow-down" />
    </div>
    <div ref="contentRef" class="arslan-scrollable-content">
      <slot />
    </div>
    <div
      v-if="!hideNext"
      class="arslan-scrollable-control scrollable-right"
      @click="scrollRight"
    >
      <icon name="arrow-down" />
    </div>
  </div>
</template>

<script setup lang="ts">
const wraperRef = ref<HTMLDivElement | null>(null)
const contentRef = $ref<HTMLDivElement | null>(null)
let hidePrev = $ref(true)
let hideNext = $ref(true)

const checkScrollPosition = () => {
  const { scrollLeft = 0, scrollWidth = 0, clientWidth = 0 } = contentRef ?? {}
  hidePrev = scrollLeft === 0
  hideNext = scrollLeft + clientWidth + 100 >= scrollWidth
}

const scrollLeft = () => {
  if (contentRef?.scrollLeft || contentRef.scrollLeft === 0) {
    contentRef.scrollLeft -= contentRef.offsetWidth - 10 || 100
  }
}

const scrollRight = () => {
  if (contentRef?.scrollLeft || contentRef.scrollLeft === 0) {
    contentRef.scrollLeft += contentRef.offsetWidth - 10 || 100
  }
}

// Listen for parent element size changes
useResizeObserver(wraperRef, () => {
  checkScrollPosition()
})

// Add scroll event listener
onMounted(() => {
  contentRef?.addEventListener('scroll', checkScrollPosition)
})

// Update scroll position
const update = () => {
  if (contentRef) {
    contentRef.scrollLeft = 0
  }
  hideNext = true
  checkScrollPosition()
}

defineExpose({
  update,
})
</script>

<style lang="less" scoped>
.arslan-scrollable-container {
  width: 100%;
  overflow: hidden;
  position: relative;
  .arslan-scrollable-control {
    display: flex;
    align-items: center;
    justify-content: center;
    border: solid 1px var(--arslan-border-color);
    border-radius: var(--arslan-radius);
    cursor: pointer;
    color: var(--arslan-text-color-light);
    overflow: visible;
    background-color: var(--arslan-button-hover-background);
    z-index: 10;
    font-size: 20px;
    box-sizing: border-box;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: calc(100% - 20px);
    &:hover {
      border-color: var(--arslan-primary-color);
      background-color: var(--arslan-primary-color);
      color: var(--arslan-color-white);
    }
    &.scrollable-left {
      left: 10px;
      :deep(.arslan-icon) {
        transform: rotate(90deg);
      }
      &::before {
        display: block;
        content: '';
        background: linear-gradient(
          to left,
          transparent,
          var(--arslan-color-white)
        );
        position: absolute;
        left: 21px;
        top: 0;
        bottom: 0;
        width: 20px;
        pointer-events: none;
      }
    }
    &.scrollable-right {
      right: 10px;
      :deep(.arslan-icon) {
        transform: rotate(-90deg);
      }
      &::before {
        display: block;
        content: '';
        background: linear-gradient(
          to right,
          transparent,
          var(--arslan-color-white)
        );
        position: absolute;
        right: 21px;
        top: 0;
        bottom: 0;
        width: 20px;
        pointer-events: none;
      }
    }
  }
  .arslan-scrollable-content {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    flex: 1;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>

