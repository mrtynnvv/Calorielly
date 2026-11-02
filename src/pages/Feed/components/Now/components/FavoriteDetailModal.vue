<template>
  <div class="modal">
    <div class="logo">
      <img class="pizza" src="@/assets/Feed/pizza-white.svg" />
    </div>
    <div class="divider"></div>

    <div class="text">
      <p class="t-comment">Калорийность</p>
      <p class="t-main">{{ item?.calories }} ккал</p>
    </div>
    <div class="text">
      <p class="t-comment">Описание</p>
      <p class="t-main">{{ item?.title }}</p>
    </div>

    <UiButton
      :disabled="saving || userStore.token === 'demo'"
      @click="addCcal(false)"
      text="Добавить сейчас"
    />

    <UiButton
      v-if="scheduledTime"
      class="scheduled"
      :disabled="saving || userStore.token === 'demo'"
      :text="`Добавить на ${scheduledTime}`"
      @click="addCcal(true)"
    />

    <UiButtonRed
      class="ui-button-red"
      :disabled="saving || userStore.token === 'demo'"
      @click="deleteFavorite"
      text="Удалить из избранного"
    />
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import UiButton from '@/components/ui/UiButton.vue'
import UiButtonRed from '@/components/ui/UiButtonRed.vue'
import { useUser } from '@/store/User'
import {
  getCaloriePeriod,
  getMealEatenAt,
  type MealSchedule,
} from '@/utils/mealSchedule'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE

const props = defineProps<{
  item: { id: string; title: string; calories: number } | null
}>()

const schedule = ref<MealSchedule>({ enabled: false, meals: [] })
const now = ref(new Date())
const saving = ref(false)
const scheduledTime = computed(() => {
  const { mealIndex } = getCaloriePeriod(now.value, 0, schedule.value)
  const meal = mealIndex === null ? undefined : schedule.value.meals[mealIndex]
  return meal && props.item && meal.favoriteIds.includes(props.item.id)
    ? meal.time
    : null
})
const emit = defineEmits(['close', 'close-all'])
let clockTimer: ReturnType<typeof setTimeout>

function updateClock() {
  now.value = new Date()
  clearTimeout(clockTimer)
  clockTimer = setTimeout(updateClock, 60000 - (Date.now() % 60000))
}

onMounted(updateClock)
onBeforeUnmount(() => clearTimeout(clockTimer))

async function getMealSchedule() {
  try {
    const { data } = await axios.get<MealSchedule>(
      `${API_BASE}/users/me/meal-schedule`,
      { headers: { Authorization: `Bearer ${userStore.token}` } },
    )
    schedule.value = data
  } catch (e) {
    console.log(e)
  }
}
getMealSchedule()

async function addCcal(scheduled: boolean) {
  const favorite = props.item
  if (!favorite || saving.value || userStore.token === 'demo') return
  now.value = new Date()
  const time = scheduledTime.value
  if (scheduled && !time) return
  saving.value = true
  try {
    await axios.post(
      `${API_BASE}/users/me/foods`,
      {
        title: favorite.title,
        calories: favorite.calories,
        ...(scheduled && time
          ? { eatenAt: getMealEatenAt(time, now.value) }
          : {}),
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
  } finally {
    saving.value = false
  }
}

async function deleteFavorite() {
  if (!props.item || saving.value || userStore.token === 'demo') return
  saving.value = true
  try {
    await axios.delete(`${API_BASE}/users/me/entries/${props.item.id}`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })

    userStore.feedRevision++
    emit('close')
  } catch (e) {
    console.log(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.modal {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  max-height: 99dvh;
  min-height: 0;
  overflow-y: auto;

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

  .ui-button-red,
  .scheduled {
    margin-top: 10px;
  }
}
</style>
