<template>
  <menus-button
    :ico="'echarts'"
    :text="t('tools.echarts.text')"
    huge
    @menu-click="menuClick"
  >
    <modal
      :visible="dialogVisible"
      icon="echarts"
      :header="
        dialogAddOrEdit ? t('tools.echarts.add') : t('tools.echarts.edit')
      "
      width="960px"
      @confirm="setConfirm"
      @close="dialogVisible = false"
    >
      <div class="arslan-echarts-container">
        <div class="arslan-echarts-header">
          <t-radio-group
            v-if="modelMode === 1"
            v-model="baseModeSet"
            variant="default-filled"
            default-value="0"
          >
            <t-radio-button :value="0">{{
              t('tools.echarts.setting')
            }}</t-radio-button>
            <t-radio-button :value="1">{{
              t('tools.echarts.dataGrid')
            }}</t-radio-button>
          </t-radio-group>
          <t-radio-group
            v-model="modelMode"
            variant="default-filled"
            default-value="0"
          >
            <t-radio-button :value="1">{{
              t('tools.echarts.visualization')
            }}</t-radio-button>
            <t-radio-button :value="0">{{
              t('tools.echarts.source')
            }}</t-radio-button>
          </t-radio-group>
        </div>
        <div v-if="modelMode === 0" class="arslan-echarts-source-center">
          <t-textarea
            v-model="sourceOptions"
            class="arslan-echarts-code"
            autofocus
            :placeholder="t('tools.echarts.placeholder')"
          />
          <div class="arslan-echarts-render">
            <div id="echartsSourceModeId" class="arslan-echarts-svg"></div>
          </div>
        </div>
        <div
          v-if="modelMode === 1 && baseModeSet === 0"
          class="arslan-echarts-source-center"
        >
          <div class="arslan-echarts-render">
            <div id="echartsSettingModeId" class="arslan-echarts-svg"></div>
          </div>
          <div class="arslan-echarts-settting">
            <t-form label-align="top">
              <!--Graphic type-->
              <t-form-item
                :label="t('tools.echarts.set.seriesType')"
                name="seriesType"
              >
                <t-select
                  v-model="baseConfig.config.seriesType"
                  class="demo-select-base"
                >
                  <t-option
                    v-for="(item, index) in baseData.seriesType"
                    :key="index"
                    :value="item.code"
                    :label="item.name"
                  >
                    {{ item.name }}
                  </t-option>
                </t-select>
              </t-form-item>
              <t-form-item v-if="baseConfig.config.seriesType === 'line'">
                <!--Smooth line-->
                <t-checkbox
                  v-if="baseConfig.config.seriesType === 'line'"
                  v-model="baseConfig.config.smooth"
                  >{{ t('tools.echarts.set.smooth') }}</t-checkbox
                >
              </t-form-item>
              <t-form-item>
                <!--Legend-->
                <t-checkbox v-model="baseConfig.config.legend">{{
                  t('tools.echarts.set.legend')
                }}</t-checkbox>
              </t-form-item>
              <!--Legend layout-->
              <t-form-item
                v-if="baseConfig.config.legend"
                :label="t('tools.echarts.set.legendorient')"
                name="legendorient"
              >
                <t-select
                  v-model="baseConfig.config.legendorient"
                  class="demo-select-base"
                >
                  <t-option
                    v-for="(item, index) in baseData.legendorient"
                    :key="index"
                    :value="item.code"
                    :label="item.name"
                  >
                    {{ item.name }}
                  </t-option>
                </t-select>
              </t-form-item>
              <!--Legend vertical position-->
              <t-form-item
                v-if="baseConfig.config.legend"
                :label="t('tools.echarts.set.legendlocation')"
                name="legend"
              >
                <t-select
                  v-model="baseConfig.config.legendlocation"
                  class="demo-select-base"
                >
                  <t-option
                    v-for="(item, index) in baseData.legendlocation"
                    :key="index"
                    :value="item.code"
                    :label="item.name"
                  >
                    {{ item.name }}
                  </t-option>
                </t-select>
              </t-form-item>
              <!--Legend horizontal position-->
              <t-form-item
                v-if="baseConfig.config.legend"
                :label="t('tools.echarts.set.legendleft')"
                name="legendleft"
              >
                <t-select
                  v-model="baseConfig.config.legendleft"
                  class="demo-select-base"
                >
                  <t-option
                    v-for="(item, index) in baseData.titleleft"
                    :key="index"
                    :value="item.code"
                    :label="item.name"
                  >
                    {{ item.name }}
                  </t-option>
                </t-select>
              </t-form-item>
              <!--Title name-->
              <t-form-item
                :label="t('tools.echarts.set.titleText')"
                name="title"
              >
                <t-input
                  v-model="baseConfig.config.titleText"
                  :placeholder="t('tools.echarts.set.titleTextPlaceholder')"
                />
              </t-form-item>
              <!--Title position-->
              <t-form-item
                v-if="baseConfig.config.titleText != ''"
                :label="t('tools.echarts.set.titleleft')"
                name="titleleft"
              >
                <t-select
                  v-model="baseConfig.config.titleleft"
                  class="demo-select-base"
                >
                  <t-option
                    v-for="(item, index) in baseData.titleleft"
                    :key="index"
                    :value="item.code"
                    :label="item.name"
                  >
                    {{ item.name }}
                  </t-option>
                </t-select>
              </t-form-item>
            </t-form>
          </div>
        </div>
        <div
          v-if="modelMode === 1 && baseModeSet === 1"
          class="arslan-echarts-source-center"
        >
          <div class="arslan-echarts-render" style="margin-left: 2px">
            <t-table
              id="echartsSettingGridId"
              class="arslan-echarts-table"
              row-key="tabkey"
              :columns="baseData.Columns"
              :data="baseConfig.data"
              size="small"
              :show-header="false"
              :fixed-rows="[1]"
              :editable-cell-state="editableCellState"
              bordered
              lazy-load
            />
          </div>
        </div>
      </div>
    </modal>
  </menus-button>
