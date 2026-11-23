<template>
  <main class="room" :data-theme="theme" aria-label="Комната на двоих">
    <p v-if="status" class="connection" role="status">{{ status }}</p>
    <RoomSplit>
      <template #ai>
        <ChatPanel
          id="sobes-ai-panel"
          channel="ai"
          title="Чат с ИИ"
          placeholder="Вопрос для ИИ"
          :me="me"
          :connected="connected"
          :online-authors="onlineAuthors"
          :messages="aiMessages"
          :busy="busy"
          :disabled="aiLocked"
          :send="sendMessage"
          :transcribe="transcribeDictation"
          :peer-selections="peerSelections"
          :saved-selections="savedSelections"
          :mark-error="markError"
          :save-mark="saveMark"
          :publish-selection="publishSelection"
        >
          <template #actions>
            <button
              class="action"
              type="button"
              aria-haspopup="dialog"
              aria-controls="sobes-settings"
              @click="openSettings"
            >
              Параметры
            </button>
          </template>
        </ChatPanel>
      </template>
      <ChatPanel
        channel="chat"
        title="Чат вдвоём"
        placeholder="Сообщение другу"
        :me="me"
        :connected="connected"
        :online-authors="onlineAuthors"
        :messages="chatMessages"
        :disabled="!connected"
        :send="sendMessage"
      />
    </RoomSplit>
    <dialog
      id="sobes-settings"
      ref="settings"
      aria-labelledby="sobes-settings-title"
      @click.self="closeSettings"
      @cancel.prevent="closeSettings"
    >
      <div class="settings-content">
        <header class="settings-header">
          <h2 id="sobes-settings-title" class="t-title">Параметры комнаты</h2>
          <button
            class="action close"
            type="button"
            aria-label="Закрыть параметры"
            :disabled="settingsBusy"
            @click="closeSettings"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <section class="settings-section" aria-labelledby="sobes-local-title">
          <h3 id="sobes-local-title" class="t-title">Личные настройки</h3>
          <fieldset class="options theme-options">
            <legend>Тема</legend>
            <label v-for="option in themes" :key="option.value" class="option">
              <input
                type="radio"
                name="sobes-theme"
                :value="option.value"
                :checked="theme === option.value"
                @change="setTheme(option.value)"
              />
              {{ option.label }}
            </label>
          </fieldset>
          <div class="editor">
            <label for="sobes-dictation-prompt">Промпт для диктовки</label>
            <textarea
              id="sobes-dictation-prompt"
              :value="dictationPrompt"
              rows="3"
              maxlength="4000"
              @input="setDictationPrompt"
            />
          </div>
        </section>
        <section class="settings-section" aria-labelledby="sobes-shared-title">
          <h3 id="sobes-shared-title" class="t-title">Общие настройки</h3>
          <p v-if="status" class="connection" role="status">{{ status }}</p>
          <fieldset
            v-if="models.length"
            class="options"
            :disabled="!connected || saving || resetting"
            :aria-busy="!!pendingModel"
          >
            <legend>Модель</legend>
            <label v-for="option in models" :key="option.id" class="option">
              <input
                type="radio"
                name="sobes-model"
                :value="option.id"
                :disabled="pendingModel !== null && pendingModel !== option.id"
                :checked="(pendingModel ?? model) === option.id"
                @change="changeModel(option.id)"
              />
              {{ option.label }}
            </label>
          </fieldset>
          <form class="editor" @submit.prevent="saveContext">
            <label for="sobes-context">Базовый контекст для ИИ</label>
            <textarea
              id="sobes-context"
              v-model="draft"
              rows="6"
              maxlength="16000"
              :disabled="saving"
            />
            <p v-if="conflicted" role="status">
              Контекст уже изменился. Можно загрузить сохранённый текст или
              записать свой поверх него.
            </p>
            <div class="actions">
              <button
                type="submit"
                class="action primary"
                :disabled="aiLocked || draft === context.text"
              >
                {{
                  saving
                    ? 'Сохранение…'
                    : conflicted
                      ? 'Сохранить мою версию'
                      : 'Сохранить контекст'
                }}
              </button>
              <button
                v-if="conflicted"
                type="button"
                class="action"
                @click="loadContext"
              >
                Загрузить сохранённый текст
              </button>
            </div>
          </form>
          <button
            class="action reset"
            type="button"
            :disabled="!connected || !hasMyMarks"
            @click="clearMyMarks"
          >
            Очистить мои выделения
          </button>
          <button
            class="action reset"
            type="button"
            :disabled="!canReset"
            @click="resetHistory"
          >
            Сбросить историю ИИ
          </button>
          <p v-if="error || markError" class="error" role="alert">
            {{ error || markError }}
          </p>
        </section>
      </div>
    </dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import ChatPanel from './ChatPanel.vue'
