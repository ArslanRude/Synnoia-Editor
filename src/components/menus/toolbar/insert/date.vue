<template>
  <menus-button
    ico="date"
    :text="t('insert.date')"
    menu-type="dropdown"
    huge
    :select-options="options"
    @click="insertDate"
  />
</template>

<script setup lang="ts">
// month
const formDate = (format: string) => useDateFormat(useNow(), format).value

// Removed Chinese numeral conversion (formatDateToChinese) to use normal dates

const options = [
  { content: 'Custom date', format: 'YYYY-MM-DD', capitalize: false },
  {
    content: 'Custom time',
    value: 'withTime',
    format: 'YYYY-MM-DD HH:mm:ss',
    capitalize: false,
    divider: true,
  },
  {
    content: formDate('YYYY-MM-DD'),
    format: 'YYYY-MM-DD',
    capitalize: false,
  },
  { content: formDate('YYYY-MM-DD'), format: 'YYYY-MM-DD', capitalize: false },
  { content: formDate('YYYY-MM-DD'), format: 'YYYY-MM-DD', capitalize: false },
  { content: formDate('YYYY-MM-DD'), format: 'YYYY-MM-DD', capitalize: false },
  {
    content: formDate('YYYY-MM-DD HH:mm:ss'),
    value: 'withTime',
    format: 'YYYY-MM-DD HH:mm:ss',
    capitalize: false,
    divider: true,
  },
]

const editor = inject('editor')

const insertDate = ({ content, format, capitalize, value }: any) => {
  if (!content) {
    return
  }
  editor.value
    ?.chain()
    .insertDatetime({
      text: content.includes('Custom') ? `[${content}]` : content,
      date: formDate(format),
      withTime: value === 'withTime',
      format,
      capitalize,
    })
    .focus()
    .run()
}
</script>
