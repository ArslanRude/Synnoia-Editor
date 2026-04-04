import { Mark, mergeAttributes } from '@tiptap/core'

/**
 * Extension for text added by the AI agent.
 * Renders with a green background.
 */
export const DiffAdded = Mark.create({
  name: 'diffAdded',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'arslan-diff-added',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.arslan-diff-added',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
  },
})

/**
 * Extension for text removed by the AI agent.
 * Renders with a red background and strikethrough.
 * The text becomes uneditable so the user doesn't accidentally change deleted text.
 */
export const DiffRemoved = Mark.create({
  name: 'diffRemoved',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'arslan-diff-removed',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.arslan-diff-removed',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
  },
})