</template>

<script setup lang="ts">
import { Input } from 'tdesign-vue-next'

import {
  calbaseConfigData,
  calbaseConfigOptions,
} from '@/extensions/echarts/cal-service'
import { useEchartsLoader } from '@/extensions/echarts/init-service'
import { getSelectionNode } from '@/extensions/selection'
import { shortId } from '@/utils/short-id'

const { mode } = defineProps({
  mode: {
    type: String,
    default: undefined,
  },
})

const container = inject('container')
const editor = inject('editor')
const options = inject('options')

const { loadEchartScript } = useEchartsLoader(options.value)

// Popup window display hidden true display default hidden
let dialogVisible = $ref(false)
// Popup window title is edit or add, true: add false: edit
let dialogAddOrEdit = $ref(true)
// Interface display mode
let modelMode = $ref(0)
// Current node cache information
let curNode = $ref(null)
// sourceOptions Advanced model-configuration information
let sourceOptions = $ref(null)

// Advanced mode mychart display object
let sourceMyChart: any = null
// Basic mode mychart display object, to avoid reactive
let settingMyChart: any = null

// Basic model default setting interface, 0: graphic interface 1: data interface
let baseModeSet = $ref(0)
// baseConfig Visual interface configuration, dynamic data to be saved
let baseConfig = $ref({ data: [], config: {} })
// Basic data, data that will not change
let baseData: any = {}
// Popup window display
const menuClick = () => {
  if (dialogVisible) {
    return
  }
  baseModeSet = 0 // Default open is setting interface

  const openAddMode = () => {
    dialogAddOrEdit = true
    modelMode = options.value.echarts?.mode
    sourceOptions = null
    initBaseConfig()
    dialogVisible = true
  }

  // Add mode
  if (mode === 'add') {
    openAddMode()
    return
  }
  curNode = getSelectionNode(editor.value)
  // Selected node is echarts node, read the configuration information on the interface
  if (curNode?.type?.name !== 'echarts') {
    openAddMode()
    return
  }

  // Update mode
  dialogAddOrEdit = false
  modelMode = curNode.attrs?.mode
  sourceOptions = null
  if (curNode.attrs?.chartOptions !== null) {
    sourceOptions = JSON.stringify(curNode.attrs?.chartOptions)
  }
  initBaseConfig()
  loadBaseConfig(curNode.attrs?.chartConfig)
  // Popup window display
  dialogVisible = true
}
// Popup window click confirm, set parent interface impact
const setConfirm = () => {
  let resOptions = {
    id: '',
    name: '',
    mode: modelMode,
    chartOptions: null,
    chartConfig: null,
    describe: '',
    nodeAlign: 'center',
    margin: {},
  }
  if (!dialogAddOrEdit) {
    resOptions = JSON.parse(JSON.stringify(curNode.attrs))
  } else {
    resOptions.id = shortId()
    resOptions.mode = modelMode
  }
  if (resOptions.mode === 1) {
    // Configurable mode
    const newData = calbaseConfigData(baseConfig.data)
    resOptions.chartConfig = { data: newData, config: baseConfig.config } as any

    if (settingMyChart === null) {
      const dialog = useAlert({
        attach: container,
        theme: 'warning',
        header: t('tools.echarts.text'),
        body: t('tools.echarts.settingerror'), // Please confirm that the preview view is displayed correctly!
        onConfirm() {
          dialog.destroy()
        },
      })
      return
    }
  } else {
    // Source code mode
    try {
      resOptions.chartOptions = JSON.parse(sourceOptions)
    } catch (e) {
      const dialog = useAlert({
        attach: container,
        theme: 'warning',
        header: t('tools.echarts.text'),
        body: t('tools.echarts.sourceerror'), // Structure is incorrect
        onConfirm() {
          dialog.destroy()
        },
      })
      return
    }
    if (sourceMyChart === null) {
      const dialog = useAlert({
        attach: container,
        theme: 'warning',
        header: t('tools.echarts.text'),
        body: t('tools.echarts.sourceerror2'), // Structure is incorrect or undefined
        onConfirm() {
          dialog.destroy()
        },
      })
      return
    }
  }
  // Set to save image or advanced mode, automatically save image
  if (options.value.echarts?.renderImage || resOptions.mode === 0) {
    // Source code mode or havImage
    const dataURI = (
      resOptions.mode === 1 ? settingMyChart : sourceMyChart
    ).getDataURL({
      type: 'png', // can be 'png' or 'jpeg'
      pixelRatio: 5, //Increase the resolution, default is 1
      backgroundColor: '#fff',
    })
    const byteString = atob(dataURI.split(',')[1])
    const [typePart] = dataURI.split(',')
    const [protocol, mimeString] = typePart
      .split(':')
      .slice(1)
      .toString()
      .split(';')
    // Write byte stream to Blob
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const fileBlob = new Blob([ab], { type: mimeString })
    options.value.onFileUpload(fileBlob, resOptions.id, 'echarts')
  }
  // Update or add
  if (!dialogAddOrEdit) {
    editor.value.commands.updateEcharts(resOptions)
  } else {
    editor.value.commands.setEcharts(resOptions)
  }
  dialogVisible = false
}

