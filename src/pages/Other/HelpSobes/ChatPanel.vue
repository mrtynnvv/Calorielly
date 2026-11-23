<template>
  <UiBlock class="panel">
    <section :aria-labelledby="channel + '-title'">
      <header>
        <h2 :id="channel + '-title'" class="t-title">{{ title }}</h2>
        <span v-if="busy" class="notice" role="status">ИИ отвечает…</span>
        <slot name="actions" />
      </header>
      <div
        ref="log"
        class="log"
        role="log"
        aria-relevant="additions"
        :aria-labelledby="channel + '-title'"
        tabindex="0"
        @scroll="trackScroll"
      >
        <div
          v-for="(message, index) in messages"
          :key="message.id"
          class="message"
          :class="{ own: message.author === me }"
        >
          <p class="sender">
            {{
              message.author === 'assistant'
                ? 'ИИ'
                : message.author === me
                  ? 'Я'
                  : 'Друг'
            }}
          </p>
          <template v-if="message.author === 'assistant'">
            <AssistantReply
              v-if="message.text"
              :data-selection-message="channel === 'ai' ? message.id : undefined"
              :text="message.text"
              :incomplete="
                message.interrupted || (busy && index === messages.length - 1)
              "
            />
            <p v-if="message.interrupted" class="notice">Ответ прерван</p>
          </template>
          <p
            v-else
            class="body"
            :data-selection-message="channel === 'ai' ? message.id : undefined"
          >{{ message.text }}</p>
        </div>
      </div>
      <p v-if="sendError" class="error" role="alert">{{ sendError }}</p>
      <form @submit.prevent="submit">
        <textarea
          v-model="draft"
          rows="1"
          :placeholder="placeholder"
          :aria-label="placeholder"
          @keydown.enter="handleEnter"
        />
        <UiButton
          type="submit"
          text="Отправить"
          class="send"
          :disabled="disabled || sending || !draft.trim()"
        />
      </form>
    </section>
  </UiBlock>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import AssistantReply from './AssistantReply.vue'
import type { Channel, RoomMessage, RoomSelection } from './useRoom'
import { useSharedSelection } from './useSharedSelection'

import UiBlock from '@/components/ui/UiBlock.vue'
import UiButton from '@/components/ui/UiButton.vue'

const props = defineProps<{
  channel: Channel
  title: string
  placeholder: string
  messages: RoomMessage[]
  me: string
  disabled: boolean
  busy?: boolean
  peerSelections?: ReadonlyMap<string, RoomSelection>
  publishSelection?: (range: RoomSelection | null) => void
  send: (channel: Channel, text: string) => Promise<void>
}>()

const log = ref<HTMLElement | null>(null)
if (props.channel === 'ai')
  useSharedSelection(
    log,
    () => [
      props.messages,
      props.messages[props.messages.length - 1]?.text,
      props.busy,
    ],
    () => props.peerSelections,
    (range) => props.publishSelection?.(range),
  )
const draft = ref('')
const sending = ref(false)
const sendError = ref('')
let followLatest = true

function trackScroll() {
  const box = log.value
  if (box)
    followLatest = box.scrollHeight - box.clientHeight - box.scrollTop < 48
}

watch(
  () => {
    const last = props.messages[props.messages.length - 1]
    return [last?.id, last?.text]
  },
  () => {
    const box = log.value
    if (!box || !followLatest) return
    const latest = props.messages[props.messages.length - 1]
    const bubble = box.lastElementChild
    if (latest?.author === 'assistant' && bubble) {
      // Оставляем начало длинного ответа в поле зрения во время генерации.
      const distance =
        bubble.getBoundingClientRect().top - box.getBoundingClientRect().top
      if (distance > 0) box.scrollTop += distance
    } else {
      box.scrollTop = box.scrollHeight
    }
  },
  { flush: 'post' },
)

async function submit() {
  const original = draft.value
  const text = original.trim()
  if (props.disabled || sending.value || !text) return
  if (text.length > 8000) {
    sendError.value = 'Сообщение может содержать до 8000 символов.'
    return
  }
  sending.value = true
  sendError.value = ''
  followLatest = true
  try {
    await props.send(props.channel, text)
    if (draft.value === original) draft.value = ''
  } catch (error) {
    sendError.value =
      error instanceof Error ? error.message : 'Не удалось отправить сообщение.'
  } finally {
    sending.value = false
  }
}

function handleEnter(event: KeyboardEvent) {
  if (event.isComposing || event.shiftKey) return
  event.preventDefault()
  void submit()
}
</script>

<style>
::highlight(sobes-peer-selection) {
  background-color: #ffe294;
  color: #242424;
}
</style>

<style scoped lang="scss">
.panel {
  border-radius: 10px;
  min-height: 0;
  min-width: 0;
  padding: 5px 8px;
}

section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
}

header,
form {
  align-items: center;
  display: flex;
  gap: 6px;
}

header {
  min-height: 28px;

  h2 {
    margin-inline-end: auto;
  }
}

.log {
  border-block: 1px solid #d9d9d9;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-block: 6px;
}

.message {
  align-self: flex-start;
  background: $palette-bg;
  border-radius: 8px;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 5px 9px;
}

.own {
  align-self: flex-end;
  background: #e8f3ff;
}

.sender,
.notice {
  color: $color-comment;
  font-size: $size-comment;
  font-weight: $weight-title;
}

.body {
  font-size: $size-main;
  white-space: pre-wrap;
}

textarea {
  border: 1px solid #aeb4bc;
  border-radius: 8px;
  field-sizing: content;
  flex: 1;
  font-size: 16px;
  line-height: 22px;
  max-height: 76px;
  min-height: 34px;
  min-width: 0;
  padding: 5px 8px;
  resize: none;
}

.send {
  background: #1664ad;
  flex: none;
  font-size: $size-comment;
  height: 34px;
  margin: 0;
  padding-inline: 10px;
  width: auto;
}

.error {
  color: #a32121;
  font-size: $size-comment;
}
</style>
