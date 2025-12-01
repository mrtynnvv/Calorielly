<template>
  <div class="main">
    <div class="panel">
      <div class="title-row">
        <div class="title">До зарплаты</div>
        <div class="date">Сегодня {{ fmtDate(now) }}</div>
      </div>

      <div class="chips">
        <div class="chip">Старт: {{ fmtMoney(START_AMOUNT) }} ₽</div>
        <div class="chip">День выплаты: {{ PAYDAY_DAY }}</div>
        <div class="chip">
          Период: {{ fmtDate(cycleStart) }} → {{ fmtDate(nextPayday) }}
        </div>
      </div>

      <label class="field">
        <span class="label">Текущий остаток, ₽</span>
        <input
          class="input"
          type="number"
          inputmode="decimal"
          min="0"
          v-model.number="balance"
          placeholder="Сколько осталось сейчас"
        />
      </label>

      <div class="grid">
        <div class="card">
          <div class="card-label">Плановый лимит в день</div>
          <div class="card-value">{{ fmtMoney(dailyPlanned) }} ₽</div>
          <div class="card-sub">{{ totalDays }} дней в периоде</div>
        </div>
        <div class="card">
          <div class="card-label">По плану должно остаться</div>
          <div class="card-value">{{ fmtMoney(shouldRemain) }} ₽</div>
          <div class="card-sub">
            День {{ currentDayNumber }} из {{ totalDays }}
          </div>
        </div>
        <div class="card">
          <div class="card-label">
            Лимит в день, чтобы дотянуть
            <span v-if="remainingDays === 0">(выплата сегодня)</span>
          </div>
          <div class="card-value">{{ fmtMoney(dailyFromNow) }} ₽</div>
          <div class="card-sub">
            Осталось {{ remainingDays === 0 ? '0' : remainingDays }} дн. до
            выплаты
          </div>
        </div>
      </div>

      <div class="status" :class="{ ok: delta >= 0, warn: delta < 0 }">
        <div class="status-title">
          {{ delta >= 0 ? 'Вы в плюсе по плану' : 'Перерасход' }}
        </div>
        <div class="status-text">
          {{
            delta >= 0 ? 'Запас относительно плана:' : 'Нужно вернуть в план:'
          }}
          {{ fmtMoney(Math.abs(delta)) }} ₽
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const START_AMOUNT = 45_000
const PAYDAY_DAY = 15

const balance = ref<number>(START_AMOUNT)
const now = ref<Date>(new Date())
let timerId: number | null = null

const MS_IN_DAY = 86_400_000

onMounted(() => {
  timerId = window.setInterval(() => (now.value = new Date()), 60_000)
})

onUnmounted(() => {
  if (timerId != null) clearInterval(timerId)
})

function stripTime(d: Date): Date {
  const t = new Date(d)
  t.setHours(0, 0, 0, 0)
  return t
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function paydayDate(year: number, month: number): Date {
  const safeDay = Math.min(PAYDAY_DAY, daysInMonth(year, month))
  return stripTime(new Date(year, month, safeDay))
}

function diffDays(a: Date, b: Date): number {
  const diff = stripTime(b).getTime() - stripTime(a).getTime()
  return Math.max(0, Math.round(diff / MS_IN_DAY))
}

const cycleStart = computed<Date>(() => {
  const today = stripTime(now.value)
  const y = today.getFullYear()
  const m = today.getMonth()
  const thisMonth = paydayDate(y, m)
  if (today >= thisMonth) return thisMonth
  return paydayDate(y, m - 1)
})

const nextPayday = computed<Date>(() => {
  const start = cycleStart.value
  return paydayDate(start.getFullYear(), start.getMonth() + 1)
})

const totalDays = computed<number>(() =>
  Math.max(1, diffDays(cycleStart.value, nextPayday.value)),
)

const currentDayNumber = computed<number>(() =>
  Math.min(totalDays.value, elapsedDays.value + 1),
)

const elapsedDays = computed<number>(() =>
  Math.min(totalDays.value, diffDays(cycleStart.value, now.value)),
)

const remainingDays = computed<number>(() =>
  Math.max(0, totalDays.value - elapsedDays.value),
)

const dailyPlanned = computed<number>(() => START_AMOUNT / totalDays.value)

const shouldRemain = computed<number>(() => {
  const spent = dailyPlanned.value * elapsedDays.value
  return Math.max(0, START_AMOUNT - spent)
})

const safeBalance = computed<number>(() =>
  Number.isFinite(balance.value) ? balance.value : 0,
)

const delta = computed<number>(() => safeBalance.value - shouldRemain.value)

const dailyFromNow = computed<number>(() => {
  const days = remainingDays.value === 0 ? 1 : remainingDays.value
  return safeBalance.value / days
})

function fmtMoney(v: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(
    Math.round(v),
  )
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(d)
}
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
  gap: 18px;
  padding: 22px 26px;
  width: min(720px, 94vw);
}

.title-row {
  align-items: baseline;
  display: flex;
  justify-content: space-between;
}

.title {
  font-size: 22px;
  font-weight: 800;
}

.date {
  color: #6c6f78;
  font-size: 14px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  background: #f1f3f7;
  border-radius: 999px;
  color: #2f3136;
  font-size: 13px;
  padding: 8px 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.label {
  color: #6c6f78;
  font-size: 13px;
}

.input {
  appearance: none;
  background: #fbfcfe;
  border: 1px solid #dfe3ea;
  border-radius: 12px;
  font-size: 18px;
  outline: none;
  padding: 12px 14px;
}

.input:focus {
  border-color: #7d8cff;
  box-shadow: 0 0 0 3px rgb(125 140 255 / 12%);
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.card {
  background: linear-gradient(180deg, #f9fbff 0%, #f4f6fb 100%);
  border: 1px solid #e5e9f2;
  border-radius: 14px;
  display: grid;
  gap: 6px;
  padding: 14px 16px;
}

.card-label {
  color: #5c6069;
  font-size: 13px;
}

.card-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}

.card-sub {
  color: #6c6f78;
  font-size: 12px;
}

.status {
  border: 1px solid #e5e9f2;
  border-radius: 14px;
  padding: 14px 16px;
}

.status.ok {
  background: #e9f7ec;
  border-color: #b7e0c0;
  color: #1f6a36;
}

.status.warn {
  background: #fff2f0;
  border-color: #f7c7be;
  color: #9c1e15;
}

.status-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
}

.status-text {
  font-size: 14px;
}

@media (width <= 520px) {
  .panel {
    padding: 18px 16px;
  }

  .card-value {
    font-size: 24px;
  }
}
</style>
