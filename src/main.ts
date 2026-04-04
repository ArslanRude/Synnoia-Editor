import type { ArslanEditorOptions } from '@/types'

import App from './app.vue'
import { useArslanEditor } from './components'
const app = createApp(App)

const options = {}

app.use(useArslanEditor, options as ArslanEditorOptions)

app.mount('#app')
