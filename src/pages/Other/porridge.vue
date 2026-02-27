<template>
  <div class="main">
    <div class="panel">
      <div class="title">Генератор каш</div>

      <label class="field">
        <span class="label">Желаемая калорийность, ккал</span>
        <input
          class="input"
          type="number"
          inputmode="numeric"
          min="1"
          v-model.number="target"
          placeholder="Введите ккал"
        />
      </label>

      <div class="info">
        <div>База (без масла): <b>{{ BASE_CAL }}</b> ккал</div>
        <div>Максимум (с маслом): <b>{{ MAX_CAL }}</b> ккал</div>
      </div>

      <template v-if="target > 0">
        <div class="grains">
          <div class="section-title">Крупа</div>
          <div class="row" v-for="g in grains" :key="g.name">
            <span class="dot grain" />
            <span>{{ g.name }}</span>
            <span class="grams">{{ g.grams }} г</span>
          </div>
        </div>

        <div class="common">
          <div class="section-title">Общее для всех каш</div>
          <div class="row">
            <span class="dot sugar" />
            <span>Сахар</span>
            <span class="grams">{{ sugarG }} г</span>
          </div>
          <div class="row">
            <span class="dot water" />
            <span>Вода</span>
            <span class="grams">{{ waterG }} г</span>
          </div>
          <div class="row" v-if="oilG > 0">
            <span class="dot oil" />
            <span>Масло раст.</span>
            <span class="grams">{{ oilG }} г</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const GRAIN_CAL = 234
const OIL_CAL   = 341
const SUGAR_CAL = 300

const BASE_CAL = GRAIN_CAL + SUGAR_CAL
const MAX_CAL  = GRAIN_CAL + SUGAR_CAL + OIL_CAL

const BASE_OIL_G   = 38
const BASE_SUGAR_G  = 75
const BASE_WATER_G  = 450

const OIL_CAL_PER_G = OIL_CAL / BASE_OIL_G

const porridges = [
  { name: 'Овсянка',         baseG: 78 },
  { name: 'Манка',           baseG: 71 },
  { name: 'Кукурузная крупа', baseG: 65 },
]

const target = ref<number>(0)

const scale = computed(() => {
  const t = target.value
  if (t <= 0) return 0
  return t <= BASE_CAL ? t / BASE_CAL : 1
})

const sugarG = computed(() => Math.floor(BASE_SUGAR_G * scale.value))
const waterG = computed(() => Math.floor(BASE_WATER_G * scale.value))
const oilG = computed(() => {
  const t = target.value
  if (t <= BASE_CAL) return 0
  return Math.floor((t - BASE_CAL) / OIL_CAL_PER_G)
})

const grains = computed(() =>
  porridges.map((p) => ({
    name: p.name,
    grams: Math.floor(p.baseG * scale.value),
  })),
)
</script>

<style scoped>
.main {
  background-color: #fff;
  display: grid;
  inset: 0;
  min-height: 100dvh;
  place-items: start center;
  padding: 24px 0;
  position: fixed;
  overflow-y: auto;
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

.info {
  color: #444;
  display: grid;
  font-size: 14px;
  gap: 4px;
}

.common,
.grains {
  border: 1px solid #eee;
  border-radius: 12px;
  display: grid;
  gap: 8px;
  padding: 14px 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #444;
}

.row {
  align-items: center;
  display: flex;
  font-size: 15px;
  gap: 8px;
}

.grams {
  color: #222;
  font-weight: 600;
  margin-left: auto;
}

.dot {
  border-radius: 50%;
  flex-shrink: 0;
  height: 8px;
  width: 8px;
}

.dot.grain { background: #d4a06a; }
.dot.sugar { background: #eee; border: 1px solid #ccc; }
.dot.water { background: #7ec8e3; }
.dot.oil   { background: #f0c040; }
</style>
