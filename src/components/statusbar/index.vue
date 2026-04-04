<template>
  <div v-if="!page.preview?.enabled" class="arslan-status-bar">
    <!-- Desktop: Full left section -->
    <div class="arslan-status-bar-left desktop-only">
      <tooltip :content="page.showToc ? t('toc.hide') : t('toc.show')">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          :class="{ active: page.showToc, '!bg-secondary-light dark:!bg-secondary-dark': page.showToc }" variant="text"
          size="small" @click="page.showToc = !page.showToc">
          <icon name="toc" />
        </t-button>
      </tooltip>
      <tooltip v-if="options.document?.enableSpellcheck" :content="$document?.enableSpellcheck
        ? t('spellcheck.disable')
        : t('spellcheck.enable')
        ">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          :class="{ active: $document.enableSpellcheck, '!bg-secondary-light dark:!bg-secondary-dark': $document.enableSpellcheck }"
          variant="text" size="small" @click="toggleSpellcheck">
          <icon name="spellcheck" color="red" />
        </t-button>
      </tooltip>
      <tooltip :content="t('shortcut.title')">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          :class="{ active: showShortcut, '!bg-secondary-light dark:!bg-secondary-dark': showShortcut }" variant="text"
          size="small" @click="showShortcut = true">
          <icon name="shortcut" />
        </t-button>
      </tooltip>
      <tooltip :content="t('resetAll.title')">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          :class="{ active: showShortcut, '!bg-secondary-light dark:!bg-secondary-dark': showShortcut }" variant="text"
          size="small" @click="reset(false)">
          <icon name="clear-cache" />
        </t-button>
      </tooltip>
      <div class="bar-split"></div>
      <tooltip :content="t('poweredBy')">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          :class="{ active: showShortcut, '!bg-secondary-light dark:!bg-secondary-dark': showShortcut }" variant="text"
          size="small" href="" target="_blank">
          <icon name="home-page" />
        </t-button>
      </tooltip>
      <tooltip :content="t('feedback')">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          :class="{ active: showShortcut, '!bg-secondary-light dark:!bg-secondary-dark': showShortcut }" variant="text"
          size="small" href="https://github.com/ArslanRude/OnlyWord/issues" target="_blank">
          <icon name="message" />
        </t-button>
      </tooltip>
      <div class="arslan-status-bar-split"></div>
      <t-popup v-if="editor" v-model="showWordCount" :attach="container" trigger="click" placement="top-left"
        @visible-change="(visible: boolean) => (showWordCount = visible)">
        <t-button
          class="arslan-status-bar-button auto-width word-count !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          variant="text" :class="{ active: showShortcut, '!bg-secondary-light dark:!bg-secondary-dark': showShortcut }"
          size="small">
          <span v-if="selectionCharacters > 0">
            {{ selectionCharacters }}/
          </span>
          <span class="arslan-word-count">
            {{ editor.storage.characterCount.characters() }}</span>
          {{ t('wordCount.characters') }}
          <icon name="arrow-down" :style="{ transform: `rotate(${showWordCount ? '180deg' : 0})` }" />
        </t-button>
        <template #content>
          <div class="arslan-word-count-detail">
            <div class="arslan-word-count-title">{{ t('wordCount.title') }}</div>
            <ul>
              <li>
                {{ t('wordCount.input') }}
                <span>
                  {{ editor.storage.characterCount.characters() }}
                </span>
              </li>
              <li>
                {{ t('wordCount.selection') }}
                <span>{{ selectionCharacters }}</span>
              </li>
              <li v-if="options.document?.characterLimit > 0">
                {{ t('wordCount.limit') }}
                <span>
                  {{ options.document?.characterLimit }}
                </span>
              </li>
            </ul>
          </div>
        </template>
      </t-popup>
    </div>

    <!-- Mobile: Compact left section with hamburger menu -->
    <div class="arslan-status-bar-left mobile-only">
      <!-- Hamburger Menu Button -->
      <tooltip :content="t('base.menu')">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark mobile-menu-btn"
          variant="text" size="small" @click="showMobileMenu = true">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </t-button>
      </tooltip>
      <div class="arslan-status-bar-split"></div>
      <!-- Compact Word Count -->
      <t-popup v-if="editor" v-model="showMobileWordCount" :attach="container" trigger="click" placement="top-left"
        @visible-change="(visible: boolean) => (showMobileWordCount = visible)">
        <t-button
          class="arslan-status-bar-button auto-width word-count mobile-word-count !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          variant="text" size="small">
          <span v-if="selectionCharacters > 0" class="mobile-selection">
            {{ selectionCharacters }}/
          </span>
          <span class="arslan-word-count">
            {{ editor.storage.characterCount.characters() }}</span>
          <icon name="arrow-down" :style="{ transform: `rotate(${showMobileWordCount ? '180deg' : 0})` }" />
        </t-button>
        <template #content>
          <div class="arslan-word-count-detail">
            <div class="arslan-word-count-title">{{ t('wordCount.title') }}</div>
            <ul>
              <li>
                {{ t('wordCount.input') }}
                <span>
                  {{ editor.storage.characterCount.characters() }}
                </span>
              </li>
              <li>
                {{ t('wordCount.selection') }}
                <span>{{ selectionCharacters }}</span>
              </li>
              <li v-if="options.document?.characterLimit > 0">
                {{ t('wordCount.limit') }}
                <span>
                  {{ options.document?.characterLimit }}
                </span>
              </li>
            </ul>
          </div>
        </template>
      </t-popup>
    </div>
    <div class="arslan-status-bar-right">
      <tooltip :content="page.preview?.enabled ? t('preview.disable') : t('preview.title')
        ">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          :class="{ active: page.preview?.enabled, '!bg-secondary-light dark:!bg-secondary-dark': page.preview?.enabled }"
          variant="text" size="small" @click="togglePreview">
          <icon name="preview" />
        </t-button>
      </tooltip>
      <tooltip
        :content="`${fullscreen?.isFullscreen ? t('fullscreen.disable') : t('fullscreen.title')} (${getShortcut('Ctrl+F11')})`">
        <t-button
          class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
          :class="{ active: fullscreen?.isFullscreen, '!bg-secondary-light dark:!bg-secondary-dark': fullscreen?.isFullscreen }"
          variant="text" size="small" @click="toggleFullscreen">
          <icon :name="fullscreen ? 'full-screen-exit' : 'full-screen'" />
        </t-button>
      </tooltip>
      <div class="arslan-status-bar-split"></div>
      <div class="arslan-zoom-level-bar">
        <tooltip :content="`${t('zoom.zoomOut')} (${getShortcut('Ctrl-')})`">
          <t-button
            class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
            :class="{ active: (page.zoomLevel ?? 21) <= 20, '!bg-secondary-light dark:!bg-secondary-dark': (page.zoomLevel ?? 21) <= 20 }"
            variant="text" size="small" :disabled="(page.zoomLevel ?? 21) <= 20" @click="zoomOut">
            <icon name="minus" />
          </t-button>
        </tooltip>
        <t-slider v-model="page.zoomLevel" class="arslan-zoom-level-slider" :min="20" :max="500" :step="10"
          :tooltip-props="{
            showArrow: false,
            theme: 'light',
            popperOptions: {
              modifiers: [{ name: 'offset', options: { offset: [0, 2] } }],
            },
          }" :label="t('zoom.level') + '${value}%%'" />
        <tooltip :content="`${t('zoom.zoomIn')} (${getShortcut('Ctrl+')})`">
          <t-button
            class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
            :class="{ active: !!page.zoomLevel && page.zoomLevel >= 500, '!bg-secondary-light dark:!bg-secondary-dark': !!page.zoomLevel && page.zoomLevel >= 500 }"
            variant="text" size="small" :disabled="!!(page.zoomLevel && page.zoomLevel >= 500)" @click="zoomIn">
            <icon name="plus" />
          </t-button>
        </tooltip>
        <tooltip :content="`${t('zoom.autoWidth')} (${getShortcut('Ctrl0')})`">
          <t-button
            class="arslan-status-bar-button !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
            :class="{ active: page.autoWidth, '!bg-secondary-light dark:!bg-secondary-dark': page.autoWidth }"
            variant="text" size="small" @click="autoWidth(true)">
            <icon name="auto-width" />
          </t-button>
        </tooltip>
        <tooltip :content="`${t('zoom.reset')} (${getShortcut('Ctrl1')})`">
          <t-button
            class="arslan-status-bar-button auto-width !text-text-light dark:!text-text-dark hover:!bg-secondary-light dark:hover:!bg-secondary-dark"
            :class="{ active: page.autoWidth, '!bg-secondary-light dark:!bg-secondary-dark': page.autoWidth }"
            variant="text" size="small" @click="zoomReset">
            {{ page.zoomLevel }}%
          </t-button>
        </tooltip>
      </div>
    </div>
  </div>
  <div v-else class="arslan-preview-bar">
    <div v-if="countdownValue !== ''" class="arslan-preview-countdown">
      {{ countdownValue }}
    </div>
    <statusbar-countdown :visible="countdownSetting"
      @visible-change="(visible: boolean) => (countdownSetting = visible)" @countdown-change="countdownChange"
      @exit-preivew="exitPreview" @close="countdownSetting = false">
      <tooltip :content="t('preview.countdown.title')">
        <div class="item" :class="{ active: countdownSetting }">
          <icon name="time" />
        </div>
      </tooltip>
    </statusbar-countdown>
    <tooltip :content="t('preview.laserPointer')">
      <div class="item" :class="{ active: page.preview?.laserPointer }" @click="
        page.preview &&
        (page.preview.laserPointer = !page.preview.laserPointer)
        ">
        <icon name="laser-pointer" />
      </div>
    </tooltip>
    <tooltip :content="`${t('zoom.zoomOut')} (${getShortcut('Ctrl-')})`">
      <div class="item" @click="zoomOut">
        <icon name="minus" />
      </div>
    </tooltip>
    <tooltip :content="`${t('zoom.autoWidth')} (${getShortcut('Ctrl0')})`">
      <div class="item !text-text-light dark:!text-text-dark"
        :class="{ active: page.autoWidth, '!bg-secondary-light dark:!bg-secondary-dark': page.autoWidth }"
        @click="autoWidth(true)">
        <icon name="auto-width" />
      </div>
    </tooltip>
    <tooltip :content="`${t('zoom.zoomIn')} (${getShortcut('Ctrl+')})`">
      <div class="item" @click="zoomIn">
        <icon name="plus" />
      </div>
    </tooltip>
    <tooltip :content="`${t('preview.disable')} (${getShortcut('Esc')})`">
      <div class="item" @click="togglePreview">
        <icon name="exit" />
      </div>
    </tooltip>
  </div>
  <t-drawer v-model:visible="showShortcut" :attach="container" size="320px" :footer="false" :close-btn="true"
    destroy-on-close show-in-attached-element>
    <template #header>
      <div class="arslan-shortcuts-drawer-header">
        <icon name="shortcut" />
        {{ t('shortcut.title') }}
      </div>
    </template>
    <statusbar-shortcuts />
  </t-drawer>

  <!-- Mobile Menu Drawer -->
  <t-drawer v-model:visible="showMobileMenu" placement="bottom" :footer="false" :close-btn="false" destroy-on-close
    size="auto" class="mobile-statusbar-drawer">
    <div class="mobile-menu-panel">
      <!-- Header -->
      <div class="mobile-menu-header">
        <span class="mobile-menu-title">Statusbar Menu</span>
        <button class="mobile-menu-close" @click="showMobileMenu = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Menu Items -->
      <div class="mobile-menu-content">
        <!-- TOC Toggle -->
        <button class="mobile-menu-item" :class="{ active: page.showToc }"
          @click="page.showToc = !page.showToc; showMobileMenu = false">
          <span class="mobile-menu-icon">
            <icon name="toc" />
          </span>
          <span class="mobile-menu-label">{{ page.showToc ? t('toc.hide') : t('toc.show') }}</span>
        </button>

        <!-- Spellcheck -->
        <button v-if="options.document?.enableSpellcheck" class="mobile-menu-item"
          :class="{ active: $document.enableSpellcheck }" @click="toggleSpellcheck(); showMobileMenu = false">
          <span class="mobile-menu-icon">
            <icon name="spellcheck" color="red" />
          </span>
          <span class="mobile-menu-label">{{ $document?.enableSpellcheck ? t('spellcheck.disable') :
            t('spellcheck.enable') }}</span>
        </button>

        <!-- Shortcuts -->
        <button class="mobile-menu-item" @click="showShortcut = true; showMobileMenu = false">
          <span class="mobile-menu-icon">
            <icon name="shortcut" />
          </span>
          <span class="mobile-menu-label">{{ t('shortcut.title') }}</span>
        </button>

        <!-- Reset -->
        <button class="mobile-menu-item" @click="reset(false); showMobileMenu = false">
          <span class="mobile-menu-icon">
            <icon name="clear-cache" />
          </span>
          <span class="mobile-menu-label">{{ t('resetAll.title') }}</span>
        </button>

        <div class="mobile-menu-divider"></div>

        <!-- Home -->
        <a class="mobile-menu-item" href="" target="_blank" @click="showMobileMenu = false">
          <span class="mobile-menu-icon">
            <icon name="home-page" />
          </span>
          <span class="mobile-menu-label">{{ t('poweredBy') }}</span>
        </a>

        <!-- Feedback -->
        <a class="mobile-menu-item" href="https://github.com/ArslanRude/OnlyWord/issues" target="_blank"
          @click="showMobileMenu = false">
          <span class="mobile-menu-icon">
            <icon name="message" />
          </span>
          <span class="mobile-menu-label">{{ t('feedback') }}</span>
        </a>
      </div>
    </div>
  </t-drawer>
