<template>
  <div class="main">
    <div class="panel">
      <div class="title-row">
        <div class="title">Калории с пятницы</div>
        <button class="btn" type="button" @click="refresh" :disabled="loading">
          {{ loading ? '...' : 'Обновить' }}
        </button>
      </div>

      <div class="chips">
        <div class="chip">Период: {{ fmtDateTime(periodStart) }} → сейчас</div>
      </div>

      <div class="result">
        <div class="value">{{ fmtNumber(calories) }}</div>
        <div class="suffix">ккал</div>
      </div>

      <div class="sub">
        обновлено
        {{ updatedAtMs === 0 ? '—' : `${backMinutes} мин назад` }}
      </div>

      <div class="meta" v-if="dailyLimit > 0">
        К сегодняшнему вечеру должно быть:
        <b>{{ fmtNumber(shouldByTodayEvening) }}</b> ккал
        <span class="meta-sub"> ({{ fmtNumber(dailyLimit) }} ккал/день) </span>
      </div>

      <div v-if="error" class="warn">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { useUser } from '@/store/User'

const API_BASE = import.meta.env.VITE_API_BASE
const userStore = useUser()

type Food = { calories: number | string; eatenAt: string }

const now = ref<Date>(new Date())
let timerId: number | null = null

const periodStart = ref<Date>(getFridayStart(now.value))

const calories = ref<number>(0)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
let refreshQueued = false

const dailyLimit = ref<number>(0)

const updatedAtMs = ref<number>(0)
const backMinutes = computed<number>(() => {
  if (updatedAtMs.value === 0) return 0
  const diffMs = now.value.getTime() - updatedAtMs.value
  return Math.max(0, Math.round(diffMs / 60_000))
})

const shouldByTodayEvening = computed<number>(() => {
  if (dailyLimit.value <= 0) return 0
  const start = periodStart.value
  const end = new Date(now.value)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 1)
  const diffMs = end.getTime() - start.getTime()
  const days = Math.max(1, Math.round(diffMs / 86_400_000))
  return dailyLimit.value * days
})

function getFridayStart(d: Date): Date {
  const start = new Date(d)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = (day - 5 + 7) % 7
  start.setDate(start.getDate() - diff)
  return start
}

function fmtDateTime(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function fmtNumber(v: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(
    Math.round(v),
  )
}

async function loadDailyLimit(): Promise<void> {
  try {
    const { data } = await axios.get(`${API_BASE}/users/me/calorie-limit`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    dailyLimit.value = Number(data?.dailyCalorieLimit) || 0
  } catch (e) {
    console.log(e)
    dailyLimit.value = 0
  }
}

async function refresh(): Promise<void> {
  if (loading.value) {
    refreshQueued = true
    return
  }
  loading.value = true
  error.value = null
  try {
    const start = getFridayStart(new Date())
    periodStart.value = start
    const end = new Date()

    const { data } = await axios.get<Food[]>(`${API_BASE}/users/me/foods`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })

    calories.value = data.reduce((s, item) => {
      const eatenAt = new Date(item.eatenAt)
      if (eatenAt < start || eatenAt > end) return s
      const c = Number(item.calories)
      if (!Number.isFinite(c)) return s
      return s + c
    }, 0)

    updatedAtMs.value = Date.now()
  } catch (e) {
    console.log(e)
    error.value = 'Не удалось загрузить калории'
  } finally {
    loading.value = false
    if (refreshQueued) {
      refreshQueued = false
      refresh()
    }
  }
}

function tick(): void {
  now.value = new Date()
  const nextStart = getFridayStart(now.value)
  if (nextStart.getTime() !== periodStart.value.getTime()) {
    periodStart.value = nextStart
    refresh()
  }
}

onMounted(() => {
  tick()
  timerId = window.setInterval(tick, 60_000)
  loadDailyLimit()
  refresh()
})

onUnmounted(() => {
  if (timerId != null) clearInterval(timerId)
})

watch(
  () => userStore.feedRevision,
  () => {
    loadDailyLimit()
    refresh()
  },
)
</script>

<style scoped>
.main {
  background-color: #f8f9fb;
  display: grid;
  inset: 0;
  place-items: center;
  position: fixed;
  z-index: 999999;
}

.panel {
  background: #fff;
  border: 1px solid #e8eaef;
  border-radius: 18px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 6%);
  display: grid;
  gap: 16px;
  padding: 22px 26px;
  width: min(720px, 94vw);
}

.title-row {
  align-items: baseline;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.title {
  font-size: 22px;
  font-weight: 700;
}

.btn {
  background: #111;
  border: 0;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 12px;
}

.btn:disabled {
  cursor: default;
  opacity: 0.6;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  background: #f1f3f6;
  border: 1px solid #e5e7ec;
  border-radius: 999px;
  color: #333;
  font-size: 13px;
  padding: 6px 10px;
}

.result {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 6px;
}

.value {
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
}

.suffix {
  color: #666;
  font-weight: 600;
}

.sub {
  color: #666;
  font-size: 14px;
  text-align: center;
}

.meta {
  color: #333;
  font-size: 14px;
  text-align: center;
}

.meta-sub {
  color: #666;
  font-weight: 500;
}

.warn {
  color: #b30000;
  font-size: 14px;
  text-align: center;
}
</style>
