<template>
  <UiBlock class="settings">
    <p class="t-title">Настройки целей</p>

    <div class="fields">
      <div class="field">
        <label class="t-main" for="desired-weight">Желаемый вес</label>
        <UiInput
          id="desired-weight"
          v-model.number="weight"
          placeholder="Вес, кг"
          type="number"
          min="10"
          max="300"
          step="1"
          :disabled="!loaded || saving || userStore.token === 'demo'"
        />
      </div>
      <div class="field">
        <label class="t-main" for="daily-calories"
          >Суточный лимит калорий</label
        >
        <UiInput
          id="daily-calories"
          v-model.number="ccal"
          placeholder="Ккал"
          type="number"
          min="800"
          max="7000"
          step="1"
          :disabled="
            !loaded || scheduleEnabled || saving || userStore.token === 'demo'
          "
        />
        <p v-if="scheduleEnabled" class="t-comment">
          В расширенном режиме действуют лимиты приёмов пищи.
        </p>
      </div>
    </div>

    <div class="schedule">
      <div class="header">
        <label class="t-main" for="meal-schedule-enabled">
          Расширенная модель приёмов пищи
        </label>
        <UiSwitch
          id="meal-schedule-enabled"
          v-model="scheduleEnabled"
          :disabled="!loaded || saving"
        />
      </div>

      <template v-if="scheduleEnabled">
        <div class="field">
          <label class="t-main" for="meal-count">Количество приёмов</label>
          <UiSelect
            id="meal-count"
            v-model="mealCount"
            :options="mealCounts"
            :disabled="saving"
          />
        </div>

        <div v-for="(meal, index) in meals" :key="index" class="meal">
          <p class="t-main">Приём пищи {{ index + 1 }}</p>
          <div class="fields">
            <div class="field">
              <label class="t-main" :for="`meal-hours-${index}`">Время</label>
              <div class="time">
                <UiSelect
                  :id="`meal-hours-${index}`"
                  :model-value="
                    meal.time ? Number(meal.time.slice(0, 2)) : null
                  "
                  :options="mealHours"
                  :aria-label="`Часы приёма ${index + 1}`"
                  :disabled="saving"
                  leading-zero
                  @update:model-value="setMealTime(meal, 'hours', $event)"
                />
                <span class="t-main" aria-hidden="true">:</span>
                <UiSelect
                  :model-value="meal.time ? Number(meal.time.slice(3)) : null"
                  :options="meal.time.startsWith('23:') ? [0] : mealMinutes"
                  :aria-label="`Минуты приёма ${index + 1}`"
                  :disabled="saving || !meal.time"
                  leading-zero
                  @update:model-value="setMealTime(meal, 'minutes', $event)"
                />
              </div>
            </div>
            <div class="field">
              <label class="t-main" :for="`meal-calories-${index}`"
                >Лимит калорий</label
              >
              <UiInput
                :id="`meal-calories-${index}`"
                v-model.number="meal.calories"
                type="number"
                placeholder="Лимит калорий"
                min="1"
                max="2147483647"
                step="1"
                :disabled="saving"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
    <UiButton
      :disabled="!canSave"
      :text="saving ? 'Сохранение...' : 'Сохранить'"
      @click="saveSettings()"
    />
    <p v-if="message" class="message t-comment" role="status">
      {{ message }}
    </p>
  </UiBlock>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, ref, watch } from 'vue'

import UiBlock from '@/components/ui/UiBlock.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import { useUser } from '@/store/User'
import {
  getMealScheduleError,
  type Meal,
  type MealSchedule,
} from '@/utils/mealSchedule'

const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE
const loaded = ref(false)
const saving = ref(false)
const message = ref('')
const weight = ref<number | null>(null)
const savedWeight = ref<number | null>(null)
const ccal = ref<number | null>(null)
const savedCcal = ref<number | null>(null)
const scheduleEnabled = ref(false)
const savedScheduleEnabled = ref(false)
const meals = ref<Meal[]>([])
const savedMeals = ref<Meal[]>([])
const mealCounts = Array.from({ length: 7 }, (_, index) => index + 2)
const mealHours = Array.from({ length: 23 }, (_, index) => index + 1)
const mealMinutes = Array.from({ length: 60 }, (_, index) => index)
const weightChanged = computed(() => weight.value !== savedWeight.value)
const ccalChanged = computed(() => ccal.value !== savedCcal.value)
const scheduleChanged = computed(() => {
  if (scheduleEnabled.value !== savedScheduleEnabled.value) return true
  if (!scheduleEnabled.value && getMealScheduleError(meals.value)) return false
  return (
    meals.value.length !== savedMeals.value.length ||
    meals.value.some(
      (meal, index) =>
        meal.time !== savedMeals.value[index]?.time ||
        meal.calories !== savedMeals.value[index]?.calories,
    )
  )
})
const canSave = computed(
  () =>
    loaded.value &&
    !saving.value &&
    userStore.token !== 'demo' &&
    (weightChanged.value || ccalChanged.value || scheduleChanged.value),
)
const mealCount = computed({
  get: () => meals.value.length || 2,
  set: (count: number) => {
    meals.value = Array.from(
      { length: count },
      (_, index) => meals.value[index] ?? { time: '', calories: null },
    )
  },
})