</template>

<script setup lang="ts">
import type { UseFullscreenReturn } from '@vueuse/core'
import { getShortcut } from '@/utils/shortcut'

const { t } = useI18n()
const container = inject('container')
const editor = inject('editor')
const page = inject('page')
const options = inject('options')
const $document = useState('document', options)


// Shortcut drawer
const showShortcut = $ref(false)

// Mobile menu
const showMobileMenu = $ref(false)

const reset = inject('reset') as (silent: boolean) => void

// Word count
const showWordCount = $ref(false)
const showMobileWordCount = $ref(false)
const selectionCharacters = computed(() => {
  if (editor.value) {
    const { selection } = editor.value.state
    const text = editor.value.state.doc.textBetween(
      selection.from,
      selection.to,
      '',
    )
    return text.length
  }
  return 0
})

// Page fullscreen
const fullscreen = inject('fullscreen')
const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value
}

let documentFullscreen: UseFullscreenReturn = $ref(null)
onMounted(() => {
  documentFullscreen = useFullscreen(document.querySelector(container))
})

// Preview mode
const togglePreview = () => {
  page.value.showToc = false
  page.value.preview ??= {}
  page.value.preview.enabled = !page.value.preview.enabled

  const zoomableContainer = document.querySelector(
    `${container} .arslan-zoomable-container`,
  )
  if (zoomableContainer && page.value.preview.enabled) {
    zoomableContainer.scrollTop = 0
  }
}
const exitPreview = () => {
  if (page.value.preview.enabled) {
    page.value.preview ??= {}
    page.value.preview.enabled = false
  }
}

