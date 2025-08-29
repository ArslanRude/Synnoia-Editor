/*
This service mainly serves to process echarts related public processing methods, mainly used for basic mode
*/

// Process data in the basic mode, and according to the first column being empty, it is not considered as valid data
export function calbaseConfigData(data: any) {
  if (!data) {
    return data
  }
  data = JSON.parse(JSON.stringify(data))
  for (let i = data.length - 1; i >= 0; i--) {
    if (i === 0) {
      continue
    }
    if (!data[i].A || data[i].A === '') {
      data.splice(i, 1)
    }
  }
  return data
}
// Calculate configuration based on manually set configuration information and data to generate Options, this method will gradually expand
export function calbaseConfigOptions(data: any, config: any, options: any) {
  // Declare the final returned options
  let resOption: any = {}
  if (!data || !config) {
    return resOption
  }
  // 1.0 Title
  if (config.titleText && config.titleText !== '') {
    resOption.title = {}
    resOption.title.text = config.titleText
    resOption.title.left = config.titleleft ?? 'center' // Title position
  }
  // 2.0 Legend
  let colNameList: any = []
  function calbaseConfigOptionsInlegend() {
    resOption.legend = {}
    // Legend display hidden
    resOption.legend.show = config.legend ? true : false
    // Legend vertical position
    resOption.legend[config.legendlocation] = 10
    // Legend horizontal position
    resOption.legend.left = config.legendleft ?? 'center'
    // Legend layout
    resOption.legend.orient = config.legendorient
    resOption.legend.data = []
    // Currently only supports 26 legends, legend names are empty, not displayed
    const alphabet = Array.from({ length: 26 }, (_, i) =>
      String.fromCharCode(i + 65),
    )
    colNameList = []
    for (let i = 1; i < alphabet.length; i++) {
      const curColName = alphabet[i]
      if (!data[0][curColName] || data[0][curColName] === '') {
        continue
      }
      resOption.legend.data.push(data[0][curColName])
      if (curColName) {
        colNameList.push(curColName) // Only push non-empty column names to the list
      }
      if (config.seriesType === 'pie' && colNameList.length === 1) {
        break
        // Pie chart only needs to display one legend
      }
    }
  }
  calbaseConfigOptionsInlegend()

  // 3.0 Legend yAxis xAxis series processing
  function calbaseConfigOptionsInType() {
    // y axis
    if (config.seriesType === 'bar' || config.seriesType === 'line') {
      resOption.yAxis = {
        type: 'value',
      }
      resOption.xAxis = {}
      resOption.xAxis.type = 'category'
      resOption.xAxis.data = []

      for (let i = 1; i < data.length; i++) {
        resOption.xAxis.data.push(data[i]['A'])
      }
    }

    resOption.series = []

    for (let i = 0; i < colNameList.length; i++) {
      const seriesdata: object[] = []
      // From the second row
      for (let j = 1; j < data.length; j++) {
        let _value = data[j][colNameList[i]]
        if (isNaN(Number(_value))) {
          _value = 0
        } else _value = Number(_value)
        if (config.seriesType === 'pie') {
          seriesdata.push({ value: _value, name: data[j]['A'] })
        } else {
          seriesdata.push(_value)
        }
      }
      resOption.series.push({
        name: resOption.legend.data[i],
        type: config.seriesType,
        data: seriesdata,
      })
      // Smooth line
      if (
        config.smooth &&
        resOption.series[resOption.series.length - 1].type === 'line'
      ) {
        resOption.series[resOption.series.length - 1].smooth = true
      }
    }
    if (config.seriesType === 'pie' && resOption.legend.data !== null) {
      delete resOption.legend.data
    }
  }

  calbaseConfigOptionsInType()

  // 4.0 grid property setting
  resOption.grid = {
    left: '3%',
    right: '4%',
    top: 30,
    bottom: 30,
    containLabel: true,
  }
  if (resOption?.legend?.show) {
    if (resOption?.legend?.bottom) {
      resOption.grid.bottom = 60
    } else {
      resOption.grid.top = 60
    }
  }

  // 9.0 Custom extension, can be implemented in external custom display effect, expand personalized style
  const newOptions = options.echarts?.onCustomSettings?.(data, config)
  if (newOptions !== null && typeof newOptions === 'object') {
    resOption = newOptions
  }
  // 10.0 Return value must be JSON.parse(JSON.stringify( ), individual cases echarts not displayed
  return JSON.parse(JSON.stringify(resOption))
}
