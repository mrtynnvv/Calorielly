<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const SALARY = 100_000
const PAYDAY_DAY = 5
const MS_IN_DAY = 86_400_000

const balance = ref<number>(SALARY)
const now = ref<Date>(new Date())
let timerId: number | null = null

onMounted(() => {
  timerId = window.setInterval(() => (now.value = new Date()), 60_000)
})

onUnmounted(() => {
  if (timerId != null) clearInterval(timerId)
})

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function paydayDate(year: number, month: number): Date {
  const payday = new Date(year, month, PAYDAY_DAY)
  const weekday = payday.getDay()

  if (weekday === 6) payday.setDate(payday.getDate() - 1)
  if (weekday === 0) payday.setDate(payday.getDate() - 2)

  return stripTime(payday)
}

function dayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_IN_DAY
}

function diffDays(from: Date, to: Date): number {
  return Math.max(0, dayNumber(to) - dayNumber(from))
}

const cycleStart = computed<Date>(() => {
  const today = stripTime(now.value)
  const year = today.getFullYear()
  const month = today.getMonth()
  const thisMonthPayday = paydayDate(year, month)

  if (today >= thisMonthPayday) return thisMonthPayday
  return paydayDate(year, month - 1)
})

const nextPayday = computed<Date>(() => {
  const start = cycleStart.value
  return paydayDate(start.getFullYear(), start.getMonth() + 1)
})

const totalDays = computed<number>(() =>
  Math.max(1, diffDays(cycleStart.value, nextPayday.value)),
)

const elapsedDays = computed<number>(() =>
  Math.min(totalDays.value, diffDays(cycleStart.value, now.value)),
)

const remainingDays = computed<number>(() =>
  Math.max(0, totalDays.value - elapsedDays.value),
)

const currentDayNumber = computed<number>(() =>
  Math.min(totalDays.value, elapsedDays.value + 1),
)

const dailyPlanned = computed<number>(() => SALARY / totalDays.value)

const shouldRemain = computed<number>(() =>
  Math.max(0, SALARY - dailyPlanned.value * elapsedDays.value),
)

const safeBalance = computed<number>(() =>
  Number.isFinite(balance.value) ? Math.max(0, balance.value) : 0,
)

const delta = computed<number>(() =>
  Math.round(safeBalance.value - shouldRemain.value),
)

const dailyFromNow = computed<number>(() => {
  const days = Math.max(1, remainingDays.value)
  return safeBalance.value / days
})

const paceDays = computed<number>(() =>
  Math.abs(delta.value / dailyPlanned.value),
)

const statusTitle = computed<string>(() => {
  if (delta.value > 0) return 'Тратишь медленнее плана'
  if (delta.value < 0) return 'Тратишь быстрее плана'
  return 'Идёшь точно по плану'
})

function fmtMoney(v: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(
    Math.round(v),
  )
}

function fmtDays(v: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(v)
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(d)
}
</script>

<template>
  <div class="main">
    <div class="panel">
      <div class="title-row">
        <div class="title">Темп расходов</div>
        <div class="date">Сегодня {{ fmtDate(now) }}</div>
      </div>

      <div class="chips">
        <div class="chip">Зарплата: {{ fmtMoney(SALARY) }} ₽</div>
        <div class="chip">Следующая: {{ fmtDate(nextPayday) }}</div>
        <div class="chip">
          Период: {{ fmtDate(cycleStart) }} → {{ fmtDate(nextPayday) }}
        </div>
      </div>

      <div class="payday-note">
        Выплата 5-го числа. Если это выходной — в предыдущую пятницу.
      </div>

      <label class="field">
        <span class="label">Текущий баланс, ₽</span>
        <input
          v-model.number="balance"
          class="input"
          type="number"
          inputmode="decimal"
          min="0"
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
            На начало дня · день {{ currentDayNumber }} из {{ totalDays }}
          </div>
        </div>

        <div class="card">
          <div class="card-label">Можно тратить в день с текущего баланса</div>
          <div class="card-value">{{ fmtMoney(dailyFromNow) }} ₽</div>
          <div class="card-sub">
            Осталось {{ remainingDays }} дн. до выплаты
          </div>
        </div>
      </div>

      <div
        class="status"
        :class="{ ok: delta > 0, warn: delta < 0, exact: delta === 0 }"
      >
        <div class="status-title">{{ statusTitle }}</div>

        <div v-if="delta > 0" class="status-text">
          Недорасход: <b>{{ fmtMoney(delta) }} ₽</b>. Это запас примерно на
          {{ fmtDays(paceDays) }} дн. по плану.
        </div>

        <div v-else-if="delta < 0" class="status-text">
          Перерасход: <b>{{ fmtMoney(Math.abs(delta)) }} ₽</b>. Ты опережаешь
          план расходов примерно на {{ fmtDays(paceDays) }} дн.
        </div>

        <div v-else class="status-text">
          Текущий баланс совпадает с плановым остатком.
        </div>
      </div>

      <div class="footnote">
        Баланс считается остатком от текущей зарплаты в
        {{ fmtMoney(SALARY) }} ₽.
      </div>
    </div>
  </div>
</template>

<style scoped>
.main {
  background-color: #f8f9fb;
  display: grid;
  inset: 0;
  overflow-y: auto;
  padding: 24px 0;
  place-items: start center;
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
  gap: 12px;
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

.payday-note,
.footnote {
  color: #6c6f78;
  font-size: 13px;
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
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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

.status.exact {
  background: #f1f3f7;
  color: #2f3136;
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
  .main {
    padding: 12px 0;
  }

  .panel {
    gap: 14px;
    padding: 18px 16px;
  }

  .title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .card-value {
    font-size: 24px;
  }
}
</style>
