<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

// ОЧЕРЕДНОЕ ТЕХНИЧЕСКОЕ ОБСЛУЖИВАНИЕ:
const NEXT_SERVICE_ODOM = 19302

const SERVICE_APPOINTMENT_LEAD_KM = 500
const IDEAL_ANNUAL_KM = 33333

const BASE_DATE = new Date(2025, 11, 29)
const BASE_ODOM = 0
const SERVICE_APPOINTMENT_ODOM = NEXT_SERVICE_ODOM - SERVICE_APPOINTMENT_LEAD_KM

const odometer = ref<number>(BASE_ODOM)
const now = ref<Date>(new Date())
let timerId: number | null = null

onMounted(() => {
  timerId = window.setInterval(() => (now.value = new Date()), 60_000)
})

onUnmounted(() => {
  if (timerId != null) clearInterval(timerId)
})

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const elapsedDays = computed<number>(() => {
  const diff = startOfDay(now.value) - startOfDay(BASE_DATE)
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

const idealPerDay = computed<number>(() => IDEAL_ANNUAL_KM / 365)

const idealPerMonth = computed<number>(() => IDEAL_ANNUAL_KM / 12)

const idealOdomToday = computed<number>(() => {
  return BASE_ODOM + idealPerDay.value * elapsedDays.value
})

const idealDiffKm = computed<number>(() => odometer.value - idealOdomToday.value)

const idealDiffAbsKm = computed<number>(() => Math.abs(idealDiffKm.value))

const idealRestDays = computed<number>(() => {
  if (idealDiffKm.value <= 0) return 0
  return Math.ceil(idealDiffKm.value / idealPerDay.value)
})

const idealDiffLabel = computed<string>(() => {
  if (idealDiffKm.value > 0) return 'Перепробег'
  if (idealDiffKm.value < 0) return 'Недопробег'
  return 'Идёшь ровно по плану'
})

const plannedVisitDate = computed<string>(() => forecastDateText(SERVICE_APPOINTMENT_ODOM))

const latestVisitDate = computed<string>(() => forecastDateText(NEXT_SERVICE_ODOM))

function forecastDateByKmLeft(kmLeft: number): Date | null {
  const daily = avgPerDay.value
  if (daily <= 0 || kmLeft <= 0) return null

  const daysLeft = kmLeft / daily
  const date = new Date(now.value)
  date.setDate(date.getDate() + Math.ceil(daysLeft))
  return date
}

function forecastDateText(targetOdom: number): string {
  const kmLeft = targetOdom - odometer.value
  if (kmLeft < 0) return 'уже пройдено'
  if (kmLeft === 0) return 'сегодня'

  const date = forecastDateByKmLeft(kmLeft)
  return date ? fmtDate(date) : 'недостаточно данных'
}

function fmt(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n)
}

function fmt1(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n)
}

function fmtDate(d: Date): string {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(d)

  const day = parts.find((part) => part.type === 'day')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const year = parts.find((part) => part.type === 'year')?.value

  return [day, month, year].filter(Boolean).join(' ')
}
</script>

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
        <div>Точка отсчёта: 29 декабря 2025 — {{ fmt(BASE_ODOM) }} км</div>
        <div>Прошло дней: {{ fmt1(elapsedDays) }}</div>
        <div>
          Идеал: {{ fmt(IDEAL_ANNUAL_KM) }} км/год ({{ fmt(idealPerMonth) }} км/мес,
          {{ fmt1(idealPerDay) }} км/день)
        </div>
        <div>По плану на сегодня: {{ fmt(idealOdomToday) }} км</div>
        <div :class="{ warn: idealDiffKm > 0 }">
          {{ idealDiffLabel }}<template v-if="idealDiffKm !== 0">: {{ fmt(idealDiffAbsKm) }} км</template>
          <template v-if="idealRestDays > 0"> (не ездить {{ idealRestDays }} дней)</template>
        </div>
        <div v-if="deltaKm < 0" class="warn">Текущий пробег меньше точки отсчёта</div>
      </div>

      <div class="result">
        <div class="value">{{ fmt(annualized) }}</div>
        <div class="suffix">км/год</div>
      </div>

      <div class="sub">Среднесуточный: {{ fmt1(avgPerDay) }} км/день</div>

      <div class="dates">
        <div class="date-row">
          <div class="date-label">Планируемая дата посещения ДЦ</div>
          <div class="date-value">{{ plannedVisitDate }}</div>
          <div class="date-note">на пробеге {{ fmt(SERVICE_APPOINTMENT_ODOM) }} км</div>
        </div>

        <div class="date-row date-row_danger">
          <div class="date-label">Крайняя планируемая дата</div>
          <div class="date-value">{{ latestVisitDate }}</div>
          <div class="date-note">красная зона {{ fmt(NEXT_SERVICE_ODOM) }} км</div>
        </div>
      </div>
    </div>
  </div>
</template>

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
  background: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgb(0 0 0 / 6%);
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

.dates {
  display: grid;
  gap: 12px;
}

.date-row {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 12px;
  display: grid;
  gap: 6px;
  padding: 14px;
}

.date-row_danger {
  border-color: #f0c8c8;
}

.date-row_danger .date-value {
  color: #b30000;
}

.date-label {
  color: #666;
  font-size: 13px;
}

.date-value {
  color: #111;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
}

.date-note {
  color: #666;
  font-size: 13px;
}
</style>
