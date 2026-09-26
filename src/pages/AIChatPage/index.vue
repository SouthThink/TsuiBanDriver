<template>
  <div :class="['ai-chat-page', { 'sidebar-hidden': !sidebarVisible }]">
    <!-- 侧边栏：对话列表 -->
    <div :class="['chat-sidebar', { 'sidebar-visible': sidebarVisible }]">
      <div class="sidebar-header">
        <el-button type="primary" :icon="Plus" class="new-chat-btn" @click="newChat">
          {{ translate('新对话') }}
        </el-button>
        <el-button
          class="sidebar-collapse-btn"
          :icon="Fold"
          circle
          size="small"
          :title="translate('收起侧边栏')"
          @click="sidebarVisible = false"
        />
      </div>
      <div class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          :class="['conversation-item', { active: conv.id === currentConvId }]"
          @click="switchConversation(conv.id)"
        >
          <div class="conv-info">
            <div class="conv-title">{{ conv.title }}</div>
            <div class="conv-time">{{ formatTime(conv.updated_at) }}</div>
          </div>
          <el-button
            class="conv-delete-btn"
            :icon="Delete"
            circle
            size="small"
            text
            @click.stop="deleteConv(conv.id)"
          />
        </div>
        <div v-if="conversations.length === 0" class="empty-conversations">
          {{ translate('暂无历史对话') }}
        </div>
      </div>
    </div>
    <!-- 移动端遮罩 -->
    <div v-if="sidebarVisible" class="sidebar-overlay" @click="sidebarVisible = false" />

    <!-- 主聊天区 -->
    <div class="chat-main">
      <!-- 展开侧边栏（桌面端折叠后 / 移动端抽屉入口） -->
      <div class="chat-topbar">
        <el-button
          :icon="Expand"
          circle
          size="small"
          :title="translate('展开侧边栏')"
          @click="sidebarVisible = true"
        />
      </div>

      <div class="chat-messages" ref="messageContainer">
        <div v-if="!hasAnyContent" class="empty-chat">
          <el-icon :size="48" color="#a8abb2"><ChatDotRound /></el-icon>
          <p>{{ translate('开始AI对话') }}</p>
        </div>

        <!-- 历史消息 -->
        <div
          v-for="(msg, index) in renderedMessages"
          :key="index"
          :class="['message-item', msg.role]"
        >
          <div class="message-avatar">
            <el-avatar :size="32" v-if="msg.role === 'user'">
              <el-icon><User /></el-icon>
            </el-avatar>
            <el-avatar :size="32" v-else>
              <el-icon><Cpu /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <template v-if="msg.renderItems">
              <template v-for="(item, idx) in msg.renderItems" :key="idx">
                <div v-if="item.type === 'thinking'" class="thinking-hint">{{ translate('思考中') }}...</div>
                <template v-else-if="item.type === 'tool'">
                  <div class="tool-row">
                    <div class="tool-row-head" @click="toggleTool(`${index}-${idx}`)">
                      <el-icon class="tool-row-icon"><Tools /></el-icon>
                      <span class="tool-row-name">{{ item.name }}</span>
                      <span v-if="item.argsInline" class="tool-row-args">{{ item.argsInline }}</span>
                      <el-icon
                        class="tool-row-arrow"
                        :class="{ open: isToolExpanded(`${index}-${idx}`) }"
                      ><ArrowRight /></el-icon>
                    </div>
                    <template v-if="isToolExpanded(`${index}-${idx}`)">
                      <pre class="tool-row-detail">{{ item.argsFull }}</pre>
                      <pre
                        v-if="item.result && !getToolResultComponent(item.component)"
                        class="tool-row-detail tool-row-result"
                      >{{ item.result }}</pre>
                    </template>
                  </div>
                  <div
                    v-if="item.component && getToolResultComponent(item.component)"
                    class="tool-component"
                  >
                    <component
                      :is="getToolResultComponent(item.component)"
                      :data="item.data"
                    />
                  </div>
                </template>
                <div v-else-if="item.type === 'text'" class="message-text markdown-body" v-html="renderMarkdown(item.content)"></div>
              </template>
            </template>
            <div v-else class="message-text markdown-body" v-html="renderMarkdown(msg.content)"></div>
          </div>
        </div>

        <!-- 流式输出气泡 -->
        <div v-if="renderedStreamingItems.length > 0" class="message-item assistant">
          <div class="message-avatar">
            <el-avatar :size="32">
              <el-icon><Cpu /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <template v-for="(item, idx) in renderedStreamingItems" :key="idx">
              <div v-if="item.type === 'thinking'" class="thinking-hint">
                <span class="thinking-dot"></span>
                {{ translate('思考中') }}...
              </div>
              <template v-else-if="item.type === 'tool'">
                <div class="tool-row">
                  <div class="tool-row-head" @click="toggleTool(`s-${idx}`)">
                    <el-icon class="tool-row-icon"><Tools /></el-icon>
                    <span class="tool-row-name">{{ item.name }}</span>
                    <span v-if="item.argsInline" class="tool-row-args">{{ item.argsInline }}</span>
                    <el-icon
                      class="tool-row-arrow"
                      :class="{ open: isToolExpanded(`s-${idx}`) }"
                    ><ArrowRight /></el-icon>
                  </div>
                  <template v-if="isToolExpanded(`s-${idx}`)">
                    <pre class="tool-row-detail">{{ item.argsFull }}</pre>
                    <pre
                      v-if="item.result && !getToolResultComponent(item.component)"
                      class="tool-row-detail tool-row-result"
                    >{{ item.result }}</pre>
                  </template>
                </div>
                <div
                  v-if="item.component && getToolResultComponent(item.component)"
                  class="tool-component"
                >
                  <component
                    :is="getToolResultComponent(item.component)"
                    :data="item.data"
                  />
                </div>
              </template>
              <div v-else-if="item.type === 'text'" class="message-text markdown-body" v-html="renderMarkdown(item.content)"></div>
            </template>
            <div class="typing-indicator" v-if="loading">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="chat-input-box">
          <el-input
            v-model="inputText"
            class="chat-input"
            type="textarea"
            resize="none"
            :autosize="{ minRows: 1, maxRows: 6 }"
            :placeholder="translate('输入消息')"
            @keydown.enter="handleEnterKey"
          />
          <div class="chat-input-actions">
            <div class="chat-input-toolbar"></div>
            <el-button
              v-if="loading"
              type="danger"
              :icon="VideoPause"
              @click="stopGeneration"
            >
              {{ translate("停止") }}
            </el-button>
            <el-button
              v-else
              type="primary"
              circle
              :icon="Promotion"
              :disabled="!inputText.trim()"
              @click="sendMessage"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, markRaw, onMounted } from 'vue'
