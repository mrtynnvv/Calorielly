<template>
  <div class="modal">
    <div class="logo">
      <img
        v-if="weightValue"
        class="image"
        src="@/assets/Feed/weight-white.svg"
      />
      <img v-else class="image" src="@/assets/Feed/pizza-white.svg" />
    </div>
    <div class="divider"></div>

    <div class="text" v-if="ccalValue">
      <p class="t-comment">Калорийность</p>
      <p class="t-main">{{ ccalValue }} ккал</p>
    </div>
    <div class="text" v-if="ccalName">
      <p class="t-comment">Описание</p>
      <p class="t-main">{{ ccalName }}</p>
    </div>
    <div class="text" v-if="measuredValue">
      <p class="t-comment">Дата</p>
      <p class="t-main">
        {{
          new Date(measuredValue).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        }}
      </p>
    </div>
    <div class="text" v-if="weightValue">
      <p class="t-comment">Вес</p>
      <p class="t-main">{{ weightValue }} кг</p>
    </div>

    <UiButtonRed
      class="ui-button-red"
      @click="deleteItem(idValue)"
      text="Удалить cобытие"
    />
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, watch } from 'vue'

import UiButtonRed from '@/components/ui/UiButtonRed.vue'
import { useUser } from '@/store/User'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE

const props = defineProps<{
  item: {
    id: string
    title: string
    calories: number
    weight: number
    measuredAt: string
  } | null
}>()

const idValue = ref<string>('')
const ccalValue = ref<number | null>(null)
const ccalName = ref<string>('')
const weightValue = ref<number | null>(null)
const measuredValue = ref<string>('')
const emit = defineEmits(['close'])

async function deleteItem(id: any) {
  try {
    await axios.delete(`${API_BASE}/users/me/entries/${id}`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })

    userStore.feedRevision++
    emit('close')
  } catch (e) {
    console.log(e)
  }
}

watch(
  () => props.item,
  (v) => {
    if (v) {
      ccalName.value = v.title
      ccalValue.value = v.calories
      idValue.value = v.id
      weightValue.value = v.weight
      measuredValue.value = v.measuredAt
    }
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
.modal {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  max-height: 99dvh;
  min-height: 0;
  overflow: hidden;

  .logo {
    background-color: #2688eb;
    border-radius: 100%;
    margin: 30px auto;
    max-width: 62px;
    padding: 14px;
    width: 100%;

    .image {
      width: 100%;
    }
  }

  .divider {
    background-color: #d6d6d6;
    height: 1px;
    width: 100%;
  }

  .text {
    margin-top: 20px;
  }
}
</style>
