<template>
  <span class="byline" :title="presence && statusLabels[presence]">
    <span
      v-if="presence"
      class="dot"
      :data-presence="presence"
      role="img"
      :aria-label="statusLabels[presence]"
    />
    {{ name }}
    <time v-if="time" :datetime="createdAt || undefined" :title="time.full">{{
      time.short
    }}</time>
  </span>
</template>

<script lang="ts">
import { computed } from 'vue'

const clock = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})
const calendar = new Intl.DateTimeFormat('ru-RU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const statusLabels = {
  online: 'В сети',
  offline: 'Не в сети',
  unknown: 'Статус неизвестен',
}
</script>

<script setup lang="ts">
const props = defineProps<{
  name: string
  presence?: keyof typeof statusLabels
  createdAt?: string | null
}>()
const time = computed(() => {
  if (!props.createdAt) return null
  const timestamp = Date.parse(props.createdAt)
  return Number.isFinite(timestamp)
    ? { short: clock.format(timestamp), full: calendar.format(timestamp) }
    : null
})
</script>

<style scoped lang="scss">
.byline {
  align-items: center;
  display: flex;
  gap: 5px;
}

.dot {
  background-color: var(--room-muted);
  border-radius: 50%;
  flex: none;
  height: 7px;
  width: 7px;
}

[data-presence='online'] {
  background-color: var(--room-online);
}

[data-presence='offline'] {
  background-color: var(--room-offline);
}

time {
  font-variant-numeric: tabular-nums;
  font-weight: normal;
}
</style>
