<template>
  <input
    class="ui-input"
    :value="modelValue ?? ''"
    @input="onInput"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number | null
  modelModifiers?: { number?: boolean; trim?: boolean }
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'input', ev: Event): void
}>()

function onInput(e: Event) {
  let val: string | number = (e.target as HTMLInputElement).value

  if (props.modelModifiers?.trim) {
    val = (val as string).trim()
  }

  if (props.modelModifiers?.number) {
    const n = parseFloat(val as string)
    if (!Number.isNaN(n)) val = n
  }

  emit('update:modelValue', val)
  emit('input', e)
}
</script>
<style scoped lang="scss">
.ui-input {
  background-color: $palette-bg;
  border: solid;
  border-color: #d0d0d0;
  border-radius: 8px;
  border-width: 0.5px;
  color: #161616;
  font-size: 16px;
  font-weight: 500;
  height: 40px;
  padding-left: 7px;
  width: 100%;

  &::placeholder {
    color: #7e7e7e;
    font-size: 15px;
    font-weight: 500;
  }

  &:focus {
    border: 1px solid #2688eb;
    outline: none;
  }

  &:disabled {
    color: $color-comment;
    cursor: not-allowed;
    opacity: 0.6;
  }
}
</style>