watch(
  () => page.value.preview?.enabled,
  (enabled: boolean) => {
    if (enabled) {
      page.value.preview.editable = editor.value.isEditable
      editor.value.setEditable(false)
    } else {
      editor.value.setEditable(page.value.preview.editable)
    }
  },
)

// Preview mode countdown
const countdownSetting = $ref(false)
let countdownValue = $ref('')
const countdownChange = (value: string) => {
  countdownValue = value
}

watch(
  () => page.value.preview?.enabled,
  (enabled: boolean) => {
    if (enabled) {
      void documentFullscreen.enter()
      autoWidth(false, 10)
    } else {
      void documentFullscreen.exit()
      zoomReset()
    }
  },
)
watch(
  () => documentFullscreen?.isFullscreen,
  (isFullscreen: boolean) => {
    if (!isFullscreen) {
      exitPreview()
    }
  },
)


// Page zoom
const zoomIn = () => {
  if (page.value?.zoomLevel && page.value.zoomLevel < 500) {
    page.value.zoomLevel += 10
    page.value.autoWidth = false
  }
}
const zoomOut = () => {
  if (page.value?.zoomLevel && page.value.zoomLevel > 20) {
    page.value.zoomLevel -= 10
    page.value.autoWidth = false
  }
}
const zoomReset = () => {
  page.value.zoomLevel = 100
  page.value.autoWidth = false
}

