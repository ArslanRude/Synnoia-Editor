import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

import { WEBSOCKET_CONFIG } from '../../config/websocket'
import { getSuggestion } from './suggestion'

export interface CompletionOptions {
  suggestion: (prefixText: string, suffixText: string) => Promise<string>
}

export const completionPluginKey = new PluginKey('completion')

export const Completion = Extension.create<CompletionOptions>({
  name: 'completion',

  addOptions() {
    return {
      suggestion: getSuggestion,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: completionPluginKey,
        state: {
          init() {
            return {
              decoration: DecorationSet.empty,
              suggestion: '',
            }
          },
          apply: (tr, prev, oldState, newState) => {
            const meta = tr.getMeta('completion')
            if (meta) {
              return meta
            }
            // If doc changed but no meta, likely a typing event, keep old decoration until update logic clears it
            // or better, clear it on any doc change to avoid displacement, then async update brings it back
            if (tr.docChanged || tr.selectionSet) {
              return { decoration: DecorationSet.empty, suggestion: '' }
            }
            return prev
          },
        },
        props: {
          decorations(state) {
            return completionPluginKey.getState(state)?.decoration
          },
          handleKeyDown(view, event) {
            if (event.key === 'Tab') {
              const pluginState = completionPluginKey.getState(view.state)
              if (pluginState?.suggestion) {
                // Insert text and ensure no marks (like color) are inherited
                view.dispatch(
                  view.state.tr
                    .insertText(pluginState.suggestion)
                    .setStoredMarks([]),
                )
                return true
              }
            }

            if (
              event.key === 'ArrowRight' &&
              (event.ctrlKey || event.metaKey)
            ) {
              const pluginState = completionPluginKey.getState(view.state)
              if (pluginState?.suggestion) {
                const { suggestion } = pluginState
                // Match the next word (including leading whitespace)
                const match = suggestion.match(/^(\s*\S+)/)
                if (match) {
                  const [, part] = match
                  const remainder = suggestion.slice(part.length)

                  const tr = view.state.tr.insertText(part).setStoredMarks([])

                  if (remainder.length > 0) {
                    const el = document.createElement('span')
                    el.textContent = remainder
                    el.classList.add('completion-ghost-text')
                    // The selection is updated by insertText, so we use the new position
                    const deco = Decoration.widget(tr.selection.from, el, {
                      side: 1,
                    })

                    tr.setMeta('completion', {
                      decoration: DecorationSet.create(tr.doc, [deco]),
                      suggestion: remainder,
                    })
                  } else {
                    tr.setMeta('completion', {
                      decoration: DecorationSet.empty,
                      suggestion: '',
                    })
                  }

                  view.dispatch(tr)
                  return true
                }
              }
            }

            if (event.key === 'Escape') {
              const pluginState = completionPluginKey.getState(view.state)
              if (pluginState?.suggestion) {
                const tr = view.state.tr.setMeta('completion', {
                  decoration: DecorationSet.empty,
                  suggestion: '',
                })
                view.dispatch(tr)
                return true
              }
            }
            return false
          },
        },

        view(editorView) {
          let timer: ReturnType<typeof setTimeout> | null = null

          return {
            update: (view, prevState) => {
              const pluginState = completionPluginKey.getState(view.state)
              // If there is an active suggestion (including partial remainder), do NOT fetch new one
              // Wait until user accepts fully or cancels/types something else (which clears state via apply)
              if (pluginState?.suggestion) {
                return
              }

              const prevText = prevState.doc.textBetween(
                Math.max(
                  0,
                  prevState.selection.from -
                    WEBSOCKET_CONFIG.PREFIX_CONTEXT_LENGTH,
                ),
                prevState.selection.from,
                '\n',
                '\n',
              )
              const currText = view.state.doc.textBetween(
                Math.max(
                  0,
                  view.state.selection.from -
                    WEBSOCKET_CONFIG.PREFIX_CONTEXT_LENGTH,
                ),
                view.state.selection.from,
                '\n',
                '\n',
              )

              // Get suffix text (text after cursor)
              const suffixText = view.state.doc.textBetween(
                view.state.selection.from,
                Math.min(
                  view.state.doc.content.size,
                  view.state.selection.from +
                    WEBSOCKET_CONFIG.SUFFIX_CONTEXT_LENGTH,
                ),
                '\n',
                '\n',
              )

              // Simple check to avoid unnecessary calls
              if (
                prevText === currText &&
                prevState.selection.eq(view.state.selection)
              )
                return

              // Clear previous timer
              if (timer) {
                clearTimeout(timer)
                timer = null
              }

              // Debounce suggestion fetching
              timer = setTimeout(() => {
                // Access options from the extension instance if possible, or directly use the imported function for simplicity in this artifact
                // In a real extension, we'd capture `this.options` from the `addProseMirrorPlugins` scope
                const suggestionPromise = this.options?.suggestion
                  ? this.options.suggestion(currText, suffixText)
                  : getSuggestion(currText, suffixText)

                suggestionPromise.then((suggestion) => {
                  // Check if state is still valid/relevant? usage of 'view' here is a closure, valid.
                  if (!suggestion) {
                    const tr = view.state.tr.setMeta('completion', {
                      decoration: DecorationSet.empty,
                      suggestion: '',
                    })
                    view.dispatch(tr)
                    return
                  }

                  const el = document.createElement('span')
                  el.textContent = suggestion
                  el.classList.add('completion-ghost-text')

                  const deco = Decoration.widget(
                    view.state.selection.from,
                    el,
                    {
                      side: 1,
                    },
                  )
                  const tr = view.state.tr.setMeta('completion', {
                    decoration: DecorationSet.create(view.state.doc, [deco]),
                    suggestion,
                  })
                  view.dispatch(tr)
                })
              }, WEBSOCKET_CONFIG.DEBOUNCE_DELAY)
            },
            destroy() {
              if (timer) {
                clearTimeout(timer)
              }
            },
          }
        },
      }),
    ]
  },
})
