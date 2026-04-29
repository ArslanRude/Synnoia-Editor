// Global reactive state for document name
const documentName = ref('')

export function useDocument() {
  const setDocumentName = (name: string) => {
    documentName.value = name
  }

  const getDocumentName = () => {
    return documentName.value
  }

  return {
    documentName,
    setDocumentName,
    getDocumentName,
  }
}
