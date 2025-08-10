<template>
  <menus-button :text="t('insert.link.open')" @menu-click="menuClick">
    <a class="arslan-link" :href="editor.storage.link.meta.href" target="_blank"
      ><icon name="link" /> {{ t('insert.link.open') }}</a
    >
  </menus-button>
</template>

<script setup lang="ts">
const editor = inject('editor')
const emits = defineEmits(['hide-bubble'])

const menuClick = () => {
  setTimeout(() => {
    emits('hide-bubble')
  }, 100)
}
</script>

<style lang="less" scoped>
.arslan-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--arslan-text-color);
}
</style>