import RoomSplit from './RoomSplit.vue'
import { type Channel, useRoom } from './useRoom'

const {
  me,
  context,
  model,
  models,
  busy,
  connected,
  onlineAuthors,
  status,
  aiMessages,
  chatMessages,
  peerSelections,
  savedSelections,
  markError,
  hasMyMarks,
  saveMark,
  clearMyMarks,
  publishSelection,
  request,
} = useRoom()
const themes = [
  { value: 'dark', label: 'Тёмная' },
  { value: 'light', label: 'Светлая' },
] as const
const themeKey = 'help-sobes.theme'
const dictationPromptKey = 'help-sobes.dictation-prompt'
const defaultDictationPrompt =
  'Техническое собеседование на русском языке по веб-разработке. Встречаются термины JavaScript, TypeScript, Vue, Nuxt, Pinia, React, Node.js, PostgreSQL, Kafka и RabbitMQ.'
const dictationPrompt = ref(
  localStorage.getItem(dictationPromptKey) ?? defaultDictationPrompt,
)
const theme = ref<'light' | 'dark'>(
  localStorage.getItem(themeKey) === 'light' ? 'light' : 'dark',
)
function setTheme(value: 'light' | 'dark') {
  theme.value = value
  localStorage.setItem(themeKey, value)
}

function setDictationPrompt(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value
  dictationPrompt.value = value
  localStorage.setItem(dictationPromptKey, value)
}

function syncLocalSettings(event: StorageEvent) {
  if (event.storageArea !== localStorage) return
  if (event.key === themeKey || event.key === null)
    theme.value = localStorage.getItem(themeKey) === 'light' ? 'light' : 'dark'
  if (event.key === dictationPromptKey || event.key === null)
    dictationPrompt.value =
      localStorage.getItem(dictationPromptKey) ?? defaultDictationPrompt
}

onMounted(() => window.addEventListener('storage', syncLocalSettings))
onUnmounted(() => window.removeEventListener('storage', syncLocalSettings))

const settings = ref<HTMLDialogElement | null>(null)
const draft = ref('')
const draftRevision = ref(0)
const saving = ref(false)
const resetting = ref(false)
const pendingModel = ref<string | null>(null)
const error = ref('')
const settingsBusy = computed(
  () => saving.value || resetting.value || !!pendingModel.value,
)
const aiLocked = computed(() => !connected.value || settingsBusy.value)
const canReset = computed(() => !aiLocked.value && aiMessages.value.length > 0)
const conflicted = computed(
  () => !saving.value && draftRevision.value !== context.value.revision,
)

function loadContext() {
  draft.value = context.value.text
  draftRevision.value = context.value.revision
  error.value = ''
}

function openSettings() {
  loadContext()
  settings.value?.showModal()
}

function closeSettings() {
  if (!settingsBusy.value) settings.value?.close()
}

watch(context, (current, previous) => {
  if (
    settings.value?.open &&
    current.revision !== previous.revision &&
    draft.value === previous.text &&
    draftRevision.value === previous.revision
  )
    loadContext()
})

async function saveContext() {
  if (!connected.value || saving.value || draft.value === context.value.text)
    return
  const revision = conflicted.value
    ? context.value.revision
    : draftRevision.value
  saving.value = true
  error.value = ''
  try {
    await request('/context', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: draft.value, revision }),
    })
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Не удалось сохранить контекст.'
    return
  } finally {
    saving.value = false
  }
  closeSettings()
}

async function changeModel(id: string) {
  if (!connected.value || settingsBusy.value || id === model.value) return
  pendingModel.value = id
  error.value = ''
  try {
    await request('/model', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: id }),
    })
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Не удалось изменить модель.'
  } finally {
    pendingModel.value = null
  }
}

async function transcribeDictation(audio: Blob, signal: AbortSignal) {
  const form = new FormData()
  form.append('file', audio, 'fragment.wav')
  form.append('prompt', dictationPrompt.value)
  const response = await request('/transcriptions', {
    method: 'POST',
    body: form,
    signal,
  })
  const text: unknown = (await response.json().catch(() => null))?.text
  if (typeof text !== 'string')
    throw new Error('Сервер не вернул текст диктовки.')
  return text
}

