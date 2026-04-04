<template>
  <div class="arslan-color-picker-container">
    <div class="arslan-color-picker-default-button">
      <t-button theme="default" variant="outline" size="small" block @click="selectColor(props.defaultColor)"
        v-text="t('colorPicker.default')" />
    </div>

    <div class="arslan-color-picker-group">
      <div v-for="(item, index) in options.dicts?.colors" :key="index" class="arslan-color-picker-item"
        :style="{ backgroundColor: item }" @click="selectColor(item)" />
    </div>

    <div class="arslan-color-picker-group-title" v-text="t('colorPicker.standard')" />
    <div class="arslan-color-picker-group">
      <div v-for="(item, index) in standardColors" :key="index" class="arslan-color-picker-item"
        :style="{ backgroundColor: item }" @click="selectColor(item)" />
    </div>

    <template v-if="$recent.colors.length > 0">
      <div class="arslan-color-picker-group-title" v-text="t('colorPicker.recent')" />
      <div class="arslan-color-picker-group">
        <div v-for="(item, index) in $recent.colors" :key="index" class="arslan-color-picker-item"
          :style="{ backgroundColor: item }" @click="selectColor(item)" />
      </div>
    </template>

    <div class="arslan-color-picker-divider" />

    <t-popup :attach="container" :visible="moreColorPicker" trigger="click" placement="right-bottom"
      @visible-change="handlePopupVisibleChange">
      <div class="arslan-color-picker-more" :class="{ active: moreColorPicker }">
        <div class="arslan-color-picker-more-menu">
          <icon name="palette-color" />
          <span v-text="t('colorPicker.more')" />
        </div>
        <div class="arslan-color-picker-more-arrow">
          <icon name="arrow-down" />
        </div>
      </div>

      <template #content>
        <div @mousedown.stop @touchstart.stop>
          <t-color-picker-panel v-model="tempColor" size="small" :color-modes="['monochrome']" :swatch-colors="[]"
            enable-alpha @change="colorChange" />
        </div>
      </template>
    </t-popup>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  defaultColor: {
    type: String,
    default: '#000',
  },
})
const emits = defineEmits(['change'])

const container = inject('container')
const editor = inject('editor')
const options = inject('options')
const $recent = useState('recent', options)

// prettier-ignore
const standardColors = ['#B12318', '#EB3323', '#F6C143', '#FFFE55', '#A0CD63', '#4FAD5B', '#4CAFEA', '#2D70BA', '#06215C', '#68389B']

// $ref → no .value needed
let color = $ref(props.defaultColor)
let moreColorPicker = $ref(false)

// ref() → must use .value
const tempColor = ref(props.defaultColor)

const handlePopupVisibleChange = (visible: boolean) => {
  if (visible) {
    tempColor.value = color        // ✅ color is $ref (no .value), tempColor is ref() (.value)
    editor.value?.commands.focus(undefined, { scrollIntoView: false })
  }
  moreColorPicker = visible        // ✅ $ref, no .value
}

const commitToRecent = (c: string) => {
  const idx = $recent.value.colors.indexOf(c)
  if (idx !== -1) $recent.value.colors.splice(idx, 1)
  $recent.value.colors.unshift(c)
  if ($recent.value.colors.length > 10) $recent.value.colors.length = 10
}

const colorChange = (c: string, ctx?: { trigger: string }) => {
  if (ctx && ctx.trigger !== 'palette-saturation-brightness') return
  color = c                        // ✅ $ref, no .value
  tempColor.value = c              // ✅ ref(), needs .value
  commitToRecent(c)
  emits('change', c)
}

const selectColor = (c: string) => {
  color = c                        // ✅ $ref, no .value
  tempColor.value = c              // ✅ ref(), needs .value
  commitToRecent(c)
  emits('change', c)
}
</script>

<style lang="less" scoped>
.arslan-color-picker {
  &-container {
    width: 236px;
  }

  &-default-button {
    .arslan-button {
      height: 28px;
    }
  }

  &-group {
    display: flex;
    flex-wrap: wrap;
    margin: 8px 0;
    gap: 4px;

    &-title {
      color: var(--arslan-text-color-light);
      font-size: 12px;
      margin: 5px 0 2px;
    }
  }

  &-item {
    width: 20px;
    height: 20px;
    border: solid 1px rgba(0, 0, 0, 0.1);
    margin-bottom: 2px;
    flex-basis: 20px;
    box-sizing: border-box;
    transition: all 0.2s;
    cursor: pointer;
    border-radius: 3px;

    &:hover {
      transform: scale(1.1);
      border-color: rgba(0, 0, 0, 0.3);
    }
  }

  &-divider {
    height: 1px;
    background-color: var(--arslan-border-color-light);
    margin: 10px 0;
  }

  &-more {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    cursor: pointer;

    &:hover,
    &.active {
      background-color: var(--td-bg-color-container-hover);
      border-radius: var(--arslan-radius);
    }

    &-menu {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--arslan-text-color-light);
      cursor: pointer;

      .arslan-icon {
        margin-right: 5px;
        font-size: 18px;
      }
    }

    &-arrow {
      .arslan-icon {
        transform: rotate(-90deg);
      }
    }
  }
}
</style>