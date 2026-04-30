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
                <div class="header-main">
                    <div class="header-title">
                        <div class="agent-avatar">
                            <img src="/src/assets/logo/Synnoia Logo.png" alt="Synnoia Logo">
                        </div>
                        <div class="brand">
                            <h2>Synnoia</h2>
                        </div>
                    </div>
                    <div class="header-actions">
                        <!-- Status Pill -->
                        <span class="status-pill" :class="`status-pill--${agent.status.value}`" title="Agent Status">
                            <span class="status-dot"></span>
                            {{ statusLabel }}
                        </span>
                        <!-- Undo -->
                        <button class="icon-btn" :disabled="!agent.canUndo.value" @click="handleUndo"
                            title="Undo change">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                            </svg>
                        </button>
                        <!-- Clear -->
                        <button class="icon-btn" @click="handleClear" title="Clear chat">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M3 6h18"></path>
                                <path
                                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                                </path>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Segmented Tabs -->
                <div class="tabs-segmented">
                    <button class="tab-segment" :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">
                        Chat
                    </button>
                    <button class="tab-segment" :class="{ active: activeTab === 'chatHistory' }"
                        @click="activeTab = 'chatHistory'">
                        Sessions
                    </button>
                </div>
            </div>

            <!-- Chat Tab -->
            <template v-if="activeTab === 'chat'">
                <!-- Messages Area -->
                <div class="messages-container" ref="messagesContainer">
                    <div v-if="agent.messages.value.length === 0" class="empty-state">
                        <div class="empty-logo">
                            <img src="/src/assets/logo/Synnoia Logo Black.png" alt="Synnoia">
                        </div>
                        <p>Ask Synnoia anything...</p>
                    </div>

                    <div v-for="message in agent.messages.value" :key="message.id" class="message"
                        :class="[message.role, message.status]">
                        <div class="message-avatar">
                            <img v-if="message.role === 'user'" src="/src/assets/icons/user.svg" alt="">
                            <img v-else-if="message.role === 'system'" width="18" height="18" src="/src/assets/logo/Synnoia Logo.png" alt="">
                            <img v-else width="16" height="16" src="/src/assets/logo/Synnoia Logo White.png"
                                alt="Synnoia Logo">
                        </div>
                        <div class="message-content">
                            <div class="message-text" :class="{ 'message-error': message.status === 'error' }">
                                {{ message.content }}
                                <span v-if="message.status === 'streaming'" class="streaming-cursor">▊</span>
                            </div>

                            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                        </div>
                    </div>

                    <!-- Thinking indicator -->
                    <div v-if="agent.status.value === 'thinking'" class="message assistant typing-indicator">
                        <div class="message-avatar">
                            <img width="16" height="16" src="/src/assets/logo/Synnoia Logo White.png"
                                alt="Synnoia Logo">
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

                <!-- Accept/Reject Bar -->
                <div v-if="agent.status.value === 'awaiting-confirmation'" class="confirmation-bar">
                    <div class="confirmation-label">Review proposed changes</div>
                    <div class="confirmation-actions">
                        <button class="confirm-btn confirm-btn--accept" @click="handleAccept">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Accept
                        </button>
                        <button class="confirm-btn confirm-btn--reject" @click="handleReject">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Reject
                        </button>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="input-container">
                    <div class="input-wrapper">
                        <select v-model="selectedModel" class="model-select" title="Choose LLM Model">
                            <option value="gpt-4o">GPT-4o</option>
                            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                            <option value="gemini-1-5-pro">Gemini 1.5 Pro</option>
                        </select>
                        <div class="textarea-wrapper">
                            <textarea v-model="inputMessage" @input="resizeTextarea"
                                @keydown.enter.exact.prevent="handleSend" :placeholder="inputPlaceholder" rows="1"
                                :disabled="agent.status.value === 'thinking'" ref="inputArea"></textarea>
                            <button class="send-btn" @click="handleSend"
                                :disabled="!inputMessage.trim() || agent.status.value === 'thinking'">
                                <svg v-if="agent.status.value !== 'thinking'" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" class="spin">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Chat History Tab -->
            <template v-if="activeTab === 'chatHistory'">
                <div class="chat-history-container">
                    <div class="empty-state">
                        <div class="empty-logo">
                            <img src="/src/assets/logo/Synnoia Logo Black.png" alt="Synnoia">
                        </div>
                        <p>No chat history available</p>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

