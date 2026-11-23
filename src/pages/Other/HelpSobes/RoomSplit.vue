<template>
  <div
    ref="panes"
    class="panes"
    :style="{ '--first': share + 'fr', '--second': 100 - share + 'fr' }"
  >
    <slot name="ai" />
    <div
      ref="divider"
      class="divider"
      role="separator"
      aria-label="Размер чата с ИИ"
      aria-controls="sobes-ai-panel"
      :aria-orientation="stacked ? 'horizontal' : 'vertical'"
      :aria-valuemin="minimum"
      :aria-valuemax="100 - minimum"
      :aria-valuenow="Math.round(share)"
      :aria-valuetext="Math.round(share) + '%'"
      tabindex="0"
      @keydown="onKeyDown"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @lostpointercapture="endDrag"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const key = 'help-sobes.split'
const saved = Number(localStorage.getItem(key))
const preferred = ref(saved > 0 && saved < 100 ? saved : 60)
const panes = ref<HTMLElement | null>(null)
const divider = ref<HTMLElement | null>(null)
const stacked = ref(false)
const available = ref(0)
const minimum = computed(() =>
  available.value
    ? Math.min(
        45,
        Math.ceil(((stacked.value ? 150 : 220) / available.value) * 100),
      )
    : 0,
)

function clamp(value: number) {
  return Math.max(minimum.value, Math.min(100 - minimum.value, value))
}

const share = computed(() => clamp(preferred.value))
let drag: { id: number; coordinate: number; share: number } | null = null

function measure() {
  const box = panes.value
  const handle = divider.value
  if (!box || !handle) return
  const horizontal = handle.offsetWidth > handle.offsetHeight
  if (drag && horizontal !== stacked.value && handle.hasPointerCapture(drag.id))
    handle.releasePointerCapture(drag.id)
  stacked.value = horizontal
  available.value = horizontal
    ? box.clientHeight - handle.offsetHeight
    : box.clientWidth - handle.offsetWidth
}

const observer = new ResizeObserver(measure)
onMounted(() => {
  if (!panes.value || !divider.value) return
  measure()
  observer.observe(panes.value)
  observer.observe(divider.value)
})
onUnmounted(() => observer.disconnect())

function coordinate(event: PointerEvent) {
  return stacked.value ? event.clientY : event.clientX
}

function startDrag(event: PointerEvent) {
  const handle = divider.value
  if (drag || !handle || !event.isPrimary || event.button !== 0) return
  event.preventDefault()
  handle.focus({ preventScroll: true })
  handle.setPointerCapture(event.pointerId)
  drag = {
    id: event.pointerId,
    coordinate: coordinate(event),
    share: share.value,
  }
}

function moveDrag(event: PointerEvent) {
  if (drag?.id !== event.pointerId || !available.value) return
  const delta = (coordinate(event) - drag.coordinate) / available.value
  preferred.value = clamp(drag.share + delta * 100)
}

function endDrag(event: PointerEvent) {
  if (drag?.id !== event.pointerId) return
  drag = null
  localStorage.setItem(key, String(preferred.value))
}

function onKeyDown(event: KeyboardEvent) {
  const previous = stacked.value ? 'ArrowUp' : 'ArrowLeft'
  const next = stacked.value ? 'ArrowDown' : 'ArrowRight'
  switch (event.key) {
    case previous:
      preferred.value = clamp(share.value - 2)
      break
    case next:
      preferred.value = clamp(share.value + 2)
      break
    case 'Home':
      preferred.value = minimum.value
      break
    case 'End':
      preferred.value = 100 - minimum.value
      break
    default:
      return
  }
  event.preventDefault()
  localStorage.setItem(key, String(preferred.value))
}
</script>

<style scoped lang="scss">
.panes {
  --grip: 10px;

  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, var(--first)) var(--grip) minmax(
      0,
      var(--second)
    );
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
  min-width: 0;
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
}

@media (pointer: coarse) {
  .panes {
    --grip: 24px;
  }
}

@media (width <= 680px) and (orientation: portrait), (width <= 480px) {
  .panes {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, var(--first)) var(--grip) minmax(
        0,
        var(--second)
      );
  }

  .divider {
    cursor: row-resize;

    &::after {
      height: 3px;
      width: 40px;
    }
  }
}
</style>
