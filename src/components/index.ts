import 'virtual:svg-icons-register'

import type { ArslanEditorOptions } from '@/types'

import ArslanEditor from './index.vue'
import ArslanMenuButton from './menus/button.vue'
import ArslanDialog from './modal.vue'
import ArslanTooltip from './tooltip.vue'
const useArslanEditor = {
  install: (app: any, options: ArslanEditorOptions) => {
    app.provide('defaultOptions', options)
    app.component(ArslanEditor.name ?? 'ArslanEditor', ArslanEditor)
  },
}

export default ArslanEditor
export {
  ArslanDialog,
  ArslanEditor,
  ArslanMenuButton,
  ArslanTooltip,
  useArslanEditor,
}
