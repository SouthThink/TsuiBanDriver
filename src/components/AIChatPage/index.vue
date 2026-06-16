<template>
  <div class="ai-chat-page">
    <div class="chat-messages" ref="messageContainer">
      <div v-if="messages.length === 0" class="empty-chat">
        <el-icon :size="48" color="#a8abb2"><ChatDotRound /></el-icon>
        <p>{{ translate('开始AI对话') }}</p>
      </div>
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
          <div class="message-text">{{ msg.content }}</div>
        </div>
      </div>
      <div v-if="loading" class="message-item assistant">
        <div class="message-avatar">
          <el-avatar :size="32">
            <el-icon><Cpu /></el-icon>
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-input-area">
      <el-input
        v-model="inputText"
        :placeholder="translate('输入消息')"
        class="chat-input"
        @keydown.enter="sendMessage"
        :disabled="loading"
        clearable
      >
        <template #append>
          <el-button
            :icon="Promotion"
            @click="sendMessage"
            :disabled="!inputText.trim() || loading"
            type="primary"
          />
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { ChatDotRound, User, Cpu, Promotion } from '@element-plus/icons-vue'
import { translate } from '@/utils/translate'
import { aiChat } from '@/api/yzrServer.js'

const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const messageContainer = ref(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  scrollToBottom()

  loading.value = true
  try {
    const res = await aiChat({ message: text, history: messages.value.slice(0, -1) })
    messages.value.push({
      role: 'assistant',
      content: res?.reply || res?.data?.reply || translate('AI未返回有效回复'),
    })
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      content: translate('请求失败请检查后端服务'),
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

watch(messages, scrollToBottom, { deep: true })
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
  flex: 1;
  overflow-y: auto;
  padding: 20px;
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
}

.message-item.user .message-content {
  background: var(--el-color-primary);
  color: #fff;
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

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

.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.chat-input {
  --el-input-border-radius: 20px;
}
</style>