import { ChatDotRound, User, Cpu, Promotion, Tools, ArrowRight, VideoPause, Plus, Delete, Expand, Fold } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { translate } from '@/utils/translate'
import SearchResult from '@/components/SearchResult/index.vue'
import SubscribeTable from '@/components/SubscribeTable/index.vue'
import {
  getAiConversations,
  getAiConversation,
  deleteAiConversation,
} from '@/api/yzrServer.js'

const componentMap = {
  SearchResult: markRaw(SearchResult),
  SubscribeTable: markRaw(SubscribeTable),
}

const getToolResultComponent = (componentName) => {
  return componentMap[componentName] || null
}

// ---- 对话列表状态 ----
const conversations = ref([])
const currentConvId = ref(null)
// 桌面端控制侧边栏折叠，移动端控制抽屉显隐
const sidebarVisible = ref(window.innerWidth > 768)

// ---- 聊天状态 ----
const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const streamingItems = ref([])
const messageContainer = ref(null)
const switchingConv = ref(false)
let abortController = null
let sendPromise = null

const hasAnyContent = computed(() => messages.value.length > 0 || streamingItems.value.length > 0)

// ---- 工具调用渲染：把 tool_call 与紧随其后的 tool_result 合并为一行 ----
const formatArgsInline = (args) => {
  if (!args) return ''
  const raw = typeof args === 'string' ? args : JSON.stringify(args)
  const oneLine = raw.replace(/\s+/g, ' ').trim()
  return oneLine === '{}' ? '' : oneLine
}

const formatArgsFull = (args) => {
  if (!args) return '{}'
  if (typeof args !== 'string') return JSON.stringify(args, null, 2)
  try {
    return JSON.stringify(JSON.parse(args), null, 2)
  } catch {
    return args
  }
}

