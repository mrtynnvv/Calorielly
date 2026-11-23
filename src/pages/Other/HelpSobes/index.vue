<template>
  <main class="room" aria-label="Комната на двоих">
    <p v-if="status" class="connection" role="status">{{ status }}</p>
    <div class="columns">
      <ChatPanel
        channel="ai"
        title="Чат с ИИ"
        placeholder="Вопрос для ИИ"
        :me="me"
        :messages="aiMessages"
        :busy="busy"
        :disabled="aiLocked"
        :send="sendMessage"
        :peer-selections="peerSelections"
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
      <ChatPanel
        channel="chat"
        title="Чат вдвоём"
        placeholder="Сообщение другу"
        :me="me"
        :messages="chatMessages"
        :disabled="!connected"
        :send="sendMessage"
      />
    </div>
    <dialog
      id="sobes-settings"
      ref="settings"
      aria-labelledby="sobes-settings-title"
      @click.self="closeSettings"
      @cancel.prevent="closeSettings"
    >
      <div class="settings-content">
        <header class="settings-header">
          <h2 id="sobes-settings-title" class="t-title">Параметры чата с ИИ</h2>
          <button
            class="action close"
            type="button"
            aria-label="Закрыть параметры"
            :disabled="settingsBusy"
            @click="closeSettings"
          >
            <img src="@/assets/close-gray.svg" alt="" width="16" height="16" />
          </button>
        </header>
        <p v-if="status" class="connection" role="status">{{ status }}</p>
        <fieldset
          v-if="models.length"
          class="models"
          :disabled="!connected || saving || resetting"
          :aria-busy="!!pendingModel"
        >
          <legend class="t-title">Модель</legend>
          <label v-for="option in models" :key="option.id" class="model-option">
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
          <label class="t-title" for="sobes-context"
            >Базовый контекст для ИИ</label
          >
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
          :disabled="!canReset"
          @click="resetHistory"
        >
          Сбросить историю ИИ
        </button>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>
    </dialog>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ChatPanel from './ChatPanel.vue'
import { type Channel, useRoom } from './useRoom'

const {
  me,
  context,
  model,
  models,
  busy,
  connected,
  status,
  aiMessages,
  chatMessages,
  peerSelections,
  publishSelection,
  request,
} = useRoom()
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

function sendMessage(channel: Channel, text: string) {
  return request('/messages', {
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
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100dvh;
  padding: 4px;
}

.connection {
  color: $color-comment;
  font-size: $size-comment;
}

.columns {
  display: grid;
  flex: 1;
  gap: 4px;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  min-height: 0;
}

dialog {
  border: 1px solid #d9d9d9;
  border-radius: 12px;
  color: $color-main;
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
  gap: 16px;
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

.models {
  border: 0;
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 0;

  legend {
    margin-bottom: 6px;
  }
}

.model-option {
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  font-size: $size-main;
  gap: 8px;
  min-height: 34px;
  padding: 4px 10px;

  input {
    accent-color: #1664ad;
  }

  &:has(:checked) {
    background: #e8f3ff;
    border-color: #1664ad;
  }
}

.editor {
  color: $color-comment;
  display: grid;
  font-size: $size-comment;
  gap: 6px;

  textarea {
    border: 1px solid #aeb4bc;
    border-radius: 8px;
    color: $color-main;
    font-size: 16px;
    max-height: 40dvh;
    min-width: 0;
    padding: 8px 10px;
    resize: vertical;
  }
}

.action {
  background: $palette-bg;
  border: none;
  border-radius: 6px;
  color: $color-main;
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
  justify-content: center;
  min-width: 32px;
}

.primary {
  background: #1664ad;
  color: #fff;
}

.reset {
  justify-self: start;
}

.error {
  color: #a32121;
  font-size: $size-comment;
}

@media (width <= 680px) and (orientation: portrait), (width <= 480px) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 3fr) minmax(0, 2fr);
  }
}
</style>
