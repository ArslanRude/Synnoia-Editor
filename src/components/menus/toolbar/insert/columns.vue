<template>
  <menus-button
    ico="columns"
    :text="t('insert.columns')"
    menu-type="popup"
    huge
    :popup-visible="popupVisible"
    @toggle-popup="togglePopup"
  >
    <template #content>
      <div class="arslan-columns-container">
        <div
          v-for="column in columns"
          :key="column"
          class="arslan-columns-item"
          :class="{ 'arslan-columns-item-selected': activeColumn >= column }"
          @mouseenter="setActiveColumn(column)"
          @click="setColumns(column)"
        >
          {{ column }}
        </div>
      </div>
    </template>
  </menus-button>
</template>

<script setup lang="ts">
const { popupVisible, togglePopup } = usePopup()
const editor = inject('editor')

let activeColumn = $ref(0)

const columns = [1, 2, 3, 4, 5, 6]
const setActiveColumn = (column: number) => {
  activeColumn = column
}
const setColumns = (column: number) => {
  editor.value?.chain().focus().setColumns(column, true).run()
  popupVisible.value = false
}

watch(
  () => popupVisible.value,
  (visible: boolean) => {
    if (!visible) {
      activeColumn = 0
    }
  },
)
</script>

<style lang="less" scoped>
.arslan-columns {
  &-container {
    width: 180px;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 6px;
  }

  &-item {
    background-color: var(--arslan-content-table-selected-background);
    border-radius: var(--arslan-radius);
    cursor: pointer;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    color: var(--arslan-text-color-light);
    &-selected {
      background-color: var(--arslan-primary-color);
      color: var(--arslan-color-white);
      opacity: 0.9;
    }
  }
}
</style>