const mergeToolItems = (items) => {
  if (!items || items.length === 0) return []
  const merged = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type !== 'tool_call') {
      merged.push(item)
      continue
    }
    const next = items[i + 1]
    const hasResult = Boolean(next && next.type === 'tool_result')
    merged.push({
      type: 'tool',
      name: item.name,
      argsInline: formatArgsInline(item.args),
      argsFull: formatArgsFull(item.args),
      result: hasResult ? next.result : '',
      component: hasResult ? next.component : null,
      data: hasResult ? next.data : null,
    })
    if (hasResult) i++
  }
  return merged
}

const renderedMessages = computed(() =>
  messages.value.map((msg) => (msg.items ? { ...msg, renderItems: mergeToolItems(msg.items) } : msg))
)

const renderedStreamingItems = computed(() => mergeToolItems(streamingItems.value))

// 折叠状态（key：历史消息为 `${消息下标}-${条目下标}`，流式为 `s-${条目下标}`）
const expandedTools = ref(new Set())

const isToolExpanded = (key) => expandedTools.value.has(key)

const toggleTool = (key) => {
  const next = new Set(expandedTools.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedTools.value = next
}

const renderMarkdown = (text) => {
  if (!text) return ''
  return marked.parse(text)
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const d = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return translate('刚刚')
  if (diff < 3600000) return Math.floor(diff / 60000) + translate('分钟前')
  if (diff < 86400000) return Math.floor(diff / 3600000) + translate('小时前')
  return d.toLocaleDateString()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// ---- 对话管理 ----
const loadConversations = async () => {
  try {
    const res = await getAiConversations()
    if (res.code === 200 && Array.isArray(res.data)) {
      conversations.value = res.data
    }
  } catch {}
}

// 移动端收起抽屉（桌面端保持侧边栏展开）
const closeSidebarDrawer = () => {
  if (window.innerWidth <= 768) sidebarVisible.value = false
}

const switchConversation = async (convId) => {
  closeSidebarDrawer()
  if (switchingConv.value) return
  // 已加载过的同一对话无需重复请求；消息为空时仍需重新拉取
  if (convId === currentConvId.value && messages.value.length > 0) return

  switchingConv.value = true
  try {
    // 若正在流式生成，先中断并等待当前轮次结束，避免新旧消息串台
    if (loading.value) {
      stopGeneration()
      await sendPromise
    }
    const res = await getAiConversation({ id: convId })
    if (res.code === 200 && res.data) {
      currentConvId.value = convId
      messages.value = res.data.display_messages || []
      streamingItems.value = []
      scrollToBottom()
    } else if (res && res.msg) {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error(e?.title || e?.msg || translate('加载对话失败'))
  } finally {
    switchingConv.value = false
  }
}

const newChat = async () => {
  closeSidebarDrawer()
  if (switchingConv.value) return
  // 与切换对话保持一致：先中断正在进行的生成
  if (loading.value) {
    stopGeneration()
    await sendPromise
  }
  currentConvId.value = null
  messages.value = []
  streamingItems.value = []
}

const deleteConv = async (convId) => {
  try {
    const res = await deleteAiConversation({ id: convId })
    if (res.code === 200) {
      if (convId === currentConvId.value) {
        currentConvId.value = null
        messages.value = []
      }
      await loadConversations()
    }
  } catch {}
}

// ---- 发送消息 ----
const stopGeneration = () => {
  if (abortController) {
    abortController.abort()
  }
}

const handleEnterKey = (event) => {
  if (event.isComposing || event.shiftKey) return
  event.preventDefault()
  sendMessage()
}

const sendMessage = () => {
  sendPromise = runSend()
  return sendPromise
}

const runSend = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text, time: Date.now() })
  inputText.value = ''
  scrollToBottom()

  loading.value = true
  streamingItems.value = []
  scrollToBottom()

  abortController = new AbortController()
  const token = localStorage.getItem('token') || ''

  try {
    const res = await fetch('/yzr/aiChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({
        message: text,
        conversation_id: currentConvId.value,
      }),
      signal: abortController.signal,
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const contentType = res.headers.get('content-type') || ''

    if (contentType.includes('text/event-stream')) {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim()
            const eventType = currentEvent || ''
            currentEvent = ''

            if (dataStr === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(dataStr)
              const type = eventType || parsed.type

              switch (type) {
                case 'conversation_id':
                  currentConvId.value = parsed.content
                  break

                case 'thinking':
                  if (!streamingItems.value.some(i => i.type === 'thinking')) {
                    streamingItems.value.push({ type: 'thinking' })
                  }
                  break

                case 'tool_call':
                  streamingItems.value = streamingItems.value.filter(i => i.type !== 'thinking')
                  streamingItems.value.push({
                    type: 'tool_call',
                    name: parsed.name || '',
                    args: parsed.arguments
                      ? (typeof parsed.arguments === 'string' ? parsed.arguments : JSON.stringify(parsed.arguments, null, 2))
                      : JSON.stringify(parsed, null, 2),
                  })
                  break

                case 'tool_result':
                  streamingItems.value.push({
                    type: 'tool_result',
                    result: parsed.result != null ? parsed.result : '',
                    component: parsed.component || null,
                    data: parsed.data || null,
                  })
                  break

                case 'reply_chunk': {
                  const content = parsed.content || ''
                  const last = streamingItems.value[streamingItems.value.length - 1]
                  if (last && last.type === 'text') {
                    last.content += content
                  } else {
                    streamingItems.value.push({ type: 'text', content })
                  }
                  break
                }

                case 'reply_complete':
                  break

                case 'done':
                  buffer = ''
                  break

                default:
                  if (parsed.content) {
                    const last = streamingItems.value[streamingItems.value.length - 1]
                    if (last && last.type === 'text') {
                      last.content += parsed.content
                    } else {
                      streamingItems.value.push({ type: 'text', content: parsed.content })
                    }
                  }
              }
            } catch {
              const last = streamingItems.value[streamingItems.value.length - 1]
              if (last && last.type === 'text') {
                last.content += dataStr
              } else {
                streamingItems.value.push({ type: 'text', content: dataStr })
              }
            }
          }
        }
        scrollToBottom()
      }
    } else {
      const data = await res.json()
      streamingItems.value.push({
        type: 'text',
        content: data?.reply || data?.data?.reply || translate('AI未返回有效回复'),
      })
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      streamingItems.value.push({ type: 'text', content: translate('（已中断）') })
      return
    }
    streamingItems.value.push({
      type: 'text',
      content: translate('请求失败请检查后端服务'),
    })
  } finally {
    loading.value = false
    if (streamingItems.value.length > 0) {
      const savedItems = streamingItems.value.filter(i => i.type !== 'thinking')
      if (savedItems.length > 0) {
        messages.value.push({
          role: 'assistant',
          items: savedItems,
          content: savedItems
            .filter(i => i.type === 'text')
            .map(i => i.content)
            .join(''),
        })
      }
    }
    streamingItems.value = []
    abortController = null
    scrollToBottom()
    // 刷新对话列表（标题可能已更新）
    loadConversations()
  }
}

onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
.ai-chat-page {
  height: 100%;
  display: flex;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

/* ---- 侧边栏 ---- */
.chat-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.new-chat-btn {
  flex: 1;
}

.sidebar-collapse-btn {
  flex-shrink: 0;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.conversation-item:hover {
  background: var(--el-fill-color-light);
}

.conversation-item.active {
  background: var(--el-color-primary-light-9);
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.conv-delete-btn {
  opacity: 0;
  flex-shrink: 0;
}

.conversation-item:hover .conv-delete-btn {
  opacity: 1;
}

.empty-conversations {
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  padding: 20px 0;
}

.sidebar-overlay {
  display: none;
}

/* ---- 主聊天区 ---- */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0 20px;
}

/* 展开侧边栏按钮：桌面端折叠后显示，移动端常驻作为抽屉入口 */
.chat-topbar {
  display: none;
  padding: 12px 0 0;
}

@media (min-width: 769px) {
  .chat-sidebar:not(.sidebar-visible) {
    display: none;
  }
  .ai-chat-page.sidebar-hidden .chat-topbar {
    display: flex;
  }
}

.chat-messages {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  gap: 12px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 80%;
  min-width: 0;
}

.message-item.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-item.assistant {
  align-self: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  background: var(--el-fill-color);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--el-text-color-primary);
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 允许气泡收缩到可用宽度，内部宽组件（表格等）改为自身滚动，避免窄屏撑破布局 */
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

/* 气泡内直接子级（含工具结果组件根节点）一律允许收缩 */
.message-content > :deep(*) {
  min-width: 0;
  max-width: 100%;
}

.message-item.user .message-content {
  background: var(--el-color-primary);
  color: #fff;
}

.message-text {
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
}

/* markdown 渲染样式 */
.markdown-body :deep(p) {
  margin: 0 0 8px;
}
.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}
.markdown-body :deep(pre) {
  background: var(--el-fill-color-dark);
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
  margin: 8px 0;
  font-size: 13px;
}
.markdown-body :deep(code) {
  font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
  font-size: 13px;
}
.markdown-body :deep(:not(pre) > code) {
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}
.markdown-body :deep(li) {
  margin: 2px 0;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--el-color-primary);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--el-text-color-secondary);
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
  /* 宽表格在自身内部横向滚动，避免撑破消息气泡 */
  display: block;
  overflow-x: auto;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--el-border-color);
  padding: 6px 12px;
  text-align: left;
}
.markdown-body :deep(th) {
  background: var(--el-fill-color-light);
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 8px 0 4px;
  line-height: 1.4;
}
.markdown-body :deep(h1) { font-size: 1.4em; }
.markdown-body :deep(h2) { font-size: 1.25em; }
.markdown-body :deep(h3) { font-size: 1.1em; }
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color-light);
  margin: 12px 0;
}
.markdown-body :deep(a) {
  color: var(--el-color-primary);
}

