<template>
  <div
    v-if="props.tabs.length"
    :class="['relative', props.class]"
    style="filter: url('#exclusionTabsGoo')"
  >
    <button
      v-for="tab in props.tabs"
      :key="tab"
      :class="[
        'px-3 py-1 transition-all duration-700',
        activeTab === tab ? 'bg-highlight-light dark:bg-highlight-dark text-text-light dark:text-text-dark rounded-xl shadow-sm ' : 'bg-secondary-light dark:bg-secondary-dark text-text-light dark:text-text-dark rounded-xl',
      ]"
      :style="{
        margin: `0 ${activeTab === tab ? props.margin : 0}px`,
      }"
      @click="emit('update:activeTab', tab)"
    >
      {{ getTabDisplayName(tab) }}
    </button>

    <div class="absolute w-full">
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter
            id="exclusionTabsGoo"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            color-interpolation-filters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              :stdDeviation="blurStdDeviation"
              result="blur"
            ></feGaussianBlur>
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0  
                0 1 0 0 0  
                0 0 1 0 0  
                0 0 0 36 -12"
              result="goo"
            ></feColorMatrix>
            <feComposite
              in="SourceGraphic"
              in2="goo"
              operator="atop"
            ></feComposite>
          </filter>
        </defs>
      </svg>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  tabs: string[]
  activeTab: string
  margin?: number
}

const props = withDefaults(defineProps<Props>(), {
  margin: 20,
})
const emit = defineEmits<{
  (e: 'update:activeTab', tab: string): void
}>()

const getTabDisplayName = (tab: string) => {
  const tabNames: Record<string, string> = {
    base: 'Home',
    insert: 'Insert',
    table: 'Table',
    tools: 'Tools',
    page: 'Page',
    export: 'Export',
  }
  return tabNames[tab] || tab
}
</script>

<style></style>
