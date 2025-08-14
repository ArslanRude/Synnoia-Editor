// https://www.diagrams.com/doc/faq/embed-mode
class DiagramEditor {
  frame: HTMLIFrameElement | undefined
  container: string
  domain = 'https://embed.diagrams.net'
  // https://www.drawio.com/doc/faq/supported-url-parameters
  params = {
    ui: 'atlas',
    proto: 'json',
    libraries: 1,
    configure: 1,
    noSaveBtn: 1,
  }
  xml: string | null = null
  format = 'xmlsvg'
  data: any

  constructor({
    domain,
    params,
    container,
  }: {
    domain: string
    params: Record<string, any>
    container: string
  }) {
    this.domain = domain ?? this.domain
    this.params = { ...this.params, ...params }
    this.container = container
  }

  handleuseMessageEvent = (evt: MessageEvent) => {
    if (
      this.frame !== undefined &&
      evt.source === this.frame.contentWindow &&
      evt.data.length > 0
    ) {
      try {
        const msg = JSON.parse(evt.data)
        if (msg) {
          this.handleuseMessage(msg)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Edit element
  edit(src: string) {
    let fmt = this.format
    if (src.substring(0, 15) === 'data:image/png;') {
      fmt = 'xmlpng'
    } else if (src.substring(0, 19) === 'data:image/svg+xml;') {
      fmt = 'xmlsvg'
    }
    this.startEditing(src, fmt)
    return this
  }

  // Create iframe
  createFrame() {
    const params = Object.keys(this.params)
      .map((key) => `${key}=${this.params[key as keyof typeof this.params]}`)
      .join('&')
    const frame = document.createElement('iframe')
    frame.setAttribute('class', 'arslan-diagrams-iframe')
    frame.setAttribute('src', `${this.domain}?${params}&lang=en`)
    return frame
  }

  // diagrams page and current page communication
  postMessage(msg: Record<string, any>) {
    if (this.frame) {
      this.frame.contentWindow?.postMessage(JSON.stringify(msg), '*')
    }
  }
  handleuseMessage(msg: {
    event: string
    data: any
    xml: string
    exit: boolean
  }) {
    if (msg.event === 'configure') {
      this.configureEditor()
    } else if (msg.event === 'init') {
      this.initializeEditor()
    } else if (msg.event === 'save') {
      this.export(msg.data)
      this.xml = msg.xml
      if (msg.exit) {
        msg.event = 'exit'
      } else {
        this.postMessage({
          action: 'status',
          messageKey: 'allChangesSaved',
          modified: false,
        })
      }
    }
    if (msg.event === 'exit') {
      if (this.format !== 'xml') {
        if (this.xml) {
          this.postMessage({
            action: 'export',
            format: this.format,
            xml: this.xml,
            spinKey: 'export',
          })
        }
      }
      this.stopEditing()
    }
  }

  // Start editing
  startEditing(data: any, format: string) {
    if (!this.frame) {
      window.addEventListener('message', this.handleuseMessageEvent)
      this.format = format ?? this.format
      this.data = data
      this.frame = this.createFrame()
      const container = document.querySelector(this.container)
      container?.appendChild(this.frame)
    }
  }

  // Stop editing
  stopEditing() {
    window.removeEventListener('message', this.handleuseMessageEvent)
    this.frame = undefined
  }

  // Install editor
  initializeEditor() {
    this.postMessage({
      action: 'load',
      autosave: 0,
      saveAndExit: '1',
      modified: 'unsavedChanges',
      xml: this.data,
    })
  }

  // Configure editor
  configureEditor() {
    this.postMessage({ action: 'configure', config: this.params.configure })
  }
  // Export data
  export(data: any) {
    return data
  }
}

export default DiagramEditor
