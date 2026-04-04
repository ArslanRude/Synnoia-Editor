<template>
  <menus-button
    :ico="content ? 'edit' : 'qrcode'"
    :text="content ? t('tools.qrcode.edit') : t('tools.qrcode.text')"
    huge
    @menu-click="menuClick"
  >
    <modal
      :visible="dialogVisible"
      icon="qrcode"
      :header="content ? t('tools.qrcode.edit') : t('tools.qrcode.text')"
      width="695px"
      @confirm="setQrcode"
      @close="dialogVisible = false"
    >
      <div class="arslan-qrcode-container">
        <div class="arslan-qrcode-toolbar">
          <menus-button
            style="width: 126px"
            :text="t('tools.qrcode.level')"
            :select-options="levels"
            menu-type="select"
            :select-value="config.ecl"
            @menu-click="
              (value: string) => {
                config.ecl = value
              }
            "
          ></menus-button>
          <menus-button
            menu-type="input"
            :tooltip="t('tools.qrcode.paddingTip')"
          >
            <t-input-number
              v-model="config.padding"
              size="small"
              theme="normal"
              :max="10"
              :min="0"
              :allow-input-over-limit="false"
              placeholder=""
            >
              <template #label
                ><span v-text="t('tools.qrcode.padding')"></span
              ></template>
            </t-input-number>
          </menus-button>
          <menus-button menu-type="input" :tooltip="t('tools.qrcode.widthTip')">
            <t-input-number
              v-model="config.width"
              size="small"
              theme="normal"
              :max="1024"
              :min="64"
              :allow-input-over-limit="false"
              placeholder=""
            >
              <template #label
                ><span v-text="t('tools.qrcode.width')"></span
              ></template>
            </t-input-number>
          </menus-button>
          <t-divider layout="vertical" />
          <menus-toolbar-base-color
            :text="t('tools.qrcode.color')"
            :default-color="config.color"
            modeless
            @change="(value: any) => (config.color = value)"
          />
          <menus-toolbar-base-background-color
            :text="t('tools.qrcode.bgColor')"
            :default-color="config.background"
            modeless
            @change="(value: any) => (config.background = value)"
          />
        </div>
        <div class="arslan-qrcode-code">
          <t-textarea
            v-model="config.content"
            maxlength="200"
            show-limit-number
            autofocus
            autosize
            :placeholder="t('tools.qrcode.placeholder')"
          >
          </t-textarea>
          <div
            v-if="renderError && config.content !== ''"
            class="arslan-barcode-error"
            v-text="t('tools.qrcode.renderError')"
          ></div>
        </div>
        <div class="arslan-qrcode-render">
          <div
            class="arslan-qrcode-title"
            v-text="t('tools.qrcode.preview')"
          ></div>
          <div class="arslan-qrcode-svg narrow-scrollbar">
            <div
              v-if="!svgCode"
              class="arslan-qrcode-empty"
              v-text="t('tools.qrcode.notEmpty')"
            ></div>
            <div v-else class="arslan-svg-render" v-html="svgCode"></div>
          </div>
        </div>
      </div>
    </modal>
  </menus-button>
</template>

<script setup lang="ts">
import QRCode from 'qrcode-svg'
import svg64 from 'svg64'

import { shortId } from '@/utils/short-id'

const { content } = defineProps({
  content: {
    type: String,
    default: '',
  },
})

let dialogVisible = $ref(false)
const editor = inject('editor')
const container = inject('container')
const uploadFileMap = inject('uploadFileMap')

const menuClick = () => {
  renderQrcode()
  dialogVisible = true
}

const levels = [
  { label: t('tools.qrcode.levelL'), value: 'L' },
  { label: t('tools.qrcode.levelM'), value: 'M' },
  { label: t('tools.qrcode.levelQ'), value: 'Q' },
  { label: t('tools.qrcode.levelH'), value: 'H' },
]
const defaultConfig = {
  ecl: 'M',
  padding: 1,
  width: 256,
  height: 256,
  color: '#000000',
  background: '#ffffff',
  content: '',
  xmlDeclaration: false,
  join: true,
  pretty: false,
  container: 'svg-viewbox',
}

let config = $ref({ ...defaultConfig })
let changed = $ref(false)

let svgCode = $ref<string | null>(null)
let renderError = $ref(false)
const renderQrcode = () => {
  try {
    svgCode = null
    config.height = config.width
    const qrcode = new QRCode(config)
    svgCode = qrcode.svg()
    renderError = false
  } catch {
    svgCode = null
    renderError = true
  }
}
watch(
  () => dialogVisible,
  (val: boolean) => {
    if (val) {
      config = content ? JSON.parse(content) : { ...defaultConfig }
      setTimeout(() => {
        changed = false
      }, 200)
    }
  },
  { immediate: true },
)
watch(
  () => config,
  () => {
    if (dialogVisible) {
      changed = true
      renderQrcode()
    }
  },
  { immediate: true, deep: true },
)

// Create or update QR code
const setQrcode = () => {
  if (renderError || !svgCode) {
    useMessage('error', {
      attach: container,
      content: t('tools.qrcode.renderError'),
    })
    return
  }
  if (config.content === '') {
    useMessage('error', {
      attach: container,
      content: t('tools.qrcode.notEmpty'),
    })
    return
  }
  const id = shortId(10)
  const { width, height } = config
  const src = svg64(svgCode)
  const name = `qrcode-${id}.svg`
  const blob = new Blob([svgCode], {
    type: 'image/svg+xml',
  })
  const file = new File([blob], name, {
    type: 'image/svg+xml',
  })
  uploadFileMap.value.set(id, file)
  if (changed) {
    editor.value
      ?.chain()
      .focus()
      .setImage(
        {
          id,
          type: 'qrcode',
          name,
          size: file.size,
          src,
          content: JSON.stringify(config),
          width,
          height,
        },
        !!content,
      )
      .run()
  }
  dialogVisible = false
}
</script>

<style lang="less" scoped>
.arslan-qrcode-container {
  padding: 2px;
  .arslan-qrcode-toolbar {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
  }
  .arslan-qrcode-code {
    margin-bottom: 10px;
    :deep(.arslan-textarea__inner) {
      height: 100%;
      resize: none;
    }
    .arslan-barcode-error {
      font-size: 12px;
      color: var(--arslan-error-color);
    }
  }
  .arslan-qrcode-render {
    border: solid 1px var(--td-border-level-2-color);
    border-radius: var(--arslan-radius);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    .arslan-qrcode-title {
      background-color: var(--arslan-button-hover-background);
      padding: 0 10px;
      position: absolute;
      font-size: 12px;
      border-bottom-right-radius: var(--arslan-radius);
    }
    .arslan-qrcode-empty {
      color: var(--arslan-text-color-light);
      font-size: 12px;
      margin: 40px;
    }
    .arslan-qrcode-svg {
      box-sizing: border-box;
      padding: 30px 10px;
      min-height: 100px;
      overflow: auto;
      color: var(--arslan-text-color);
      display: flex;
      align-items: center;
      justify-content: center;
      > .arslan-svg-render {
        border: solid 1px var(--arslan-border-color-light);
        :deep(svg) {
          display: block;
          width: 256px;
          height: 256px;
        }
      }
    }
  }
}
</style>

