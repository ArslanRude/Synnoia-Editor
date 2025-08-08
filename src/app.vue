<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Navbar - fixed height -->
    <div class="flex-shrink-0">
      <Nav />
    </div>
    <!-- Editor content - takes remaining space -->
    <div class="flex-1 min-h-0">
      <UmoEditorComponent ref="editorRef" v-bind="options" />
    </div>

    <!-- <div class="box">
      <UmoEditorComponent editor-key="testaaa" :toolbar="{ defaultMode: 'classic' }" />
    </div> -->
  </div>
</template>

<script setup lang="ts">
import UmoEditorComponent from '@/components/index.vue'
import Nav from '@/components/navbar/nav.vue'
import { shortId } from '@/utils/short-id'

const editorRef = $ref(null)
const templates = [
  {
    title: 'Work Task',
    description: 'Work Task Template',
    content:
      '<h1>Work Task</h1><h3>Task Name:</h3><p>[Task description]</p><h3>Responsible Person:</h3><p>[The person who executes the task]</p><h3>Deadline:</h3><p>[The date when the task needs to be completed]</p><h3>Task Details:</h3><ol><li>[Task step 1]</li><li>[Task step 2]</li><li>[Task step 3]...</li></ol><h3>Goal:</h3><p>[The specific goal or result that the task needs to achieve]</p><h3>Notes:</h3><p>[Any additional information or注意事项]</p>',
  },
  {
    title: 'Work Week Report',
    description: 'Work Week Report Template',
    content:
      '<h1>Work Week Report</h1><h2>Weekly Work Summary</h2><hr /><h3>Completed Work:</h3><ul><li>[Task 1 Name]: [Brief description of the task content and completion status]</li><li>[Task 2 Name]: [Brief description of the task content and completion status]</li><li>...</li></ul><h3>Working on:</h3><ul><li>[Task 1 Name]: [Brief description of the task current progress and next plan]</li><li>[Task 2 Name]: [Brief description of the task current progress and next plan]</li><li>...</li></ul><h3>Issues and Challenges:</h3><ul><li>[Issue 1]: [Describe the problem encountered and the current solution or support needed]</li><li>[Issue 2]: [Describe the problem encountered and the current solution or support needed]</li><li>...</li></ul><hr /><h2>Next Week Work Plan</h2><h3>Planned Work:</h3><ul><li>[Task 1 Name]: [Brief description of the task content to be started next week]</li><li>[Task 2 Name]: [Brief description of the task content to be started next week]</li><li>...</li></ul><h3>Resources Needed:</h3><ul><li>[Resource 1]: [Describe the resources needed or support]</li><li>[Resource 2]: [Describe the resources needed or support]</li><li>...</li></ul>',
  },
]
const options = $ref({
  toolbar: {
    // defaultMode: 'classic',
    // menus: ['base'],
    importWord: {
      enabled: true,
      // async onCustomImportMethod() {
      //   return await Promise.resolve({
      //     value: '<p>测试导入word</p>',
      //   })
      // },
    },
  },
  document: {
    title: 'Test Document',
    content: localStorage.getItem('document.content') ?? '<p>Test Document</p>',
    characterLimit: 10000,
  },
  page: {
    showBookmark: true,
  },
  templates,
  cdnUrl: 'https://cdn.umodoc.com',
  shareUrl: 'https://umodoc.com',
  file: {
    // allowedMimeTypes: [
    //   'application/pdf',
    //   'image/svg+xml',
    //   'video/mp4',
    //   'audio/*',
    // ],
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
    id: 'umoeditor',
    label: 'Umo Editor',
    avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
  },
  users: [
    { id: 'umodoc', label: 'Umo Team' },
    { id: 'Cassielxd', label: 'Cassielxd' },
    { id: 'Goldziher', label: "Na'aman Hirschfeld" },
    { id: 'SerRashin', label: 'SerRashin' },
    { id: 'ChenErik', label: 'ChenErik' },
    { id: 'china-wangxu', label: 'china-wangxu' },
    { id: 'Sherman Xu', label: 'xuzhenjun130' },
    { id: 'testuser', label: 'Test User' },
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
