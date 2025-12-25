<template>
  <div class="main">
    <div class="panel">
      <div class="title-row">
        <div class="title">Cook</div>
        <div class="subtitle">Готово к {{ finishTimeText }}</div>
      </div>

      <div class="grid">
        <div
          v-for="item in items"
          :key="item.key"
          class="card"
        >
          <div class="card-head">
            <div class="card-title">{{ item.name }}</div>
            <div class="card-meta">{{ item.minutes }} мин</div>
          </div>
          <div class="card-value">{{ fmtHM(item.delayMs) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type Recipe = {
  key: string
  name: string
  minutes: number
}

const FINISH_HOUR = 6
const FINISH_MINUTE = 30

const recipes: Recipe[] = [
  { key: 'oatmeal', name: 'Овсяная', minutes: 40 },
  { key: 'semolina', name: 'Манная', minutes: 15 },
  { key: 'milk', name: 'Кукурузная', minutes: 60 },
]

const now = ref<Date>(new Date())
let timerId: number | null = null

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function getNextFinishTime(d: Date): Date {
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  const todayFinish = new Date(y, m, day, FINISH_HOUR, FINISH_MINUTE, 0, 0)
  if (todayFinish > d) return todayFinish
  return new Date(y, m, day + 1, FINISH_HOUR, FINISH_MINUTE, 0, 0)
}

const finishAt = computed<Date>(() => getNextFinishTime(now.value))
const finishTimeText = computed<string>(
  () => `${pad(FINISH_HOUR)}:${pad(FINISH_MINUTE)}`,
)

type RecipeView = Recipe & {
  delayMs: number
}

const items = computed<RecipeView[]>(() => {
  const finish = finishAt.value.getTime()
  const nowMs = now.value.getTime()
  return recipes.map((recipe) => {
    const cookMs = recipe.minutes * 60_000
    const delayRawMs = finish - cookMs - nowMs
    const delayMs =
      delayRawMs <= 0 ? 0 : Math.floor(delayRawMs / 600_000) * 600_000
    return { ...recipe, delayMs }
  })
})

function fmtHM(ms: number): string {
  const safe = Math.max(0, ms)
  const h = Math.floor(safe / 3_600_000)
  const m = Math.floor((safe % 3_600_000) / 60_000)
  return `${pad(h)}:${pad(m)}`
}

function tick(): void {
  now.value = new Date()
}

onMounted(() => {
  tick()
  timerId = window.setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timerId != null) clearInterval(timerId)
})
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
  padding: 20px 22px;
  width: min(860px, 94vw);
}

.title-row {
  align-items: baseline;
  display: flex;
  justify-content: space-between;
}

.title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #667085;
  font-size: 13px;
  font-weight: 700;
}

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.card {
  border: 1px solid #eef0f4;
  border-radius: 16px;
  display: grid;
  gap: 8px;
  padding: 14px 14px 12px;
}

.card-head {
  align-items: baseline;
  display: flex;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 800;
}

.card-meta {
  color: #667085;
  font-size: 12px;
  font-weight: 700;
}

.card-value {
  font-size: 44px;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
}
</style>
