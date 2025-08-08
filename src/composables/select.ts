// To solve the Bug of tdesign-vue-next select component, use delay rendering to avoid

export function useSelect() {
  const selectVisible = ref<boolean>(false)

  onMounted(() => {
    selectVisible.value = true
  })

  return { selectVisible }
}