// Best width
const autoWidth = (auto = true, padding = 50) => {
  if (auto && page.value.autoWidth) {
    zoomReset()
    return
  }
  try {
    const editorEl = document.querySelector(
      `${container} .arslan-zoomable-container`,
    )
    const pageEl = editorEl?.querySelector('.arslan-page-content')
    const editorWidth = editorEl?.clientWidth ?? 0
    const pageWidth = pageEl?.clientWidth ?? 0
    page.value.zoomLevel = Math.floor(
      Number((editorWidth - padding * 2) / pageWidth) * 100,
    )

    page.value.autoWidth = true
  } catch (e) {
    page.value.autoWidth = false
    useMessage('error', {
      attach: container,
      content: t('zoom.autoWidthError'),
    })
    console.warn('Page auto width calculation error', e)
  }
}

watch(
  () => page.value.showToc,
  () => {
    if (page.value.autoWidth) {
      autoWidth()
    }
  },
)


// Hotkeys
watch(
  () => editor.value,
  () => {
    editor.value?.on('focus', () => {
      useHotkeys('ctrl+f11, command+f11', toggleFullscreen)
      useHotkeys('ctrl+0,command+0', autoWidth)
      useHotkeys('ctrl+-,command+-', zoomOut)
      useHotkeys('ctrl+=,command+=', zoomIn)
      useHotkeys('ctrl+1,command+1', zoomReset)
    })
  },
  { immediate: true },
)
</script>

