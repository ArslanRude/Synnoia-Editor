<template>
    <div class="agent-panel" :class="{ 'panel-open': props.isOpen, 'resizing': isResizing }"
        :style="{ width: props.isOpen ? `${props.width}px` : '0px' }">
        <!-- Resize Handle -->
        <div v-if="props.isOpen" class="resize-handle" @mousedown="startResize">
            <div class="resize-handle-line"></div>
        </div>

        <!-- Panel Content -->
        <div class="panel-content">
            <!-- Header -->
            <div class="panel-header">
                <div class="header-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h2>AI Assistant</h2>
                </div>
                <button class="clear-btn" @click="clearMessages" title="Clear conversation">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>

            <!-- Messages Area -->
            <div class="messages-container" ref="messagesContainer">
                <div v-if="messages.length === 0" class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>Start a conversation with the AI assistant</p>
                </div>

                <div v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
                    <div class="message-avatar">
                        <span v-if="message.role === 'user'">👤</span>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <div class="message-content">
                        <div class="message-text">{{ message.content }}</div>
                        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                    </div>
                </div>

                <div v-if="isTyping" class="message assistant typing-indicator">
                    <div class="message-avatar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <div class="message-content">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Input Area -->
            <div class="input-container">
                <textarea v-model="inputMessage" @input="resizeTextarea" @keydown.enter.exact.prevent="sendMessage"
                    @keydown.enter.shift.exact="handleShiftEnter" placeholder="Ask me anything..." rows="1"
                    ref="inputArea"></textarea>
                <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || isTyping">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface Props {
    isOpen?: boolean
    width?: number
}

const props = withDefaults(defineProps<Props>(), {
    isOpen: false,
    width: 400
})

const emit = defineEmits<{
    'update:isOpen': [value: boolean]
    'update:width': [value: number]
}>()

let inputMessage = $ref('')
let messages = $ref<Message[]>([])
let isTyping = $ref(false)
let messagesContainer = $ref<HTMLElement | null>(null)
let inputArea = $ref<HTMLTextAreaElement | null>(null)
let isResizing = $ref(false)

// Watch for panel opening to focus input
$: if (props.isOpen) {
    setTimeout(() => {
        inputArea?.focus()
    }, 350)
}

// Auto-resize textarea
const resizeTextarea = () => {
    if (!inputArea) return
    inputArea.style.height = 'auto'
    inputArea.style.height = inputArea.scrollHeight + 'px'
}

// Watch input changes to resize
$: if (inputMessage !== undefined) {
    setTimeout(resizeTextarea, 0)
}

const sendMessage = async () => {
    const content = inputMessage.trim()
    if (!content || isTyping) return

    // Add user message
    messages.push({
        role: 'user',
        content,
        timestamp: new Date()
    })

    inputMessage = ''
    // Reset textarea height after sending
    setTimeout(() => {
        if (inputArea) {
            inputArea.style.height = 'auto'
        }
    }, 0)
    scrollToBottom()

    // Simulate AI response
    isTyping = true

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

    isTyping = false

    // Add assistant response
    messages.push({
        role: 'assistant',
        content: `I received your message: "${content}". This is a demo response. In a real implementation, this would connect to your AI backend.`,
        timestamp: new Date()
    })

    scrollToBottom()
}

const handleShiftEnter = (e: KeyboardEvent) => {
    // Allow default behavior for Shift+Enter (new line)
}

const clearMessages = () => {
    if (confirm('Clear all messages?')) {
        messages = []
    }
}

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const scrollToBottom = () => {
    setTimeout(() => {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
    }, 50)
}

// Resize functionality
const startResize = (e: MouseEvent) => {
    e.preventDefault()
    isResizing = true

    const startX = e.clientX
    const startWidth = props.width

    const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return

        // Calculate new width (dragging left increases width, right decreases)
        const deltaX = startX - e.clientX
        // Min width: 350px to show all content properly, Max: 1000px or 60% of window width
        const maxWidth = Math.min(1000, window.innerWidth * 0.6)
        const newWidth = Math.max(350, Math.min(maxWidth, startWidth + deltaX))

        emit('update:width', newWidth)
    }

    const onMouseUp = () => {
        isResizing = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
}

// Keyboard shortcut: Ctrl+Shift+P
const handleKeyboard = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        emit('update:isOpen', !props.isOpen)
    }
}