watch(
  () => [sourceOptions, modelMode, baseConfig.config, baseModeSet],
  async () => {
    try {
      disposeChart()
      await nextTick()
      await loadModeEchart()
    } catch (e) {}
  },
  { deep: true, immediate: false },
)

// Interface data loading
const loadModeEchart = async () => {
  await nextTick()
  await loadEchartScript()
  // Next, the usage is the same as before, initialize the chart, set the configuration item
  if (typeof echarts !== 'undefined') {
    // Initialize the chart
    disposeChart()
    const _curDomSetting = document.getElementById('echartsSettingModeId')
    const _curDomSource = document.getElementById('echartsSourceModeId')
    if (modelMode === 1 && _curDomSetting !== null) {
      // Actual parameter setting
      const newData = calbaseConfigData(baseConfig.data)
      if (!(newData === null || newData.length === 0)) {
        const newOptions = calbaseConfigOptions(
          JSON.parse(JSON.stringify(newData)),
          JSON.parse(JSON.stringify(baseConfig.config)),
          options.value,
        )

        settingMyChart = echarts.init(_curDomSetting)
        try {
          settingMyChart.setOption(newOptions)
        } catch (e) {
          disposeChart()
        }
      }
    } else if (
      modelMode === 0 &&
      sourceOptions !== null &&
      _curDomSource !== null
    ) {
      sourceMyChart = echarts.init(_curDomSource)
      try {
        const calOptions = normalizeJsonString(sourceOptions)
        if (calOptions !== sourceOptions) {
          sourceOptions = calOptions
        }
        sourceMyChart.setOption(JSON.parse(sourceOptions))
      } catch (e) {
        disposeChart()
      }
    }
  }
}
// Before loading the control, destroy it to prevent repeated loading failures
const disposeChart = () => {
  if (sourceMyChart !== null) {
    sourceMyChart.dispose()
    sourceMyChart = null
  }
  if (settingMyChart !== null) {
    settingMyChart.dispose()
    settingMyChart = null
  }
}
// Process input json, attributes and single quotes need to be converted to double quotes
const normalizeJsonString = (jsonString: any) => {
  // Regular expression, used to match keys (assuming keys are valid JavaScript identifiers)
  const keyPattern = /(\s*)([a-zA-Z_$][\w$]*)(\s*:\s*)/g
  // Regular expression, used to match single quotes and convert them to double quotes
  const singleQuotePattern = /'([^']*)'/g

  // Convert single quotes to double quotes
  jsonString = jsonString.replace(singleQuotePattern, '"$1"')
  // Add double quotes to keys
  jsonString = jsonString.replace(keyPattern, '$1"$2"$3')
  return jsonString
}