async function sendMessage(channel: Channel, text: string) {
  await request('/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, author: me }),
  })
}

async function resetHistory() {
  if (
    !canReset.value ||
    !window.confirm(
      'Сбросить общую историю чата с ИИ для вас обоих? Базовый контекст сохранится.',
    )
  )
    return
  resetting.value = true
  error.value = ''
  try {
    await request('/history/ai', { method: 'DELETE' })
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'Не удалось сбросить историю.'
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped lang="scss">
.room {
  --room-page: #191a1c;
  --room-surface: #222325;
  --room-raised: #2e3033;
  --room-own: #323c48;
  --room-input: #282a2d;
  --room-code: #1b1d20;
  --room-text: #ececee;
  --room-muted: #b6b9c0;
  --room-line: #414348;
  --room-field-border: #6b6e76;
  --room-accent: #a4cafa;
  --room-on-accent: #17283d;
  --room-error: #ffa8a8;
  --room-online: #6bcd98;
  --room-offline: #ff9393;
  --room-highlight: #e7c37d;

  background: var(--room-page);
  color: var(--room-text);
  color-scheme: dark;
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100dvh;
  padding: 4px;

  &[data-theme='light'] {
    --room-page: #eeeef0;
    --room-surface: #fff;
    --room-raised: #{$palette-bg};
    --room-own: #e8f3ff;
    --room-input: #fff;
    --room-code: #fff;
    --room-text: #{$color-main};
    --room-muted: #{$color-comment};
    --room-line: #d9d9d9;
    --room-field-border: #818a95;
    --room-accent: #1664ad;
    --room-on-accent: #fff;
    --room-error: #a32121;
    --room-online: #197242;
    --room-offline: #b02d3b;
    --room-highlight: #ffe294;

    color-scheme: light;
  }

  .t-title {
    color: var(--room-text);
  }

  :focus-visible {
    outline: 2px solid var(--room-accent);
    outline-offset: 1px;
  }
}

.connection {
  color: var(--room-muted);
  font-size: $size-comment;
}

dialog {
  background: var(--room-surface);
  border: 1px solid var(--room-line);
  border-radius: 12px;
  color: var(--room-text);
  margin: auto;
  max-height: calc(100dvh - 16px);
  overscroll-behavior: contain;
  padding: 0;
  width: min(520px, calc(100% - 16px));

  &::backdrop {
    background: rgb(0 0 0 / 45%);
  }
}

.settings-content {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.settings-header,
.actions {
  align-items: center;
  display: flex;
  gap: 8px;
}

.settings-header {
  justify-content: space-between;
}

.actions {
  flex-wrap: wrap;
}

.settings-section {
  border-top: 1px solid var(--room-line);
  display: grid;
  gap: 10px;
  padding-top: 10px;
}

.options {
  border: 0;
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 0;

  legend {
    color: var(--room-muted);
    font-size: $size-comment;
    margin-bottom: 4px;
  }
}

.theme-options {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.option {
  align-items: center;
  border: 1px solid var(--room-line);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  font-size: $size-main;
  gap: 8px;
  min-height: 34px;
  padding: 4px 10px;

  input {
    accent-color: var(--room-accent);
  }

  &:has(:checked) {
    background: var(--room-own);
    border-color: var(--room-accent);
  }
}

.editor {
  color: var(--room-muted);
  display: grid;
  font-size: $size-comment;
  gap: 6px;

  textarea {
    background: var(--room-input);
    border: 1px solid var(--room-field-border);
    border-radius: 8px;
    color: var(--room-text);
    font-size: 16px;
    max-height: 40dvh;
    min-width: 0;
    padding: 8px 10px;
    resize: vertical;
  }
}

.action {
  background: var(--room-raised);
  border: none;
  border-radius: 6px;
  color: var(--room-text);
  cursor: pointer;
  font-size: $size-comment;
  min-height: 28px;
  padding: 3px 9px;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.close {
  align-items: center;
  display: inline-flex;
  font-size: 20px;
  justify-content: center;
  line-height: 1;
  min-width: 32px;
}

.primary {
  background: var(--room-accent);
  color: var(--room-on-accent);
}

.reset {
  justify-self: start;
}

.error {
  color: var(--room-error);
  font-size: $size-comment;
}
</style>
