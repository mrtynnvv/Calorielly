<template>
  <UiBlock class="panel">
    <section :aria-labelledby="channel + '-title'" @paste="paste">
      <header>
        <h2 :id="channel + '-title'" class="t-title">{{ title }}</h2>
        <AuthorLabel
          v-if="channel === 'chat'"
          class="sender"
          name="Друг"
          :presence="presenceFor()"
        />
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
          <AuthorLabel
            class="sender"
            :name="
              message.author === 'assistant'
                ? 'ИИ'
                : message.author === me
                  ? 'Я'
                  : 'Друг'
            "
            :presence="presenceFor(message.author)"
            :created-at="message.createdAt"
          />
          <template v-if="message.author === 'assistant'">
            <AssistantReply
              v-if="message.text"
              :data-selection-message="
                channel === 'ai' ? message.id : undefined
              "
              :text="message.text"
              :incomplete="
                message.interrupted || (busy && index === messages.length - 1)
              "
            />
            <p v-if="message.interrupted" class="notice">Ответ прерван</p>
          </template>
          <p
            v-else-if="message.text"
            class="body"
            :data-selection-message="channel === 'ai' ? message.id : undefined"
          >
            {{ message.text }}
          </p>
          <div
            v-if="message.images?.length && imageBaseUrl"
            class="message-images"
          >
            <a
              v-for="(image, position) in message.images"
              :key="image.id"
              :href="imageBaseUrl + image.id"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                :src="imageBaseUrl + image.id"
                :alt="'Изображение ' + (position + 1) + ' в сообщении'"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </div>
      <p
        v-if="sendError || microphoneError || markError"
        class="error"
        role="alert"
      >
        {{ sendError || microphoneError || markError }}
      </p>
      <div
        v-if="images.length || preparing"
        class="draft-images"
        aria-label="Вложения"
      >
        <div
          v-for="(image, position) in images"
          :key="image.url"
          class="draft-image"
        >
          <img
            :src="image.url"
            :alt="'Прикреплённое изображение ' + (position + 1)"
          />
          <button
            type="button"
            :aria-label="'Убрать изображение ' + (position + 1)"
            :disabled="sending"
            @click="discard([image])"
          >
            ×
          </button>
        </div>
        <span v-if="preparing" class="notice" role="status"
          >Подготовка изображения…</span
        >
      </div>
      <form @submit.prevent="submit">
        <textarea
          ref="input"
          v-model="draft"
          rows="1"
          :placeholder="placeholder"
          :aria-label="placeholder"
          @keydown.enter="handleEnter"
          @compositionstart="composing = true"
          @compositionend="endComposition"
        />
        <button
          v-if="channel === 'ai' && transcribe"
          type="button"
          class="microphone"
          :class="{ recording: phase === 'recording' }"
          :aria-label="microphoneLabel"
          :title="microphoneLabel"
          :aria-pressed="phase === 'recording' || phase === 'starting'"
          :aria-busy="phase === 'starting' || phase === 'finishing'"
          :disabled="
            sending || phase === 'finishing' || (!connected && phase === 'idle')
          "
          @mousedown.prevent
          @click="toggleMicrophone"
        >
          <svg
            aria-hidden="true"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <rect
              v-if="phase === 'recording' || phase === 'starting'"
              x="5"
              y="5"
              width="14"
              height="14"
              rx="2"
              fill="currentColor"
              stroke="none"
            />
            <g v-else stroke-linecap="round">
              <rect x="9" y="2" width="6" height="13" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-3 0h6" />
            </g>
          </svg>
        </button>
        <UiButton
          type="submit"
          text="Отправить"
          class="send"
          :disabled="
            disabled ||
            sending ||
            (!draft.trim() && !images.length && !preparing && phase === 'idle')
          "
        />
      </form>
    </section>
  </UiBlock>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AssistantReply from './AssistantReply.vue'
import AuthorLabel from './AuthorLabel.vue'
import { useDictation, type Transcribe } from './useDictation'
import { usePastedImages } from './usePastedImages'
import type { Channel, RoomMessage, RoomSelection } from './useRoom'
import { useSharedSelection } from './useSharedSelection'

import UiBlock from '@/components/ui/UiBlock.vue'
import UiButton from '@/components/ui/UiButton.vue'

const props = defineProps<{
  channel: Channel
  title: string
  placeholder: string
  messages: RoomMessage[]
  imageBaseUrl: string
  me: string
  connected: boolean
  onlineAuthors: ReadonlySet<string> | null
  disabled: boolean
  busy?: boolean
  peerSelections?: ReadonlyMap<string, RoomSelection>
  transcribe?: Transcribe
  savedSelections?: readonly RoomSelection[]
  markError?: string
  publishSelection?: (range: RoomSelection | null) => void
  saveMark?: (range: RoomSelection) => void
  send: (channel: Channel, text: string, images: File[]) => Promise<void>
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
    () => props.savedSelections,
    (range) => props.publishSelection?.(range),
    (range) => props.saveMark?.(range),
  )
const input = ref<HTMLTextAreaElement | null>(null)
const draft = ref('')
let composing = false
let afterComposition = ''

function appendPhrase(text: string) {
  if (composing) {
    afterComposition += (afterComposition ? ' ' : '') + text
    return
  }
  const field = input.value
  if (!field) return
  const separator = field.value && !/\s$/.test(field.value) ? ' ' : ''
  const end = field.value.length
  const { selectionStart, selectionEnd, selectionDirection } = field
  field.setRangeText(separator + text, end, end, 'preserve')
  if (field.selectionDirection !== selectionDirection)
    field.setSelectionRange(selectionStart, selectionEnd, selectionDirection)
  draft.value = field.value
}