<style lang="less" scoped>
.arslan-status-bar {
  padding: 6px 10px;
  display: flex;
  justify-content: space-between;
  font-size: var(--arslan-font-size-small);
  border-top: solid 1px var(--arslan-border-color);

  @media screen and (max-width: 640px) {
    overflow-x: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .arslan-status-bar-split {
    height: 16px;
    width: 1px;
    background-color: var(--arslan-border-color);
    margin: 0 10px;
  }

  .arslan-status-bar-button {
    --td-comp-size-xs: 18px;
    --td-comp-paddingLR-l: 8px;
    --td-radius-default: 2px;
    font-size: 14px;
    margin: 0 4px;
    border: none;

    // color: var(--arslan-text-color);
    &:not(.auto-width) {
      width: var(--td-comp-size-xs);
    }

    &.auto-width {
      font-size: var(--arslan-font-size-small);
      padding-left: 6px;
      padding-right: 6px;
    }

    &.word-count {
      padding-left: 2px;
      padding-right: 0;

      :deep(.arslan-button__text) {
        display: flex;
        align-items: center;

        .arslan-icon {
          margin-left: 3px;
          transform: rotate(180deg);
        }
      }
    }

    :deep(.arslan-button__text) {
      padding: 0 5px;
    }

    &.active {
      background-color: var(--arslan-button-hover-background);
      border-color: var(--arslan-button-hover-background);
      color: var(--arslan-primary-color);
    }
  }

  &-left {
    display: flex;
    align-items: center;
  }

  &-right {
    display: flex;
    align-items: center;

    .arslan-zoom-level-bar {
      width: 240px;
      display: flex;
      --td-comp-size-xxxs: 8px;
      --td-size-2: 3px;
      --td-brand-color: var(--arslan-text-color);

      .arslan-zoom-level-slider {
        :deep(.arslan-slider__button) {
          background: var(--td-brand-color);
          border: none;
          box-shadow: none;
        }

        :deep(.arslan-slider__track) {
          background: none;
        }
      }
    }

    .arslan-lang-button {
      :deep(.arslan-button__text) {
        display: flex;
        align-items: center;

        .arslan-icon {
          font-size: 16px;
          margin-right: 3px;
        }
      }
    }

    @media screen and (max-width: 720px) {
      .arslan-zoom-level-bar {
        width: auto;
      }

      .arslan-zoom-level-slider,
      .arslan-lang-button {
        display: none !important;
      }
    }
  }
}

// Desktop/Mobile visibility classes
.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

@media screen and (max-width: 640px) {
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: flex !important;
  }
}

