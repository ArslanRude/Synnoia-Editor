<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Navbar - fixed height -->
    <div class="flex-shrink-0">
      <Nav @toggle-sidebar="toggleSidebar" />
    </div>

    <!-- Content area with editor and sidebar -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Editor content - takes remaining space -->
      <div class="flex-1 min-h-0 overflow-auto">
        <Synnoia ref="editorRef" v-bind="options" />
      </div>

      <!-- AI Agent Panel - integrated into layout -->
      <AgentPanel v-if="isSidebarOpen" :is-open="isSidebarOpen" :width="sidebarWidth" :editor="editorRef?.getEditor?.()"
        :initial-selection="selectedTextForAgent" @update:is-open="isSidebarOpen = $event" @update:width="sidebarWidth = $event" />
    </div>

    <!-- <div class="box">
      <Synnoia editor-key="testaaa" :toolbar="{ defaultMode: 'classic' }" />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import Synnoia from '@/components/index.vue'
import Nav from '@/components/navbar/nav.vue'
import AgentPanel from '@/components/sidebar/sidebar.vue'
import { shortId } from '@/utils/short-id'
import { templates } from '@/data/templates'
import { useAuth } from '@/auth'

// Initialize auth state (optional - editor works without login)
const { checkAuth } = useAuth()

let isSidebarOpen = $ref(false)
let sidebarWidth = $ref(400) // Default width in pixels
let selectedTextForAgent = $ref('')
const editorRef = $ref(null)

// Handle sidebar toggle - clear selection when closing
const toggleSidebar = () => {
  isSidebarOpen = !isSidebarOpen
  if (!isSidebarOpen) {
    selectedTextForAgent = ''
  }
}

// Initialize on mount
onMounted(async () => {
  await checkAuth()

  // Listen for synnoia agent open event from bubble menu
  window.addEventListener('synnoia:open-agent', (event: any) => {
    const selectionText = event.detail?.selectionText || ''
    selectedTextForAgent = selectionText
    isSidebarOpen = true
  })
})
const options = $ref({
  theme: 'light',
  toolbar: {
    // defaultMode: 'classic',
    // menus: ['base'],
    importWord: {
      enabled: true,
      maxSize: 1024 * 1024 * 100,
      // async onCustomImportMethod() {
      //   return await Promise.resolve({
      //     value: '<p>Test import word</p>',
      //   })
      // },
    },
  },
  document: {
    title: '',
    content: localStorage.getItem('document.content') ?? '',
    characterLimit: 100000,
  },
  page: {
    showBookmark: true,

  },
  templates,
  cdnUrl: '',
  shareUrl: 'MyWord',
  file: {
    allowedMimeTypes: [
      'application/pdf',
      'image/svg+xml',
      'video/mp4',
      'audio/*',
    ],
  },
  ai: {
    assistant: {
      enabled: true,
      async onMessage() {
        return await Promise.resolve('<p>AI assistant test</p>')
      },
    },
  },
  user: {
    id: 'admin',
    label: 'Arslan',
    avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
  },
  users: [
    { id: 'admin', label: 'Arslan' },
  ],
  async onSave(content: string, page: number, document: { content: string }) {
    localStorage.setItem('document.content', document.content)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = true
        if (success) {
          console.log('onSave', { content, page, document })
          resolve('Save successful')
        } else {
          reject(new Error('Save failed'))
        }
      }, 2000)
    })
  },
  async onFileUpload(file: File & { url?: string }) {
    if (!file) {
      throw new Error('No file found to upload')
    }
    console.log('onUpload', file)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    return {
      id: shortId(),
      url: file.url ?? URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size,
    }
  },
  onFileDelete(id: string, url: string) {
    console.log(id, url)
  },
})
</script>

<style>
html,
body {
  padding: 0;
  margin: 0;
}

html,
body {
  height: 100vh;
  overflow: hidden;
}
</style>