import { useAgent, sendMockAgentRequest } from '@/ai/agent'
import { useDocument } from '@/composables/useDocument'

interface Props {
    isOpen?: boolean
    width?: number
    editor?: { value: Editor | null } | null
}

const props = withDefaults(defineProps<Props>(), {
    isOpen: false,
    width: 400,
    editor: null,
})

const emit = defineEmits<{
    'update:isOpen': [value: boolean]
    'update:width': [value: number]
}>()

// Agent composable
const agent = useAgent()

// Document composable
const { documentName } = useDocument()

// Local UI state
let selectedModel = $ref('gpt-4o')
let inputMessage = $ref('')
let activeTab = $ref<'chat' | 'chatHistory'>('chat')
let messagesContainer = $ref<HTMLElement | null>(null)
let inputArea = $ref<HTMLTextAreaElement | null>(null)
let isResizing = $ref(false)

// Computed
const statusLabel = $computed(() => {
    const labels: Record<string, string> = {
        'idle': 'Ready',
        'thinking': 'Thinking...',
        'proposing': 'Proposing',
        'awaiting-confirmation': 'Review Changes',
        'applied': 'Applied ',
        'rejected': 'Rejected',
    }
    return labels[agent.status.value] || agent.status.value
})

const inputPlaceholder = $computed(() => {
    if (agent.status.value === 'thinking') return 'Agent is thinking...'
    if (agent.status.value === 'awaiting-confirmation') return 'Review the changes above first...'
    return 'Tell the agent what to change...'
})

// Watch for panel opening to focus input and handle initial selection
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

$: if (inputMessage !== undefined) {
    setTimeout(resizeTextarea, 0)
}

// Scroll to bottom of messages
const scrollToBottom = () => {
    setTimeout(() => {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
    }, 50)
}

// Watch messages for auto-scroll
watch(
    () => agent.messages.value.length,
    () => scrollToBottom(),
)

// --- Actions ---

const handleSend = async () => {
    const content = inputMessage.trim()
    if (!content || agent.status.value === 'thinking') return
    if (!props.editor?.value) {
        console.error('Editor not available')
        return
    }

    inputMessage = ''
    setTimeout(() => {
        if (inputArea) inputArea.style.height = 'auto'
    }, 0)

    // Use mock service for development
    await agent.sendPrompt(props.editor.value, content, sendMockAgentRequest, selectedModel, documentName.value)
    scrollToBottom()
}

const handleAccept = () => {
    if (!props.editor?.value) return
    agent.acceptChanges(props.editor.value)
    scrollToBottom()
}

const handleReject = () => {
    if (!props.editor?.value) return
    agent.rejectChanges(props.editor.value)
    scrollToBottom()
}

const handleUndo = () => {
    if (!props.editor?.value) return
    agent.undoLastChange(props.editor.value)
}

const handleClear = () => {
    agent.clearMessages()
}

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// --- Resize ---
const startResize = (e: MouseEvent) => {
    e.preventDefault()
    isResizing = true

    const startX = e.clientX
    const startWidth = props.width

    const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return
        const deltaX = startX - e.clientX
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

if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyboard)
}
</script>

<style scoped lang="less">
.agent-panel {
    height: 100%;
    @apply bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.03);

    &.resizing {
        transition: none;
    }
}

.resize-handle {
    width: 6px;
    height: 100%;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    position: absolute;
    left: -3px;
    top: 0;
    z-index: 20;
    user-select: none;

    &:hover .resize-handle-line,
    &:active .resize-handle-line {
        opacity: 1;
        background: #6366f1;
        width: 4px;
    }
}

