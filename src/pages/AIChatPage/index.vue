<template>
  <div class="ai-chat-page">
    <div class="chat-messages" ref="messageContainer">
      <div v-if="!hasAnyContent" class="empty-chat">
        <el-icon :size="48" color="#a8abb2"><ChatDotRound /></el-icon>
        <p>{{ translate('开始AI对话') }}</p>
      </div>

      <!-- 历史消息 -->
      <div
        v-for="(msg, index) in messages"
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
          <template v-if="msg.items">
            <template v-for="(item, idx) in msg.items" :key="idx">
              <div v-if="item.type === 'thinking'" class="thinking-hint">{{ translate('思考中') }}...</div>
              <template v-else-if="item.type === 'tool_call'">
                <div class="tool-card">
                  <div class="tool-card-header">
                    <el-icon><Tools /></el-icon>
                    {{ translate('调用工具') }}: {{ item.name }}
                  </div>
                  <pre class="tool-card-body">{{ item.args }}</pre>
                </div>
              </template>
              <template v-else-if="item.type === 'tool_result'">
                <component
                  v-if="item.component && getToolResultComponent(item.component)"
                  :is="getToolResultComponent(item.component)"
                  :data="item.data"
                />
                <div v-else class="tool-card tool-card-result">
                  <div class="tool-card-header">
                    <el-icon><Finished /></el-icon>
                    {{ translate('工具返回') }}
                  </div>
                  <pre class="tool-card-body">{{ item.result }}</pre>
                </div>
              </template>
              <div v-else-if="item.type === 'text'" class="message-text markdown-body" v-html="renderMarkdown(item.content)"></div>
            </template>
          </template>
          <div v-else class="message-text markdown-body" v-html="renderMarkdown(msg.content)"></div>
        </div>
      </div>

      <!-- 流式输出气泡 -->
      <div v-if="streamingItems.length > 0" class="message-item assistant">
        <div class="message-avatar">
          <el-avatar :size="32">
            <el-icon><Cpu /></el-icon>
          </el-avatar>
        </div>
        <div class="message-content">
          <template v-for="(item, idx) in streamingItems" :key="idx">
            <div v-if="item.type === 'thinking'" class="thinking-hint">
              <span class="thinking-dot"></span>
              {{ translate('思考中') }}...
            </div>
            <template v-else-if="item.type === 'tool_call'">
              <div class="tool-card">
                <div class="tool-card-header">
                  <el-icon><Tools /></el-icon>
                  {{ translate('调用工具') }}: {{ item.name }}
                </div>
                <pre class="tool-card-body">{{ item.args }}</pre>
              </div>
            </template>
            <template v-else-if="item.type === 'tool_result'">
                <component
                  v-if="item.component && getToolResultComponent(item.component)"
                  :is="getToolResultComponent(item.component)"
                  :data="item.data"
                />
                <div v-else class="tool-card tool-card-result">
                  <div class="tool-card-header">
                    <el-icon><Finished /></el-icon>
                    {{ translate('工具返回') }}
                  </div>
                  <pre class="tool-card-body">{{ item.result }}</pre>
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
          <!-- 工具栏预留位置：以后在此加入联网搜索、深度思考等工具开关 -->
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
</template>

<script setup>
import { ref, computed, nextTick, markRaw } from 'vue'
import { ChatDotRound, User, Cpu, Promotion, Tools, Finished, VideoPause } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { translate } from '@/utils/translate'
import SearchResult from '@/components/SearchResult/index.vue'
import SubscribeTable from '@/components/SubscribeTable/index.vue'

const componentMap = {
  SearchResult: markRaw(SearchResult),
  SubscribeTable: markRaw(SubscribeTable),
}

const getToolResultComponent = (componentName) => {
  return componentMap[componentName] || null
}

const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const streamingItems = ref([])
const messageContainer = ref(null)
let abortController = null

const hasAnyContent = computed(() => messages.value.length > 0 || streamingItems.value.length > 0)

const renderMarkdown = (text) => {
  if (!text) return ''
  return marked.parse(text)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

const stopGeneration = () => {
  if (abortController) {
    abortController.abort()
  }
}

// 回车发送，Shift+回车换行；输入法候选词确认时不发送
const handleEnterKey = (event) => {
  if (event.isComposing || event.shiftKey) return
  event.preventDefault()
  sendMessage()
}

const sendMessage = async () => {
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
        history: messages.value.slice(0, -1),
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
                  // 回复完整，无需额外处理
                  break

                case 'done':
                  // 标记结束，跳出读取循环
                  buffer = ''
                  break

                default:
                  // 未识别类型，当作纯文本追加
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
              // JSON 解析失败，当作纯文本
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
      // 非流式回退
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
  }
}
</script>

<style scoped>
.ai-chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
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

/* 工具调用卡片 */
.tool-card {
  background: var(--el-fill-color-light);
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;
}

.tool-card-result {
  border-left: 3px solid var(--el-color-success);
}

.tool-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.tool-card-body {
  margin: 0;
  padding: 6px 10px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  font-family: inherit;
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

/* 输入区不做分隔线，整体作为一张卡片悬浮在底部；左右与底部都不额外留白，只保留外层布局的边距 */
.chat-input-area {
  padding: 12px 0 0;
}

/* QQ 式无框多行输入：多行文本域无框，卡片边框与圆角交给外层容器 */
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

/* 工具栏预留区：放入工具开关后自动占满左侧 */
.chat-input-toolbar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
}

/* 窄屏减少左右留白与头像占位，让对话内容更宽更好读 */
@media (max-width: 768px) {
  .chat-messages {
    padding: 10px 0;
    gap: 10px;
  }

  .message-item {
    max-width: 96%;
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

  .tool-card-body {
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
