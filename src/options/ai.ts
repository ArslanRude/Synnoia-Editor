import type { AssistantOptions } from '@/types'

export const defaultAiOptions: {
  assistant: AssistantOptions
} = {
  assistant: {
    enabled: false,
    maxlength: 100,
    commands: [
      {
        label: 'Continuation',
        value: 'Continuation',
      },
      {
        label: 'Rewrite',
        value: 'Rewrite',
      },
      {
        label: 'Abbreviation',
        value: 'Abbreviation',
      },
      {
        label: 'Expansion',
        value: 'Expansion',
      },
      {
        label: 'Polish',
        value: 'Polish',
      },
      {
        label: 'Proofread',
        value: 'Proofread',
      },
      {
        label: 'Translate',
        value: 'Translate to Chinese',
        autoSend: false,
      },
    ],
    async onMessage() {
      return await new Promise((_, reject) => {
        reject(
          new Error(
            'Key "ai": Key "assistant": Key "onMessage": Please set the onMessage method',
          ),
        )
      })
    },
  },
}
