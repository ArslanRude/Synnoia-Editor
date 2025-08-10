<template>
  <svg class="arslan-icon" aria-hidden="true" :width="size" :height="size">
    <use :xlink:href="`#arslan-icon-${props.name}`" :fill="color" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: '1em',
  },
  color: {
    type: String,
    default: 'currentcolor',
  },
})
</script>

<style lang="less">
.arslan-icon {
  display: flex;
}
</style>