.resize-handle-line {
    width: 2px;
    height: 32px;
    @apply bg-gray-300 dark:bg-gray-600;
    border-radius: 2px;
    transition: all 0.2s ease;
    opacity: 0;
}

.panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fafafc;
    @apply dark:bg-gray-950;
}

// --- Header ---
.panel-header {
    display: flex;
    flex-direction: column;
    padding: 16px 20px 0;
    @apply bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800;
    flex-shrink: 0;
    gap: 16px;
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.agent-avatar {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.brand h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
    @apply text-gray-900 dark:text-gray-100;
}

.tagline {
    font-size: 11px;
    font-weight: 500;
    @apply text-gray-400 dark:text-gray-500;
    letter-spacing: 0.02em;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

// --- Status Pill ---
.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    letter-spacing: 0.02em;

    &--idle {
        @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300;
    }

    &--thinking {
        background: rgba(99, 102, 241, 0.1);
        color: #6366f1;
    }

    &--proposing,
    &--awaiting-confirmation {
        background: rgba(245, 158, 11, 0.1);
        color: #d97706;
    }

    &--applied {
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
    }

    &--rejected {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
    }
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;

    .status-pill--thinking & {
        animation: pulse 1.5s infinite ease-in-out;
    }
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.4;
        transform: scale(0.85);
    }
}

// --- Header Icons ---
.icon-btn {
    background: transparent;
    border: none;
    @apply text-gray-400 dark:text-gray-500;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        @apply bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300;
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
}

// --- Segmented Tabs ---
.tabs-segmented {
    display: flex;
    background: #f1f5f9;
    @apply dark:bg-gray-800;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 12px;
}

.tab-segment {
    flex: 1;
    background: transparent;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    @apply dark:text-gray-400;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    position: relative;

    &:hover {
        color: #0f172a;
        @apply dark:text-gray-200;
    }

    &.active {
        background: white;
        @apply dark:bg-gray-700;
        color: #0f172a;
        @apply dark:text-gray-100;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
}

// --- Messages Area ---
.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        @apply bg-gray-200 dark:bg-gray-700;
        border-radius: 4px;
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    @apply text-gray-400 dark:text-gray-500;
    text-align: center;
    gap: 20px;
}

.empty-logo {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
}

.empty-state p {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    @apply text-gray-500 dark:text-gray-400;
}

.message {
    display: flex;
    gap: 12px;
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 13px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.message.user .message-avatar {
    @apply bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300;
    border: 1px solid #e2e8f0;
    @apply dark:border-gray-700;
    background: transparent;
}

.message.assistant .message-avatar {
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    color: white;
}

.message.system .message-avatar {
    @apply bg-gray-100 dark:bg-gray-800 text-gray-500;
}

.message-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.message-text {
    @apply bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700;
    background: #e8eaee;
    padding: 12px 16px;
    border-radius: 12px;
    border-top-left-radius: 4px;
    @apply text-gray-800 dark:text-gray-200;
    font-size: 13.5px;
    line-height: 1.6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

    &.message-error {
        border-color: #fca5a5;
        @apply dark:border-red-900;
        background: #fef2f2;
        @apply dark:bg-red-950/30;
        color: #b91c1c;
        @apply dark:text-red-400;
    }
}

.message.user .message-text {
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 12px;
    border-top-right-radius: 4px;
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.2);
}

.message.user {
    flex-direction: row-reverse;
}

.message.user .message-content {
    align-items: flex-end;
}

.message.system .message-text {
    background: rgb(174, 200, 238);
    border: none;
    box-shadow: none;
    padding: 8px 8px;
    font-size: 12px;
    @apply text-gray-500;
    font-style: italic;
}

.streaming-cursor {
    animation: blink 1s steps(1) infinite;
    color: #6366f1;
}

@keyframes blink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0;
    }
}