// Basic model related methods and settings start
// let tableLayout='fixed'
const initBaseConfig = () => {
  baseData = {}
  baseData.Columns = []
  // Create alphabet A-Z
  const alphabet = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(i + 65),
  )

  // Loop through each letter and create column configuration
  alphabet.forEach((letter) => {
    baseData.Columns.push({
      title: letter,
      colKey: letter.toUpperCase(),
      align: 'center',
      // Only 'A' column is fixed
      fixed: letter === 'A' ? 'left' : undefined,
      // Edit status related configuration, all concentrated in edit
      edit: {
        component: Input,
        // props, Input component (can be a function, when different rows have different props attributes, use Function)
        props: {
          clearable: false,
          autofocus: false,
          placeholder: '',
        },
        // Except for clicking non-self elements to exit the editing state, what other events exit the editing state
        abortEditOnEvent: ['onEnter'],
        // Edit completed, exit editing state after trigger
        onEdited: (context: any) => {
          const newData = context.newRowData
          if (context.rowIndex > 0) {
            for (const artt1 in newData) {
              if (artt1 === 'A' || artt1 === 'tabkey') {
                continue
              }
              if (!isNaN(Number(newData[artt1]))) {
                newData[artt1] = Number(newData[artt1])
              } else {
                newData[artt1] = 0
              }
            }
          }
          baseConfig.data.splice(context.rowIndex, 1, newData)
        },
        // Default whether to edit
        defaultEditable: false,
        showEditIcon: false,
      },
    })
  })

  // Basic setting configuration does not need multi-language
  baseData.seriesType = [
    { code: 'bar', name: t('tools.echarts.set.bar') }, // "Bar chart"
    { code: 'line', name: t('tools.echarts.set.line') }, // "Line chart"
    { code: 'pie', name: t('tools.echarts.set.pie') }, // "Pie chart"
  ]
  baseData.legendorient = [
    { code: 'horizontal', name: t('tools.echarts.set.horizontal') }, // "Horizontal"
    { code: 'vertical', name: t('tools.echarts.set.vertical') }, // "Vertical"
  ]
  baseData.legendlocation = [
    { code: 'top', name: t('tools.echarts.set.top') }, // "Top"
    { code: 'bottom', name: t('tools.echarts.set.bottom') }, // "Bottom"
  ]
  baseData.titleleft = [
    { code: 'left', name: t('tools.echarts.set.left') }, // "Left"
    { code: 'center', name: t('tools.echarts.set.center') }, // "Center"
    { code: 'right', name: t('tools.echarts.set.right') }, // "Right"
  ]
  // Initialize baseConfig
  baseConfig = { data: [], config: {} }
  // Initialize baseConfig.data
  baseConfig.data = [
    { tabkey: shortId(), A: '', B: 'Series 1', C: 'Series 2', D: 'Series 3' },
    { tabkey: shortId(), A: 'Category 1', B: 4.3, C: 2.4, D: 2 },
    { tabkey: shortId(), A: 'Category 2', B: 2.5, C: 4.4, D: 2 },
    { tabkey: shortId(), A: 'Category 3', B: 3.5, C: 1.8, D: 3 },
    { tabkey: shortId(), A: 'Category 4', B: 4.5, C: 2.8, D: 5 },
  ]
  for (let i = 0; i < 17; i++) {
    baseConfig.data.push({ tabkey: shortId(), A: '', B: '', C: '', D: '' })
  }

  // Initialize baseConfig.config default values
  baseConfig.config.seriesType = 'bar'
  baseConfig.config.smooth = false // Smooth line
  baseConfig.config.legend = true // Legend whether to display legend
  baseConfig.config.legendorient = 'horizontal' // Legend direction default horizontal
  baseConfig.config.legendlocation = 'bottom' // Legend position bottom
  baseConfig.config.legendleft = 'center' // Legend horizontal position center
  baseConfig.config.titleText = '' // Title name
  baseConfig.config.titleleft = 'center' // Title horizontal position center
}
// Load data from cached configuration to current display configuration
const loadBaseConfig = (cachebaseConfig: any) => {
  if (cachebaseConfig === null) {
    return
  }
  if (cachebaseConfig.data !== null && cachebaseConfig.data.length > 0) {
    baseConfig.data = cachebaseConfig.data
  }
  for (const item of baseConfig.data) {
    item.tabkey = shortId()
  }
  for (let i = 0; i < 10; i++) {
    baseConfig.data.push({ tabkey: shortId(), A: '', B: '' })
  }
  if (cachebaseConfig.config !== null) {
    for (const attr1 in cachebaseConfig.config) {
      if (baseConfig.config[attr1] !== null) {
        baseConfig.config[attr1] = cachebaseConfig.config[attr1]
      }
    }
  }
}
const editableCellState = () => {
  return true
}
// Basic model related methods and settings end
</script>