// Setup event listener
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyboard)
}
</script>

<style scoped lang="less">
.agent-panel {
    height: 100%;
    @apply bg-secondary-light dark:bg-secondary-dark border-l border-gray-300 dark:border-gray-700;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    transition: width 0.3s ease;

    &.resizing {
        transition: none;
    }
}

.resize-handle {
    width: 8px;
    height: 100%;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
    user-select: none;

    &:hover .resize-handle-line,
    &:active .resize-handle-line {
        opacity: 1;
    }

    &:hover .resize-handle-line {
        background: #667eea;
        width: 3px;
    }

    &:active .resize-handle-line {
        background: #764ba2;
    }
}

.resize-handle-line {
    width: 2px;
    height: 40px;
    @apply bg-gray-400 dark:bg-gray-600;
    border-radius: 1px;
    transition: all 0.2s ease;
    opacity: 0.6;
}

.panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-left: 8px;
    min-width: 0;
}

.panel-header {
    padding: 16px 20px;
    @apply border-b border-gray-300 dark:border-gray-700 bg-highlight-light dark:bg-highlight-dark;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    @apply text-text-light dark:text-text-dark;
    min-width: 0;

    svg {
        color: #667eea;
        flex-shrink: 0;
    }

    h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .width-debug {
        font-size: 11px;
        color: #667eea;
        font-family: monospace;
        margin-left: 8px;
        background: rgba(102, 126, 234, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        flex-shrink: 0;
    }
}

.clear-btn {
    background: transparent;
    border: none;
    @apply text-gray-500 dark:text-gray-400;
    cursor: pointer;
    padding: 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        @apply bg-secondary-light dark:bg-secondary-dark text-text-light dark:text-text-dark;
    }
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        @apply bg-secondary-light dark:bg-secondary-dark;
    }

    &::-webkit-scrollbar-thumb {
        @apply bg-gray-300 dark:bg-gray-600;
        border-radius: 3px;

        &:hover {
            @apply bg-gray-400 dark:bg-gray-500;
        }
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    @apply text-gray-400 dark:text-gray-600;
    text-align: center;
    gap: 16px;

    svg {
        opacity: 0.5;
    }

    p {
        margin: 0;
        font-size: 14px;
        max-width: 200px;
    }
}

.message {
    display: flex;
    gap: 12px;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
}

.message.user .message-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message.assistant .message-avatar {
    @apply bg-highlight-light dark:bg-highlight-dark;
    color: #667eea;
}

.message-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    overflow-wrap: break-word;
}

.message-text {
    @apply bg-highlight-light dark:bg-highlight-dark;
    padding: 12px 16px;
    border-radius: 12px;
    @apply text-text-light dark:text-text-dark;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
}

.message.user .message-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
}

.message-time {
    font-size: 11px;
    @apply text-gray-400 dark:text-gray-600;
    padding: 0 4px;
}

.typing-indicator {
    .typing-dots {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        @apply bg-highlight-light dark:bg-highlight-dark;
        border-radius: 12px;
        width: fit-content;

        span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #667eea;
            animation: typingDot 1.4s infinite;

            &:nth-child(2) {
                animation-delay: 0.2s;
            }

            &:nth-child(3) {
                animation-delay: 0.4s;
            }
        }
    }
}

@keyframes typingDot {

    0%,
    60%,
    100% {
        opacity: 0.3;
        transform: scale(0.8);
    }

    30% {
        opacity: 1;
        transform: scale(1);
    }
}

.input-container {
    padding: 16px 20px;
    @apply border-t border-gray-300 dark:border-gray-700 bg-highlight-light dark:bg-highlight-dark;
    display: flex;
    gap: 12px;
    align-items: flex-end;
    flex-shrink: 0;
    min-width: 0;
}

textarea {
    flex: 1;
    @apply bg-secondary-light dark:bg-secondary-dark border border-gray-300 dark:border-gray-700;
    border-radius: 8px;
    padding: 12px;
    @apply text-text-light dark:text-text-dark;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    overflow: hidden;
    max-height: 120px;
    min-height: 42px;
    min-width: 0;
    outline: none;
    transition: border-color 0.2s ease;

    &:focus {
        border-color: #667eea;
    }

    &::placeholder {
        @apply text-gray-400 dark:text-gray-600;
    }
}

.send-btn {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}
</style>