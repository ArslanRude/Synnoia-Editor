<template>
  <iframe ref="iframeRef" class="arslan-print-iframe" :srcdoc="iframeCode" />
</template>

<script setup lang="ts">
const container = inject('container')
const editor = inject('editor')
const printing = inject('printing')
const exportFile = inject('exportFile')
const page = inject('page')
const options = inject('options')

const iframeRef = $ref<HTMLIFrameElement | null>(null)
let iframeCode = $ref('')
const getStylesHtml = () => {
  return Array.from(document.querySelectorAll('link, style'))
    .map((item) => item.outerHTML)
    .join('')
}

const getPlyrSprite = () => {
  return document.querySelector('#sprite-plyr')?.innerHTML ?? ''
}

const getContentHtml = () => {
  const originalContent =
    document.querySelector(`${container} .arslan-page-content`)?.outerHTML ?? ''
  return prepareEchartsForPrint(originalContent)
}
// Because echarts relies on dynamic rendering of components, it cannot be achieved through html when printing, so we solve it by converting it to an image.
const prepareEchartsForPrint = (htmlContent: any) => {
  // Create a temporary DOM container to process HTML content
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent

  // Find all ECharts instances that need to be converted
  const charts = tempDiv.querySelectorAll('.arslan-node-echarts-body')
  for (const chartElement of charts) {
    const chartInstance = echarts.getInstanceByDom(chartElement)
    if (chartInstance) {
      // Use getDataURL method to get the base64 image data of the chart
      const imgData = chartInstance.getDataURL({
        type: 'png', // Can be 'png' or 'jpeg'
        pixelRatio: 2, // Raise the resolution, default is 1//Too high resolution will be slow
        backgroundColor: '#fff', // Background color, default is transparent
      })

      // Create a new img element and set its src attribute to the base64 image data of the chart
      const imgElement = document.createElement('img')
      imgElement.src = imgData
      imgElement.style.width = '100%' // Ensure the image width fits the container, adjust according to actual needs

      // Replace the original chart element with the img element
      chartElement?.parentNode?.replaceChild(imgElement, chartElement)
    }
  }
  return tempDiv.innerHTML
}

const defaultLineHeight = $computed(
  () =>
    options.value.dicts?.lineHeights.find(
      (item: { default: any }) => item.default,
    )?.value,
)

const getIframeCode = () => {
  const { orientation, size, margin, background } = page.value
  /* eslint-disable */
  return `
    <!DOCTYPE html>
    <html lang="en" theme-mode="${options.value.theme}">
    <head>
      <title>${options.value.document?.title}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${getStylesHtml()}
      <style>
      html{
        margin: 0;
        padding: 0;
        overflow: visible;
      }
      body{
        margin: 0;
        padding: 0;
        background-color: ${background};
        -webkit-print-color-adjust: exact;
      }
      .arslan-page-content{
        transform: scale(1) !important;
        overflow: hidden;
      }
      @page {
        size: ${orientation === 'portrait' ? size?.width : size?.height}cm ${orientation === 'portrait' ? size?.height : size?.width}cm; 
        padding: ${margin?.top}cm 0 ${margin?.bottom}cm;
        margin: 0;
      }
      @page:first {
        padding-top: 0;
      }
      @page:last {
        padding-bottom: 0;
        page-break-after: avoid;
      }
      </style>
    </head>
    <body class="is-print">
      <div id="sprite-plyr" style="display: none;">
      ${getPlyrSprite()}
      </div>
      <div class="arslan-editor-container" style="line-height: ${defaultLineHeight};" aria-expanded="false">
        <div class="tiptap arslan-editor" translate="no">
          ${getContentHtml()}
        </div>
      </div>
      <script>
        document.addEventListener("DOMContentLoaded", (event) => {
          const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
              if (mutation.removedNodes) {
                Array.from(mutation.removedNodes).forEach(node => {
                  if (node?.classList?.contains('arslan-page-watermark')) {
                    location.reload();
                  }
                });
              }
            });
          });
        });
      <\/script>
    </body>
    </html>`
  /* eslint-enable */
}

const printPage = () => {
  editor.value?.commands.blur()
  iframeCode = getIframeCode()

  const dialog = useConfirm({
    attach: container,
    theme: 'info',
    header: printing.value ? t('print.title') : t('export.pdf.title'),
    body: printing.value ? t('print.message') : t('export.pdf.message'),
    confirmBtn: printing.value ? t('print.confirm') : t('export.pdf.confirm'),
    onConfirm() {
      dialog.destroy()
      setTimeout(() => {
        iframeRef?.contentWindow?.print()
      }, 300)
    },
    onClosed() {
      printing.value = false
      exportFile.value.pdf = false
    },
  })
}

watch(
  () => [printing.value, exportFile.value.pdf],
  (value: [boolean, boolean]) => {
    if (!value[0] && !value[1]) {
      return
    }
    printPage()
  },
)
</script>

<style lang="less" scoped>
.arslan-print-iframe {
  position: absolute;
  width: 0;
  height: 0;
  border: none;
  overflow: auto;
}
</style>
