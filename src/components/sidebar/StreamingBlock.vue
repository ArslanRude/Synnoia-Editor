<template>
  <div class="streaming-block">
    <div class="streaming-border-glow"></div>
    <div class="streaming-inner">

      <!-- Strategy & Planning Section -->
      <div v-if="displayedPlanningItems.length > 0" class="strategy-section">
        <div class="section-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <h3>Strategy &amp; Planning</h3>
        </div>
        <div class="planning-list">
          <TransitionGroup name="list-stagger">
            <div v-for="(item, index) in displayedPlanningItems" :key="index" class="planning-item">
              <div class="item-dot" :class="{ 'pulse': index === displayedPlanningItems.length - 1 }"></div>
              <div class="item-content">
                <div class="item-title">{{ item.displayedTitle }}</div>
                <div v-if="item.displayedInstructions" class="item-desc">{{ item.displayedInstructions }}</div>
                <div v-if="item.nodeTypes && item.nodeTypes.length" class="item-tags">
                  <span v-for="type in item.nodeTypes" :key="type" class="type-tag">{{ type }}</span>
                </div>
                <div v-if="item.diagramType" class="item-tags">
                  <span class="type-tag diagram">{{ item.diagramType }}</span>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- Live Summary Section -->
      <div v-if="displayedSummary" class="summary-section">
        <div class="section-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <h3>Status Update</h3>
        </div>
        <div class="summary-text">
          {{ displayedSummary }}<span v-if="isTypingSummary" class="typewriter-cursor">|</span>
        </div>
      </div>

      <!-- Real-time Generation Section (hidden for planner once planning completes) -->
      <div v-if="tokens && (node !== 'planner' || !hasPlanningCompleted)" class="generation-section">
        <div class="token-streamer" ref="streamerRef">
          <pre><code>{{ tokens }}<span class="cursor">▊</span></code></pre>
        </div>
      </div>

      <!-- Fallback shimmer when nothing ready yet -->
      <div v-if="!planningItems.length && !tokens && !node" class="thinking-placeholder">
        <div class="shimmer-text">Synnoia is processing your request...</div>
        <div class="wave-loader">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { AgentOutlineBlockItem } from '@/ai/agent/types'

const props = defineProps<{
  planningItems: AgentOutlineBlockItem[]
  node: string
  tokens: string
  summary: string
}>()

const streamerRef = ref<HTMLElement | null>(null)
const displayedSummary = ref('')
const isTypingSummary = ref(false)
let summaryTimeout: ReturnType<typeof setTimeout> | null = null

// Planning reveal state
interface LocalPlanningItem extends AgentOutlineBlockItem {
  displayedTitle: string
  displayedInstructions: string
}

const displayedPlanningItems = ref<LocalPlanningItem[]>([])
const isRevealingPlan = ref(false)

const hasPlanningCompleted = computed(() =>
  props.planningItems.length > 0 &&
  displayedPlanningItems.value.length === props.planningItems.length &&
  displayedPlanningItems.value.every(item => item.displayedTitle.length === (item.title?.length ?? 0))
)

const nodeLabel = computed(() => {
  const nodes: Record<string, string> = {
    planner: 'Analyzing & Planning',
    writer: 'Generating Content',
    edit: 'Refining Text',
    humanizer: 'Humanizing Output',
    deplagiarizer: 'Checking Plagiarism',
    communication_agent: 'Responding',
    diagram: 'Generating Diagram',
  }
  return nodes[props.node] || 'Processing'
})

// Auto-scroll token window
watch(() => props.tokens, () => {
  nextTick(() => {
    if (streamerRef.value) {
      streamerRef.value.scrollTop = streamerRef.value.scrollHeight
    }
  })
})

// ---  Summary typewriter with 2.5s initial delay ---
const typeSummary = (targetText: string) => {
  if (displayedSummary.value.length < targetText.length) {
    isTypingSummary.value = true
    displayedSummary.value = targetText.slice(0, displayedSummary.value.length + 1)
    summaryTimeout = setTimeout(() => typeSummary(targetText), 15 + Math.random() * 30)
  } else {
    isTypingSummary.value = false
  }
}

watch(() => props.summary, (newSummary) => {
  if (!newSummary) {
    displayedSummary.value = ''
    isTypingSummary.value = false
    if (summaryTimeout) { clearTimeout(summaryTimeout); summaryTimeout = null }
    return
  }
  if (displayedSummary.value.length >= newSummary.length) {
    displayedSummary.value = newSummary
    isTypingSummary.value = false
    return
  }
  if (!isTypingSummary.value) {
    if (summaryTimeout) clearTimeout(summaryTimeout)
    summaryTimeout = setTimeout(() => typeSummary(newSummary), 2500) // 2.5s delay
  }
}, { immediate: true })

