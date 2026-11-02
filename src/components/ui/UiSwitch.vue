<template>
  <input
    class="ui-switch"
    type="checkbox"
    role="switch"
    :checked="modelValue"
    :disabled="disabled"
    @change="onChange"
  />
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; disabled?: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<style scoped lang="scss">
.ui-switch {
  appearance: none;
  background-color: $palette-bg;
  border: 2px solid #d0d0d0;
  border-radius: 28px;
  cursor: pointer;
  flex-shrink: 0;
  height: 28px;
  margin: 0;
  position: relative;
  transition: background-color 0.15s;
  width: 48px;

  &::before {
    background-color: $color-comment;
    border-radius: 50%;
    content: '';
    height: 18px;
    left: 4px;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transition: 0.15s;
    width: 18px;
  }

  &:checked {
    background-color: $palette-blue;
    border-color: $palette-blue;

    &::before {
      background-color: #fff;
      height: 22px;
      left: 20px;
      width: 22px;
    }
  }

  &:focus-visible {
    outline: 2px solid $palette-blue;
    outline-offset: 3px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
}
</style>
