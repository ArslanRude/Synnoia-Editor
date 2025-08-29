/*
//**This service mainly serves** 
onMounted hook easily appears echarts-script already exists, but onload is not completed,
causing the second entry to determine that it exists but the actual echart has not been loaded,
causing only the first chart to be loaded, and subsequent charts are not loaded.
loadEchartScript :solve the problem of only the first chart being displayed when loading multiple charts.
*/

const echartsLoadPromise = ref<Promise<void> | null>(null)

// To reduce the size of the bundled package, we are using CDN-style imports instead of importing the entire echarts package as an npm package.
export function useEchartsLoader(options: any) {
  return {
    // Call this method to initialize loading the JavaScript script.
    loadEchartScript: () => {
      if (!options.toolbar?.disableMenuItems.includes('echarts')) {
        if (!echartsLoadPromise.value) {
          echartsLoadPromise.value = new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector('#echarts-script')
            if (!existingScript) {
              const script = document.createElement('script')
              script.src = `${options.cdnUrl}/libs/echarts/echarts.min.js`
              script.id = 'echarts-script'
              script.type = 'text/javascript'
              script.onload = () => resolve()
              script.onerror = (error) =>
                reject(new Error(`load Echarts ERROR`))
              document.querySelector('head')!.append(script)
            } else {
              // If the script already exists, immediately resolve the Promise
              resolve()
            }
          })
        }
        return echartsLoadPromise.value
      } else {
        return null
      }
    },
  }
}
