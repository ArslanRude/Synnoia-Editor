<template>
  <div v-if="items.length > 0" class="arslan-popup arslan-mention-popup">
    <div class="arslan-popup__content arslan-dropdown">
      <div class="arslan-dropdown__menu" style="padding: 5px; max-height: 320px">
        <div>
          <li v-for="(item, index) in items" :key="index"
            class="arslan-dropdown__item arslan-dropdown__item--theme-default arslan-dropdown__item"
            :class="{ 'arslan-dropdown__item--active': index === selectedIndex }" @click="selectItem(index)">
            {{ item.label }}
          </li>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  command: {
    type: Function,
    required: true,
  },
})

let selectedIndex = $ref(0)

watch(
  () => props.items,
  () => {
    selectedIndex = 0
  },
)

const onKeyDown = ({ event }: any) => {
  if (event.key === 'ArrowUp') {
    upHandler()
    return true
  }

  if (event.key === 'ArrowDown') {
    downHandler()
    return true
  }

  if (event.key === 'Enter') {
    if (props.items.length === 0) {
      return false
    }
    enterHandler()
    return true
  }

  return false
}

const upHandler = () => {
  selectedIndex = (selectedIndex + props.items.length - 1) % props.items.length
}

const downHandler = () => {
  selectedIndex = (selectedIndex + 1) % props.items.length
}

const enterHandler = () => {
  selectItem(selectedIndex)
}

const selectItem = (index: number) => {
  const item = props.items[index]

  if (item) {
    props.command(item)
  }
}

defineExpose({
  onKeyDown,
})
</script>

<style lang="less">
.arslan-node-mention {
  box-decoration-break: clone;
  color: var(--arslan-primary-color);
  padding: 0.1em 0.2em;
  margin: 0 0.1em;
  border-radius: 0.2em;
  white-space: nowrap;
  cursor: default;
}

.arslan-mention-popup {
  .arslan-dropdown {
    &__item--active {
      font-weight: 600;
    }
  }

  &-empty {
    padding: 3px 5px;
    min-width: 100px;
    color: var(--arslan-text-color-light);
  }
}
</style>