function setMealTime(meal: Meal, part: 'hours' | 'minutes', value: number) {
  const time = meal.time ? meal.time.split(':') : ['01', '00']
  time[part === 'hours' ? 0 : 1] = String(value).padStart(2, '0')
  if (time[0] === '23') time[1] = '00'
  meal.time = time.join(':')
}

watch(scheduleEnabled, (enabled) => {
  if (enabled && meals.value.length === 0) mealCount.value = 2
  message.value = ''
})

async function getSettings() {
  try {
    const config = { headers: { Authorization: `Bearer ${userStore.token}` } }
    const [weightResponse, ccalResponse, scheduleResponse] = await Promise.all([
      axios.get<{ desiredWeight: number | null }>(
        `${API_BASE}/users/me/desired-weight`,
        config,
      ),
      axios.get<{ dailyCalorieLimit: number | null }>(
        `${API_BASE}/users/me/calorie-limit`,
        config,
      ),
      axios.get<MealSchedule>(`${API_BASE}/users/me/meal-schedule`, config),
    ])
    weight.value = weightResponse.data.desiredWeight
    savedWeight.value = weightResponse.data.desiredWeight
    ccal.value = ccalResponse.data.dailyCalorieLimit
    savedCcal.value = ccalResponse.data.dailyCalorieLimit
    meals.value = scheduleResponse.data.meals
    savedMeals.value = scheduleResponse.data.meals.map((meal) => ({ ...meal }))
    scheduleEnabled.value = scheduleResponse.data.enabled
    savedScheduleEnabled.value = scheduleResponse.data.enabled
    loaded.value = true
  } catch (e) {
    console.log(e)
    message.value = 'Не удалось загрузить настройки. Обновите страницу.'
  }
}
getSettings()

async function saveSettings() {
  if (!canSave.value) return
  if (
    weightChanged.value &&
    (weight.value === null ||
      !Number.isInteger(weight.value) ||
      weight.value < 10 ||
      weight.value > 300)
  ) {
    message.value = 'Укажите желаемый вес целым числом от 10 до 300 кг.'
    return
  }
  if (
    ccalChanged.value &&
    (ccal.value === null ||
      !Number.isInteger(ccal.value) ||
      ccal.value < 800 ||
      ccal.value > 7000)
  ) {
    message.value = 'Укажите суточный лимит целым числом от 800 до 7000 ккал.'
    return
  }
  const scheduleError = getMealScheduleError(meals.value)
  if (scheduleChanged.value && scheduleEnabled.value && scheduleError) {
    message.value = scheduleError
    return
  }

  saving.value = true
  message.value = ''
  let completed = false
  try {
    const config = { headers: { Authorization: `Bearer ${userStore.token}` } }
    if (weightChanged.value) {
      const { data } = await axios.patch<{ desiredWeight: number }>(
        `${API_BASE}/users/me/desired-weight`,
        { value: weight.value },
        config,
      )
      weight.value = data.desiredWeight
      savedWeight.value = data.desiredWeight
      userStore.feedRevision++
      completed = true
    }
    if (ccalChanged.value) {
      const { data } = await axios.patch<{ dailyCalorieLimit: number }>(
        `${API_BASE}/users/me/calorie-limit`,
        { value: ccal.value },
        config,
      )
      ccal.value = data.dailyCalorieLimit
      savedCcal.value = data.dailyCalorieLimit
      userStore.feedRevision++
      completed = true
    }
    if (scheduleChanged.value) {
      const { data } = await axios.patch<MealSchedule>(
        `${API_BASE}/users/me/meal-schedule`,
        {
          enabled: scheduleEnabled.value,
          meals: scheduleError ? savedMeals.value : meals.value,
        },
        config,
      )
      meals.value = data.meals
      savedMeals.value = data.meals.map((meal) => ({ ...meal }))
      scheduleEnabled.value = data.enabled
      savedScheduleEnabled.value = data.enabled
      userStore.feedRevision++
      completed = true
    }
    message.value =
      !scheduleEnabled.value &&
      scheduleError &&
      completed &&
      meals.value.length > 0
        ? 'Настройки сохранены. Незавершённые изменения расписания не сохранены.'
        : 'Настройки сохранены.'
  } catch (e) {
    console.log(e)
    message.value = completed
      ? 'Часть настроек сохранена. Повторите сохранение оставшихся изменений.'
      : 'Не удалось сохранить настройки. Попробуйте ещё раз.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.settings {
  padding: 24px;

  @media (width <=600px) {
    padding: 16px;
  }

  .fields {
    display: grid;
    gap: 20px;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    margin-top: 20px;

    @media (width <=600px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .field label {
    color: $color-comment;
    display: block;
    margin-bottom: 6px;
  }

  .field .t-comment {
    margin-top: 8px;
  }

  .message {
    margin-top: 12px;
  }

  .ui-select {
    width: 80px;
  }

  .ui-button {
    margin-top: 24px;
    padding: 0 18px;
    width: auto;
  }

  .schedule {
    margin-top: 32px;

    > .field {
      margin-top: 20px;
    }

    .header {
      align-items: center;
      display: flex;
      gap: 16px;
      justify-content: space-between;
    }

    .meal {
      margin-top: 24px;

      .fields {
        margin-top: 10px;
      }
    }

    .time {
      align-items: center;
      display: flex;
      gap: 8px;
    }
  }
}
</style>