<style lang="less" scoped>
@import '@/assets/styles/_mixins.less';

.arslan-echarts-container {
  min-height: 300px;

  .arslan-echarts-header {
    display: flex;
    justify-content: space-between;
    :only-child {
      margin-left: auto;
    }
  }
  .arslan-echarts-source-center {
    display: flex;
    height: calc(100% - 30px);
    width: 100%;
    margin-top: 10px;
    overflow: visible;

    .arslan-echarts-code {
      width: 320px;
      margin-right: 10px;

      :deep(.arslan-textarea__inner) {
        height: 100%;
        resize: none;
      }
    }

    .arslan-echarts-settting {
      --td-comp-margin-xxl: 10px;
      width: 360px;
      padding: 20px;
      margin-left: 10px;
      border: solid 1px var(--arslan-border-color);
      border-radius: var(--arslan-radius);
      max-height: 420px;
      overflow: auto;
      .arslan-scrollbar();
      :deep(.arslan-form__controls) {
        &,
        &-content {
          min-height: auto;
        }
      }
    }

    .arslan-echarts-render {
      flex: 1;
      border: solid 1px var(--arslan-border-color);
      border-radius: var(--arslan-radius);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;

      .arslan-echarts-svg {
        box-sizing: border-box;
        height: 420px;
        padding: 20px 15px 15px;
        overflow: auto;
        display: flex;
        justify-content: center;
      }

      .arslan-echarts-table {
        --td-comp-paddingTB-s: 3px;
        --td-comp-paddingLR-s: 5px;
        --td-comp-size-m: 18px;
        --td-component-border: var(--arslan-border-color);
        box-sizing: border-box;
        height: 420px;
        padding: 0px;
        border: 0px;
        overflow: auto;
        display: flex;
        justify-content: center;
        :deep(.arslan-table) {
          &__content {
            border: none;
          }
          &__cell--editable {
            cursor: text;
          }
        }
        :deep(.t-input) {
          border: none;
          box-shadow: none;
          cursor: text;
          input {
            text-align: center;
          }
        }
      }
    }
  }
}
</style>

