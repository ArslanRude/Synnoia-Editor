import { Mark, mergeAttributes } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'

import { shortId } from '@/utils/short-id'

export interface BookmarkOptions {
  /**
   * Style with brackets {}
   * @default arslan-editor-bookmark
   * @example
   */
  class: string | undefined
  /**
   * Bookmark name
   * @default Cannot be empty, unique identifier for positioning, deletion and other operations
   * @example true
   */
  bookmarkName: string | undefined
}
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bookmark: {
      /**
       * Set a bookmark
       * @param attributes
       * @example
       */
      setBookmark: (attributes: {
        bookmarkName: string | undefined
      }) => ReturnType
      /*
       * Focus bookmark
       */
      focusBookmark: (bookmarkName: string | undefined) => ReturnType
      /*
       * Get all bookmarks
       */
      getAllBookmarks: (callback: (bookmarks: any[]) => void) => ReturnType
    }
  }
}
// Bookmark format - create a bookmark
export default Mark.create<BookmarkOptions>({
  name: 'bookmark',
  priority: 1000,
  keepOnSplit: false,
  exitable: true,
  addOptions() {
    return {
      bookmarkName: '',
      class: 'arslan-editor-bookmark',
    }
  },
  addAttributes() {
    return {
      bookmarkName: {
        default: 'bookmarkName',
      },
      class: {
        default: this.options.class ?? undefined,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'bookmark',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['bookmark', mergeAttributes(this.options, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      // Set bookmark - if bookmark has selected area data, otherwise default value is bookmark name
      setBookmark:
        (attributes) =>
        ({ chain, editor }) => {
          try {
            chain().setMark(this.name, attributes).run()
            const { empty } = editor.state.selection
            if (empty && attributes.bookmarkName) {
              chain().focus().insertContent(attributes.bookmarkName).run()
            }
            return true
          } catch (e) {
            return false
          }
        },
      focusBookmark:
        (bookmarkName) =>
        ({ editor, tr }) => {
          if (bookmarkName) {
            const element = editor.view.dom.querySelector(
              `bookmark[bookmarkName="${bookmarkName}"]`,
            )
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
              })
              const pos = editor.view.posAtDOM(element, 0)
              if (tr) {
                tr.setSelection(new TextSelection(tr.doc.resolve(pos ?? 0)))
                editor.view.dispatch(tr)
                editor.view.focus()
              }
            }
            return true
          } else return false
        },
      getAllBookmarks:
        (callback) =>
        ({ editor }) => {
          const bookmarkData: any[] = []
          try {
            const alltext = editor.getHTML()
            const parser = new DOMParser()
            const doc = parser.parseFromString(alltext, 'text/html')
            // Get all <bookmark> elements
            const bookmarks = doc.body.querySelectorAll(this.name)
            const keyNode: string[] = []
            Array.from(bookmarks).forEach((node) => {
              if (node !== null) {
                const bookName = node.getAttribute('bookmarkName')
                if (bookName && !keyNode.includes(bookName)) {
                  keyNode.push(bookName)
                  bookmarkData.push({
                    bookmarkRowId: shortId(),
                    bookmarkRowName: bookName,
                  })
                }
              }
            })
          } catch (e) {}
          callback(bookmarkData)
          return true
        },
    }
  },
})
