<template>
  <menus-button
    text="Ask Synnoia"
    tooltip="Ask Synnoia AI"
    @menu-click="openAgentWithSelection"
  >
    <img src="/src/assets/logo/Synnoia Logo.svg" alt="Synnoia" class="synnoia-logo" />
  </menus-button>
</template>

<script setup lang="ts">
const editor = inject('editor')
const options = inject('options')


const openAgentWithSelection = () => {
  if (!editor.value) return

  // Get selected text
  const { selection } = editor.value.state
  const hasSelection = !selection.empty
  const selectionText = hasSelection
    ? editor.value.state.doc.textBetween(selection.from, selection.to)
    : ''

  // Emit event to open sidebar with selection
  if (options.value?.onOpenAgentSidebar) {
    options.value.onOpenAgentSidebar(selectionText)
  }

  // Also emit a custom event that can be caught by the parent
  const event = new CustomEvent('synnoia:open-agent', {
    detail: { selectionText },
    bubbles: true,
  })
  window.dispatchEvent(event)

  // Focus editor
  editor.value?.commands.focus()
}
</script>

<style lang="less" scoped>
.synnoia-logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
</style>
