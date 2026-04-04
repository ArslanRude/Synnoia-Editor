<template>
  <menus-button v-if="$options.enabled" ico="word" :text="t('base.importWord.text')" huge @menu-click="importWord" />
</template>

<script setup lang="ts">
const container = inject('container')
const editor = inject('editor')
const options = inject('options')
const $options = options.value.toolbar.importWord

// Dynamically import mammoth.js
onMounted(() => {
  const mammothScriptElement = document.querySelector('#mammoth-script')
  if (mammothScriptElement === null && $options.enabled) {
    const style = document.createElement('script')
    style.src = `${options.value.cdnUrl}/libs/mammoth/mammoth.browser.min.js`
    style.id = 'mammoth-script'
    style.defer = true
    // Fallback to unpkg if the above path is invalid or not present
    style.onerror = () => {
      const fallback = document.createElement('script')
      fallback.src = 'https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js'
      fallback.id = 'mammoth-script-fallback'
      document.querySelector('head')?.append(fallback)
    }
    document.querySelector('head')?.append(style)
  }
})

// Wait for Mammoth to be available (script load) with a timeout
const waitForMammoth = async (timeout = 7000) => {
  if ((window as any).mammoth) return true
  const script = document.querySelector(
    '#mammoth-script, #mammoth-script-fallback',
  ) as HTMLScriptElement | null
  const ready = await new Promise<boolean>((resolve) => {
    let timer: number | undefined
    const finish = () => {
      if (timer) window.clearTimeout(timer)
      resolve(!!(window as any).mammoth)
    }
    if (script) script.addEventListener('load', finish, { once: true })
    timer = window.setTimeout(finish, timeout)
  })
  if (ready) return true
  const start = Date.now()
  while (Date.now() - start < 2000 && !(window as any).mammoth) {
    await new Promise((r) => setTimeout(r, 100))
  }
  return !!(window as any).mammoth
}

const importWord = () => {
  // @ts-expect-error, global variable injected by script
  if (!(window).mammoth) {
    const dialog = useAlert({
      attach: container,
      theme: 'warning',
      header: t('base.importWord.loadScript.title'),
      body: t('base.importWord.loadScript.message'),
      onConfirm() {
        dialog.destroy()
      },
    })
    // Do not return; allow user to still pick a file. We'll re-check before converting.
  }
  const { open, onChange } = useFileDialog({
    accept: '.docx',
    reset: true,
    multiple: false,
  })
  // Open file dialog
  open()
  // Insert file
  onChange(async (files: FileList | null) => {
    const [file] = Array.from(files ?? [])
    if (!file) {
      return
    }
    if (file.size > $options.maxSize) {
      useMessage('error', {
        attach: container,
        content: t('base.importWord.limitSize', {
          limitSize: $options.maxSize / (1024 * 1024),
        }),
      })
      return
    }
    const message = await useMessage('loading', {
      attach: container,
      content: t('base.importWord.converting'),
    })

    // Use user-defined import method
    if ($options?.useCustomMethod) {
      const result = await $options.onCustomImportMethod?.(file)
      message.close()
      try {
        if (result?.messages?.type === 'error') {
          useMessage('error', {
            attach: container,
            content: `${t('base.importWord.convertError')} (${result.messages.message})`,
          })
          return
        }
        if (result?.value) {
          editor.value?.commands.setContent(result.value)
        } else {
          useMessage('error', {
            attach: container,
            content: t('base.importWord.importError'),
          })
        }
      } catch {
        useMessage('error', {
          attach: container,
          content: t('base.importWord.importError'),
        })
      }
      return
    }

    // Ensure Mammoth is ready; wait briefly if it's still loading
    // @ts-expect-error, global variable injected by script
    if (!(window).mammoth) {
      await waitForMammoth(7000)
    }
    // @ts-expect-error, global variable injected by script
    if (!(window).mammoth) {
      const dialog = useAlert({
        attach: container,
        theme: 'warning',
        header: t('base.importWord.loadScript.title'),
        body: t('base.importWord.loadScript.message'),
        onConfirm() {
          dialog.destroy()
        },
      })
      message.close()
      return
    }
    // Use Mammoth to import
    const arrayBuffer = await file.arrayBuffer()
    // Some default configurations
    const customOptions = {
      transformConvertRun(run: any) {
        const resultRun: any = {}
        if (run.bgColor) {
          resultRun['mark'] = {
            style: `background-color:${run.bgColor}; color: inherit`,
            'data-color': run.bgColor,
          }
        }
        return resultRun
      },
      styleMap: [
        "p[style-name='blockquote'] => blockquote.blockquote > p:fresh",
        "p[style-name='BlockQuote'] => blockquote.blockquote > p:fresh",
        "p[style-name='Code'] => pre.preCode > code:fresh",
        "p[style-name='code'] => pre.preCode > code:fresh",
      ],
    }
    // @ts-expect-error, global variable injected by script
    const { messages, value } = await (window).mammoth.convertToHtml(
      { arrayBuffer },
      {
        ...customOptions,
        ...$options.options,
      },
    )
    const errors = Array.isArray(messages)
      ? messages.filter((m: any) => m?.type === 'error')
      : (messages?.type === 'error' ? [messages] : [])
    if (errors.length > 0) {
      useMessage('error', {
        attach: container,
        content: `${t('base.importWord.convertError')} (${errors.map((e: any) => e?.message).filter(Boolean).join('; ')})`,
      })
      message.close()
      return
    }
    try {
      // Parse and process the HTML content returned by Mammoth
      const domparser = new DOMParser()
      const doc = domparser.parseFromString(value, 'text/html')
      for (const img of doc.querySelectorAll('img')) {
        const parent = img.parentElement
        if (parent?.tagName === 'P') {
          parent.insertAdjacentElement('beforebegin', img)
          if (!parent.hasChildNodes() && parent.textContent === '') {
            parent.remove()
          }
        }
      }
      const content = doc.body.innerHTML.toString()
      editor.value?.commands.setContent(content)
      message.close()
    } catch {
      message.close()
      useMessage('error', {
        attach: container,
        content: t('base.importWord.importError'),
      })
    }
  })
}
</script>