/* 思考提示 */
.thinking-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.thinking-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  animation: thinking-pulse 1.2s infinite;
}

@keyframes thinking-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* 工具结果组件容器：窄屏时组件在自身内部横向滚动，不撑破消息气泡 */
.tool-component {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

/* 工具调用：折叠行（动作 + 单行参数，点击展开完整参数/返回） */
.tool-row {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;
}

.tool-row-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
}

.tool-row-head:hover {
  background: var(--el-fill-color);
}

.tool-row-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.tool-row-name {
  flex-shrink: 0;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.tool-row-args {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-row-arrow {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s;
}

.tool-row-arrow.open {
  transform: rotate(90deg);
}

.tool-row-detail {
  margin: 0;
  padding: 6px 10px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  font-family: inherit;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.tool-row-result {
  color: var(--el-text-color-secondary);
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* 输入区 */
.chat-input-area {
  padding: 12px 0 0;
}

.chat-input-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  transition: border-color 0.2s;
}

.chat-input-box:focus-within {
  border-color: var(--el-color-primary);
}

.chat-input :deep(.el-textarea__inner) {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.6;
}

.chat-input :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.chat-input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-input-toolbar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
}

/* ---- 响应式：移动端侧边栏改为抽屉式 ---- */
@media (max-width: 768px) {
  .chat-sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    width: 280px;
    z-index: 100;
    transition: left 0.25s ease;
    border-radius: 0;
  }

  .chat-sidebar.sidebar-visible {
    left: 0;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 99;
  }

  .chat-main {
    padding: 0 12px;
  }

  .chat-topbar {
    display: flex;
    padding: 10px 0 0;
  }

  .chat-messages {
    padding: 10px 0;
    gap: 10px;
  }

  .message-item {
    max-width: 100%;
    gap: 6px;
  }

  .message-avatar :deep(.el-avatar) {
    width: 26px;
    height: 26px;
  }

  .message-content {
    padding: 8px 10px;
    border-radius: 10px;
  }

  .message-text {
    font-size: 14px;
  }

  .markdown-body :deep(pre) {
    padding: 8px;
    font-size: 12px;
  }

  .markdown-body :deep(table) {
    display: block;
    overflow-x: auto;
  }

  .markdown-body :deep(th),
  .markdown-body :deep(td) {
    padding: 4px 8px;
  }

  .tool-row-detail {
    padding: 6px 8px 8px;
    max-height: 160px;
  }

  .chat-input-area {
    padding: 8px 0 0;
  }

  .chat-input-box {
    padding: 6px 8px;
    border-radius: 10px;
  }

  .chat-input :deep(.el-textarea__inner) {
    font-size: 14px;
  }

  .chat-input-toolbar {
    min-height: 30px;
  }
}
</style>
