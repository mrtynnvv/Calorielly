<template>
  <div class="main">
    <div class="panel">
      <div class="title">Годовой пробег</div>

      <label class="field">
        <span class="label">Текущий пробег, км</span>
        <input
          class="input"
          type="number"
          inputmode="numeric"
          min="0"
          v-model.number="odometer"
          placeholder="Введите текущий пробег"
        />
      </label>

      <div class="meta">
        <div>Точка отсчёта: 14 марта 2025 — {{ fmt(BASE_ODOM) }} км</div>
        <div>Прошло дней: {{ fmt1(elapsedDays) }}</div>
        <div v-if="deltaKm >= 0">Намотано: {{ fmt(deltaKm) }} км</div>
        <div v-else class="warn">Текущий пробег меньше точки отсчёта</div>
      </div>

      <div class="result">
        <div class="value">{{ fmt(annualized) }}</div>
        <div class="suffix">км/год</div>
      </div>

      <div class="sub">Среднесуточный: {{ fmt1(avgPerDay) }} км/день</div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const BASE_DATE = new Date(2025, 2, 14)
const BASE_ODOM = 148_816

const odometer = ref<number>(BASE_ODOM)
const now = ref<Date>(new Date())
let timerId: number | null = null

onMounted(() => {
  timerId = window.setInterval(() => (now.value = new Date()), 60_000)
})

onUnmounted(() => {
  if (timerId != null) clearInterval(timerId)
})

const elapsedDays = computed<number>(() => {
  const diff = now.value.getTime() - BASE_DATE.getTime()
  return diff > 0 ? diff / 86_400_000 : 0
})

const deltaKm = computed<number>(() => odometer.value - BASE_ODOM)

const avgPerDay = computed<number>(() => {
  const days = elapsedDays.value
  const delta = deltaKm.value
  if (days <= 0 || delta <= 0) return 0
  return delta / days
})

const annualized = computed<number>(() => {
  const daily = avgPerDay.value
  if (daily <= 0) return 0
  return daily * 365
})

function fmt(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(
    n,
  )
}

function fmt1(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(
    n,
  )
}
</script>

<style scoped>
.main {
  background-color: #fff;
  display: grid;
  inset: 0;
  place-items: center;
  position: fixed;
  z-index: 999999;
}

.panel {
  background: #ffffff;
  border: 1px solid #eee;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  display: grid;
  gap: 16px;
  padding: 20px 24px;
  width: min(560px, 92vw);
}

.title {
  font-size: 20px;
  font-weight: 700;
}

.field {
  display: grid;
  gap: 6px;
}

.label {
  color: #666;
  font-size: 13px;
}

.input {
  appearance: none;
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 18px;
  outline: none;
  padding: 12px 14px;
}

.input:focus {
  border-color: #999;
}

.meta {
  color: #444;
  display: grid;
  font-size: 14px;
  gap: 4px;
}

.warn {
  color: #b30000;
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
</style>

