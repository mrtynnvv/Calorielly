<template>
  <div
    ref="panes"
    class="panes"
    :class="{ stacked }"
    :style="{
      '--first': sizes[0] + 'fr',
      '--second': sizes[1] + 'fr',
      '--third': sizes[2] + 'fr',
    }"
  >
    <template v-for="(channel, index) in channels" :key="channel">
      <div
        :id="`sobes-${channel}-panel`"
        class="pane"
        :inert="sizes[index] === 0"
      >
        <slot
          :name="channel"
          :collapsed="sizes[index] === 0"
          :show-settings="index === settingsPane"
        />
      </div>
      <div
        v-if="index < 2"
        class="divider"
        role="separator"
        :aria-label="labels[index]"
        :aria-controls="`sobes-${channel}-panel sobes-${channels[index + 1]}-panel`"
        :aria-orientation="stacked ? 'horizontal' : 'vertical'"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(boundaries[index]!)"
        :aria-valuetext="Math.round(boundaries[index]!) + '%'"
        tabindex="0"
        @keydown="onKeyDown($event, index)"
        @pointerdown="startDrag($event, index)"
        @pointermove="moveDrag"
        @lostpointercapture="endDrag"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const channels = ['system', 'ai', 'chat'] as const
const labels = [
  'Граница между звуком компьютера и ИИ',
  'Граница между ИИ и чатом вдвоём',
]
const key = 'help-sobes.split-v2'

function loadBoundaries(): [number, number] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (Array.isArray(saved) && saved.length === 2) {
      const [first, second] = saved
      if (
        Number.isFinite(first) &&
        Number.isFinite(second) &&
        first >= 0 &&
        first <= second &&
        second <= 100
      )
        return [first, second]
    }
  } catch {
    // Older versions only saved the share of the AI pane.
  }
  const old = Number(localStorage.getItem('help-sobes.split'))
  const aiShare = old > 0 && old < 100 ? old : 60
  return [100 / 3, 100 / 3 + (aiShare * 2) / 3]
}

const boundaries = ref(loadBoundaries())
const sizes = computed(() => {
  const [first, second] = boundaries.value
  return [first, second - first, 100 - second] as const
})
const settingsPane = computed(() =>
  sizes.value[1] > 0 ? 1 : sizes.value[0] > 0 ? 0 : 2,
)
const panes = ref<HTMLElement | null>(null)
const portrait = window.matchMedia(
  '(max-width: 900px) and (orientation: portrait), (max-width: 480px)',
)
const stacked = ref(portrait.matches)
let drag: {
  id: number
  index: number
  handle: HTMLElement
  grabOffset: number
} | null = null

function save() {
  localStorage.setItem(key, JSON.stringify(boundaries.value))
}

function onOrientationChange() {
  if (drag?.handle.hasPointerCapture(drag.id))
    drag.handle.releasePointerCapture(drag.id)
  stacked.value = portrait.matches
}

onMounted(() => portrait.addEventListener('change', onOrientationChange))
onUnmounted(() => portrait.removeEventListener('change', onOrientationChange))

function setBoundary(index: number, position: number) {
  const value = Math.max(0, Math.min(100, position))
  const [first, second] = boundaries.value
  // Соседний разделитель можно подвинуть, даже когда две панели уже свёрнуты.
  boundaries.value =
    index === 0
      ? [value, Math.max(value, second)]
      : [Math.min(first, value), value]
}

function coordinate(event: PointerEvent) {
  return stacked.value ? event.clientY : event.clientX
}

function startDrag(event: PointerEvent, index: number) {
  if (drag || !event.isPrimary || event.button !== 0) return
  const handle = event.currentTarget as HTMLElement
  const rect = handle.getBoundingClientRect()
  event.preventDefault()
  handle.focus({ preventScroll: true })
  handle.setPointerCapture(event.pointerId)
  drag = {
    id: event.pointerId,
    index,
    handle,
    grabOffset: coordinate(event) - (stacked.value ? rect.top : rect.left),
  }
}

function moveDrag(event: PointerEvent) {
  if (drag?.id !== event.pointerId || !panes.value) return
  const box = panes.value.getBoundingClientRect()
  const grip = stacked.value
    ? drag.handle.offsetHeight
    : drag.handle.offsetWidth
  const available = (stacked.value ? box.height : box.width) - 2 * grip
  if (available <= 0) return
  const start = stacked.value ? box.top : box.left
  const offset = coordinate(event) - start - drag.index * grip - drag.grabOffset
  setBoundary(drag.index, (offset / available) * 100)
}

function endDrag(event: PointerEvent) {
  if (drag?.id !== event.pointerId) return
  drag = null
  save()
}

function onKeyDown(event: KeyboardEvent, index: number) {
  const value = boundaries.value[index]!
  switch (event.key) {
    case stacked.value ? 'ArrowUp' : 'ArrowLeft':
      setBoundary(index, value - 2)
      break
    case stacked.value ? 'ArrowDown' : 'ArrowRight':
      setBoundary(index, value + 2)
      break
    case 'Home':
      setBoundary(index, 0)
      break
    case 'End':
      setBoundary(index, 100)
      break
    default:
      return
  }
  event.preventDefault()
  save()
}
</script>

<style scoped lang="scss">
.panes {
  --grip: 10px;
  --tracks: minmax(0, var(--first)) var(--grip) minmax(0, var(--second))
    var(--grip) minmax(0, var(--third));

  display: grid;
  flex: 1;
  grid-template-columns: var(--tracks);
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
  min-width: 0;

  &.stacked {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: var(--tracks);
  }
}

.pane {
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  min-height: 0;
  min-width: 0;
  overflow: hidden;

  &[inert] {
    visibility: hidden;
  }
}

.divider {
  cursor: col-resize;
  display: grid;
  place-items: center;
  touch-action: none;
  user-select: none;

  &::after {
    background: var(--room-field-border);
    border-radius: 2px;
    content: '';
    height: 40px;
    width: 3px;
  }

  &:hover::after,
  &:focus-visible::after,
  &:active::after {
    background: var(--room-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--room-accent);
    outline-offset: -2px;
  }

  .stacked & {
    cursor: row-resize;

    &::after {
      height: 3px;
      width: 40px;
    }
  }
}

@media (pointer: coarse) {
  .panes {
    --grip: 24px;
  }
}
</style>