.message-time {
    font-size: 11px;
    @apply text-gray-400;
    padding: 0 4px;
    margin-top: 2px;
}

// --- Typing Indicator ---
.typing-dots {
    display: flex;
    gap: 4px;
    padding: 14px 16px;
    @apply bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700;
    border-radius: 12px;
    border-top-left-radius: 4px;
    width: fit-content;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

    span {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #6366f1;
        animation: typingDot 1.4s infinite ease-in-out both;

        &:nth-child(1) {
            animation-delay: -0.32s;
        }

        &:nth-child(2) {
            animation-delay: -0.16s;
        }
    }
}

// --- Confirmation Bar ---
.confirmation-bar {
    padding: 14px 20px;
    background: #fffbeb;
    @apply dark:bg-yellow-900/20 border-t border-yellow-100 dark:border-yellow-900/30;
    flex-shrink: 0;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.02);
}

.confirmation-label {
    font-size: 12px;
    font-weight: 600;
    color: #b45309;
    @apply dark:text-yellow-500;
    margin-bottom: 10px;
}

.confirmation-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.confirm-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &--accept {
        background: #10b981;
        color: white;
        box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);

        &:hover {
            background: #059669;
            transform: translateY(-1px);
        }
    }

    &--reject {
        background: #ef4444;
        color: white;
        box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);

        &:hover {
            background: #dc2626;
            transform: translateY(-1px);
        }
    }
}

// --- Input Container ---
.input-container {
    padding: 16px 20px 20px;
    @apply bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800;
    flex-shrink: 0;
}

.input-wrapper {
    background: #f8fafc;
    @apply dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
    border-radius: 16px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02) inset;

    &:focus-within {
        background: white;
        @apply dark:bg-gray-900;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
}

.model-select {
    background: transparent;
    border: none;
    @apply text-gray-500 dark:text-gray-400;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 20px 4px 6px;
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 4px center;
    background-size: 12px;
    max-width: fit-content;

    &:hover,
    &:focus {
        @apply text-gray-900 dark:text-gray-100;
    }
}

.textarea-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 10px;
}

textarea {
    flex: 1;
    background: transparent;
    border: none;
    padding: 8px 6px;
    @apply text-gray-900 dark:text-gray-100;
    font-size: 14px;
    font-family: inherit;
    resize: none;
    overflow: hidden;
    max-height: 150px;
    min-height: 24px;
    outline: none;
    line-height: 1.5;

    &::placeholder {
        @apply text-gray-400 dark:text-gray-500;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.send-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: #6366f1;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover:not(:disabled) {
        background: #4f46e5;
        transform: scale(1.05);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        background: #e2e8f0;
        @apply dark:bg-gray-700 text-gray-400 dark:text-gray-500;
        cursor: not-allowed;
        transform: none;
    }
}

.spin {
    animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

// --- Chat History Container ---
.chat-history-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-thumb {
        @apply bg-gray-200 dark:bg-gray-700;
        border-radius: 4px;
    }
}

// Mobile responsive styles
@media (max-width: 768px) {
    .agent-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100% !important;
        height: 85vh;
        border-radius: 16px 16px 0 0;
        z-index: 100;
        transform: translateY(100%);
        border-left: none;
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);

        &.panel-open {
            transform: translateY(0);
        }
    }

    .resize-handle {
        display: none;
    }

    .panel-header {
        padding: 12px 16px 0;
        gap: 12px;
    }

    .header-title h2 {
        font-size: 16px;
    }

    .messages-container {
        padding: 16px;
    }

    .input-area {
        padding: 12px 16px;
    }

    .model-select {
        min-width: 120px;
        font-size: 12px;
    }
}

@media (max-width: 480px) {
    .agent-panel {
        height: 90vh;
    }

    .header-actions {
        gap: 4px;
    }

    .icon-btn {
        width: 32px;
        height: 32px;
    }

    .status-pill {
        display: none;
    }
}
</style>