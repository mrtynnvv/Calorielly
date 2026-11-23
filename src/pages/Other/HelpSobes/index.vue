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
      >
        <template #actions>
          <div class="actions">
            <div v-if="models.length" class="model-select">
              <UiSelect
                aria-label="Модель ИИ"
                :model-value="model"
                :options="modelOptions"
                :disabled="!connected || changingModel"
                @update:model-value="changeModel"
              />
            </div>
            <button
              ref="editButton"
              class="action"
              :disabled="!connected || editing"
              @click="openEditor"
            >
              Обновить контекст
            </button>
            <button class="action" :disabled="!canReset" @click="resetHistory">
              Сбросить историю ИИ
            </button>
          </div>
        </template>
        <template #context>
          <form
            v-if="editing"
            class="editor"
            @submit.prevent="saveContext"
            @keydown.esc.prevent="closeEditor"
          >
            <label for="sobes-context">Базовый контекст для ИИ</label>
            <textarea
              id="sobes-context"
              ref="editor"
              v-model="draft"
              rows="4"
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
                :disabled="!connected || saving || draft === context.text"
              >
                {{
                  saving
                    ? 'Сохранение…'
                    : conflicted
                      ? 'Сохранить мою версию'
                      : 'Сохранить'
                }}
              </button>
              <button
                v-if="conflicted"
                class="action"
                type="button"
                @click="loadContext"
              >
                Загрузить сохранённый текст
              </button>
              <button
                type="button"
                class="action"
                :disabled="saving"
                @click="closeEditor"
              >
                Отмена
              </button>
            </div>
          </form>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
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
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import ChatPanel from './ChatPanel.vue'
import { type Channel, useRoom } from './useRoom'

import UiSelect from '@/components/ui/UiSelect.vue'

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
  request,
} = useRoom()
const editButton = ref<HTMLButtonElement | null>(null)
const editor = ref<HTMLTextAreaElement | null>(null)
const editing = ref(false)
const draft = ref('')
const draftRevision = ref(0)
const saving = ref(false)
const resetting = ref(false)
const changingModel = ref(false)
const modelOptions = computed(() =>
  models.value.map(({ id, label }) => ({ value: id, label })),
)
const error = ref('')
const aiLocked = computed(
  () =>
    !connected.value || resetting.value || saving.value || changingModel.value,
)
const canReset = computed(
  () => connected.value && !resetting.value && aiMessages.value.length > 0,
)
const conflicted = computed(
  () => !saving.value && draftRevision.value !== context.value.revision,
)

function loadContext() {
  draft.value = context.value.text
  draftRevision.value = context.value.revision
  error.value = ''
}

async function openEditor() {
  loadContext()
  editing.value = true
  await nextTick()
  editor.value?.focus()
}

async function closeEditor() {
  if (saving.value) return
  editing.value = false
  error.value = ''
  await nextTick()
  editButton.value?.focus()
}

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
  await closeEditor()
}

async function changeModel(id: string) {
  if (!connected.value || changingModel.value || id === model.value) return
  changingModel.value = true
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
    changingModel.value = false
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
  gap: 10px;
  height: 100dvh;
  margin: 0 auto;
  max-width: 1600px;
  padding: clamp(10px, 2vw, 28px);
}

.connection {
  color: $color-comment;
  font-size: $size-main;
}

.columns {
  display: grid;
  flex: 1;
  gap: 14px;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  min-height: 0;
}

.actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.model-select {
  width: min(230px, 100%);
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
    font-size: $size-main;
    min-width: 0;
    padding: 8px 10px;
    resize: none;
  }
}

.action {
  background: $palette-bg;
  border: none;
  border-radius: 8px;
  color: $color-main;
  cursor: pointer;
  font-size: $size-comment;
  min-height: 32px;
  padding: 4px 10px;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.primary {
  background: #1664ad;
  color: #fff;
}

.error {
  color: #a32121;
  font-size: $size-comment;
}

@media (width <= 760px) {
  .room {
    height: auto;
  }

  .columns {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(2, max(440px, 70dvh));
  }
}
</style>
