<template>
  <div class="modal">
    <div class="logo">
      <img class="pizza" src="@/assets/Feed/pizza-white.svg" />
    </div>
    <div class="divider"></div>

    <div class="text">
      <p class="t-comment">Калорийность</p>
      <p class="t-main">{{ ccalValue }} ккал</p>
    </div>
    <div class="text">
      <p class="t-comment">Вес</p>
      <p class="t-main">{{ grValue }} гр</p>
    </div>
    <div class="text">
      <p class="t-comment">Описание</p>
      <p class="t-main">{{ ccalName }} ккал</p>
    </div>

    <UiButton class="ui-button" @click="addCcal" text="Добавить в меню" />

    <UiButtonRed
      class="ui-button-red"
      @click="deleteFavorite(idValue)"
      text="Удалить из избранного"
    />
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, watch } from 'vue'

import UiButton from '@/components/ui/UiButton.vue'
import UiButtonRed from '@/components/ui/UiButtonRed.vue'
import { useUser } from '@/store/User'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE

const props = defineProps<{
  item: { id: string; title: string; calories: number; grams: number } | null
}>()

const idValue = ref<string>('')
const ccalValue = ref<number | null>(null)
const ccalName = ref<string>('')
const grValue = ref<number | null>(null)
const emit = defineEmits(['close', 'close-all'])

async function addCcal() {
  try {
    await axios.post(
      `${API_BASE}/users/me/foods`,
      {
        title: ccalName.value,
        calories: ccalValue.value,
        grams: grValue.value,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      },
    )
    userStore.feedRevision++
    emit('close-all')
  } catch (e) {
    console.log(e)
  }
}

async function deleteFavorite(id: any) {
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
      grValue.value = v.grams
      idValue.value = v.id
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

    .pizza {
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

  .ui-button-red {
    margin-top: 10px;
  }
}
</style>