// --- Planning items sequential typewriter reveal ---
watch(() => props.planningItems, (newItems) => {
  if (newItems.length > 0 && displayedPlanningItems.value.length === 0 && !isRevealingPlan.value) {
    revealNextItem(0)
  }
}, { immediate: true, deep: false })

async function revealNextItem(index: number): Promise<void> {
  if (index >= props.planningItems.length) {
    isRevealingPlan.value = false
    return
  }
  isRevealingPlan.value = true
  const source = props.planningItems[index]

  const newItem: LocalPlanningItem = {
    ...source,
    displayedTitle: '',
    displayedInstructions: '',
  }
  displayedPlanningItems.value.push(newItem)

  // Type the title
  await typeText(source.title, (val) => { newItem.displayedTitle = val }, 10)

  // Brief pause then type instructions
  if (source.instructions) {
    await new Promise(r => setTimeout(r, 100))
    await typeText(source.instructions, (val) => { newItem.displayedInstructions = val }, 8)
  }

  // Move to next item after short gap
  setTimeout(() => revealNextItem(index + 1), 400)
}

function typeText(text: string, update: (val: string) => void, speed: number): Promise<void> {
  return new Promise((resolve) => {
    let current = ''
    const chunk = () => {
      if (current.length < text.length) {
        current = text.slice(0, current.length + 1)
        update(current)
        setTimeout(chunk, speed + Math.random() * speed)
      } else {
        resolve()
      }
    }
    chunk()
  })
}

onUnmounted(() => {
  if (summaryTimeout) clearTimeout(summaryTimeout)
})
</script>

<style scoped lang="less">
.streaming-block {
  margin: 12px 0;
  position: relative;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
}

.dark .streaming-block {
  background: #111827;
}

.streaming-inner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// --- Section header ---
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #6b7280;

  h3 {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

.node-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

// --- Planning list ---
.planning-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.planning-item {
  display: flex;
  gap: 12px;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 4px;
    top: 10px;
    bottom: -10px;
    width: 1px;
    background: #e5e7eb;
  }
}

.item-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #6366f1;
  margin-top: 4px;
  flex-shrink: 0;
  z-index: 1;

  &.pulse {
    animation: dot-pulse 1.5s infinite;
  }
}

@keyframes dot-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  70%  { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

.item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.item-desc {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.type-tag {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  background: #f1f5f9;
  color: #64748b;
  padding: 1px 6px;
  border-radius: 10px;
  letter-spacing: 0.02em;
  border: 1px solid #e2e8f0;

  &.diagram {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.2);
  }
}

// --- Summary section ---
.summary-section {
  background: rgba(99, 102, 241, 0.03);
  border-radius: 8px;
  padding: 12px;
  border: 1px dashed rgba(99, 102, 241, 0.2);
}

.summary-text {
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  font-style: italic;
}

.typewriter-cursor {
  display: inline-block;
  width: 2px;
  background: #6366f1;
  margin-left: 2px;
  animation: cursor-blink 0.8s infinite;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

// --- Token streamer ---
.generation-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.token-streamer {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  max-height: 220px;
  overflow-y: auto;
  scroll-behavior: smooth;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
  &::-webkit-scrollbar-track { background: transparent; }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11.5px;
    line-height: 1.6;
    color: #374151;
  }
}

.cursor {
  color: #6366f1;
  animation: blink 0.8s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  from, to { opacity: 1; }
  50%       { opacity: 0; }
}

// --- Pulse indicator ---
.pulse-indicator {
  display: flex;
  gap: 3px;

  span {
    width: 3px;
    height: 3px;
    background: #6366f1;
    border-radius: 50%;
    animation: bounce 1s infinite alternate;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes bounce {
  from { transform: translateY(0); opacity: 0.4; }
  to   { transform: translateY(-3px); opacity: 1; }
}

// --- Thinking placeholder ---
.thinking-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.shimmer-text {
  font-size: 13px;
  font-weight: 500;
  background: linear-gradient(90deg, #94a3b8 0%, #cbd5e1 50%, #94a3b8 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 2s infinite linear;
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

.wave-loader {
  display: flex;
  gap: 4px;

  span {
    width: 4px;
    height: 4px;
    background: #6366f1;
    border-radius: 50%;
    animation: wave 1.2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.3s; }
    &:nth-child(5) { animation-delay: 0.4s; }
  }
}

@keyframes wave {
  0%, 40%, 100% { transform: scaleY(1); opacity: 0.3; }
  20%            { transform: scaleY(2.5); opacity: 1; }
}

// --- TransitionGroup ---
.list-stagger-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.list-stagger-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