.arslan-preview-bar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 30px;
  border-radius: var(--arslan-radius-medium);
  padding: 8px;
  overflow: hidden;
  user-select: none;
  display: flex;
  background: var(--arslan-color-white);
  box-shadow:
    var(--td-shadow-2), var(--td-shadow-inset-top),
    var(--td-shadow-inset-right), var(--td-shadow-inset-bottom),
    var(--td-shadow-inset-left);
  gap: 5px;

  .arslan-preview-countdown {
    display: flex;
    align-items: center;
    padding: 0 12px;
    background-color: var(--arslan-button-hover-background);
    border-radius: var(--arslan-radius-medium);
    font-size: 14px;
    color: var(--arslan-text-color-light);
  }

  .item {
    padding: 6px;
    border-radius: 8px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
    font-size: 12px;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--arslan-text-color-light);
    border-radius: var(--arslan-radius-medium);
    cursor: pointer;

    &:hover {
      background-color: var(--arslan-button-hover-background);
      color: var(--arslan-text-color);
    }

    &.active {
      background-color: var(--arslan-button-hover-background);
      color: var(--arslan-primary-color);
    }

    :deep(.arslan-icon) {
      font-size: 20px;
    }
  }
}
</style>

<style lang="less">
.arslan-shortcuts-drawer-header {
  display: flex;
  align-items: center;
  font-weight: 400;
  color: var(--arslan-text-color);

  .arslan-icon {
    font-size: 20px;
    margin-right: 6px;
  }
}

.arslan-drawer__close-btn {
  margin-right: 3px;
}

.arslan-word-count {
  margin-right: 0.25em;

  &-detail {
    padding: 10px 0 8px;
    width: 160px;
    font-size: 12px;
    color: var(--arslan-text-color-light);

    ul {
      padding: 0;
      margin: 0;
    }

    li {
      list-style: none;
      cursor: default;
      padding: 0 12px;
      display: flex;
      justify-content: space-between;
      line-height: 28px;
      color: var(--arslan-text-color);

      &:hover {
        background-color: var(--td-bg-color-container-hover);
      }
    }
  }

  &-title {
    padding: 0 12px;
    margin-bottom: 3px;
  }
}

// Mobile Menu Panel Styles
.mobile-menu-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--arslan-color-white, #fff);
}

[theme-mode="dark"] .mobile-menu-panel {
  background: #111827;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--arslan-border-color, #e5e7eb);
}

[theme-mode="dark"] .mobile-menu-header {
  border-bottom-color: #374151;
}

.mobile-menu-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--arslan-text-color, #111827);
}

[theme-mode="dark"] .mobile-menu-title {
  color: #f3f4f6;
}

.mobile-menu-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--arslan-text-color-light, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-menu-close:hover {
  background: #f3f4f6;
  color: #111827;
}

[theme-mode="dark"] .mobile-menu-close {
  color: #9ca3af;
}

[theme-mode="dark"] .mobile-menu-close:hover {
  background: #374151;
  color: #f3f4f6;
}

.mobile-menu-content {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
  text-decoration: none;
}

.mobile-menu-item:hover {
  background: #f3f4f6;
}

\n [theme-mode="dark"] .mobile-menu-item:hover {
  background: #374151;
}

.mobile-menu-item.active {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

[theme-mode="dark"] .mobile-menu-item.active {
  background: rgba(99, 102, 241, 0.2);
}

.mobile-menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--arslan-text-color-light, #6b7280);
  flex-shrink: 0;
}

[theme-mode="dark"] .mobile-menu-icon {
  color: #9ca3af;
}

.mobile-menu-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--arslan-text-color, #374151);
}

[theme-mode="dark"] .mobile-menu-label {
  color: #d1d5db;
}

.mobile-menu-divider {
  height: 1px;
  margin: 8px 16px;
  background: var(--arslan-border-color, #e5e7eb);
}

[theme-mode="dark"] .mobile-menu-divider {
  background: #374151;
}

// Mobile word count compact styles
.mobile-word-count {
  .arslan-word-count {
    font-size: 11px;
  }

  .mobile-selection {
    font-size: 10px;
    opacity: 0.8;
  }
}

// Mobile drawer styling
.mobile-statusbar-drawer {
  :deep(.arslan-drawer__body) {
    padding: 0;
  }

  :deep(.arslan-drawer__content) {
    border-radius: 12px 12px 0 0;
  }
}

@media screen and (max-width: 640px) {
  .mobile-statusbar-drawer {
    :deep(.arslan-drawer__content) {
      max-height: 70vh;
    }
  }

  // Compact mobile word count
  .mobile-word-count {
    padding-left: 4px !important;
    padding-right: 2px !important;

    :deep(.arslan-button__text) {
      font-size: 11px;
    }
  }
}
</style>