function endComposition() {
  composing = false
  if (afterComposition) appendPhrase(afterComposition)
  afterComposition = ''
}

const {
  phase,
  error: microphoneError,
  start,
  finish,
  cancel,
} = useDictation(
  (audio, signal) => props.transcribe!(audio, signal),
  appendPhrase,
)
const microphoneLabel = computed(
  () =>
    ({
      idle: 'Начать диктовку',
      starting: 'Отменить включение микрофона',
      recording: 'Остановить диктовку',
      finishing: 'Завершается распознавание',
    })[phase.value],
)

function toggleMicrophone() {
  sendError.value = ''
  if (phase.value === 'idle') {
    input.value?.focus({ preventScroll: true })
    void start()
  } else void finish()
}

watch(
  () => props.connected,
  (connected) => {
    if (!connected && phase.value !== 'idle') {
      cancel()
      microphoneError.value = 'Связь с комнатой потеряна. Диктовка остановлена.'
    }
  },
)

const sending = ref(false)
const sendError = ref('')
const { images, preparing, paste, discard, finishPreparing } =
  usePastedImages(sendError)
let followLatest = true

function presenceFor(author?: string) {
  if (author === 'assistant') return undefined
  if (author === props.me) return props.connected ? 'online' : 'offline'
  if (!props.onlineAuthors || author === 'guest') return 'unknown'
  const online = author
    ? props.onlineAuthors.has(author)
    : Array.from(props.onlineAuthors).some((id) => id !== props.me)
  return online ? 'online' : 'offline'
}

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
  if (props.disabled || sending.value) return
  sending.value = true
  sendError.value = ''
  followLatest = true
  try {
    const [dictationReady, imagesReady] = await Promise.all([
      phase.value === 'idle' || finish(),
      !preparing.value || finishPreparing(),
    ])
    if (!dictationReady || !imagesReady) return
    const original = draft.value
    const text = original.trim()
    const attachments = images.value
    if ((!text && !attachments.length) || props.disabled) return
    if (text.length > 8000) {
      sendError.value = 'Сообщение может содержать до 8000 символов.'
      return
    }
    await props.send(
      props.channel,
      text,
      attachments.map((image) => image.file),
    )
    if (draft.value === original) draft.value = ''
    discard(attachments)
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
::highlight(sobes-peer-selection),
::highlight(sobes-saved-marks) {
  background-color: var(--room-highlight, #ffe294);
  color: #242424;
}
</style>

<style scoped lang="scss">
.panel {
  background-color: var(--room-surface);
  border-color: var(--room-line);
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
    color: var(--room-text);
    margin-inline-end: auto;
  }
}

.log {
  border-block: 1px solid var(--room-line);
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
  background: var(--room-raised);
  border-radius: 8px;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 5px 9px;
}

.own {
  align-self: flex-end;
  background: var(--room-own);
}

.sender,
.notice {
  color: var(--room-muted);
  font-size: $size-comment;
  font-weight: $weight-title;
}

.body {
  font-size: $size-main;
  white-space: pre-wrap;
}

.draft-images,
.message-images {
  display: flex;
  gap: 5px;
}

.message-images {
  flex-wrap: wrap;
  margin-block-start: 3px;

  a {
    max-width: 100%;
  }

  img {
    border-radius: 4px;
    display: block;
    max-height: 180px;
    max-width: 100%;
  }
}

.draft-images {
  align-items: center;
  flex: none;
  overflow-x: auto;
}

.draft-image {
  flex: none;
  position: relative;

  img {
    border: 1px solid var(--room-line);
    border-radius: 5px;
    display: block;
    height: 54px;
    object-fit: cover;
    width: 68px;
  }

  button {
    align-items: center;
    background: var(--room-surface);
    border: 1px solid var(--room-field-border);
    border-radius: 50%;
    color: var(--room-text);
    cursor: pointer;
    display: flex;
    font-size: 15px;
    height: 22px;
    inset: 2px 2px auto auto;
    justify-content: center;
    padding: 0;
    position: absolute;
    width: 22px;
  }
}

textarea {
  background: var(--room-input);
  border: 1px solid var(--room-field-border);
  border-radius: 8px;
  color: var(--room-text);
  field-sizing: content;
  flex: 1;
  font-size: 16px;
  line-height: 22px;
  max-height: 76px;
  min-height: 34px;
  min-width: 0;
  padding: 5px 8px;
  resize: none;

  &::placeholder {
    color: var(--room-muted);
  }
}

.microphone {
  align-items: center;
  background: var(--room-raised);
  border: 1px solid var(--room-line);
  border-radius: 8px;
  color: var(--room-text);
  cursor: pointer;
  display: inline-flex;
  flex: none;
  height: 34px;
  justify-content: center;
  padding: 0;
  width: 34px;

  &.recording {
    color: var(--room-error);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.send {
  background: var(--room-accent);
  color: var(--room-on-accent);
  flex: none;
  font-size: $size-comment;
  height: 34px;
  margin: 0;
  padding-inline: 10px;
  width: auto;

  &:hover:not(:disabled) {
    background: var(--room-accent);
    filter: brightness(1.08);
  }
}

.error {
  color: var(--room-error);
  font-size: $size-comment;
}
</style>
