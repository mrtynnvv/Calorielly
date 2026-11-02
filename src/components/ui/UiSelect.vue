<template>
  <div ref="selectRef" class="ui-select" @focusout="closeOnBlur">
    <button
      ref="buttonRef"
      class="trigger"
      :class="{ open }"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open ? `${listId}-${activeIndex}` : undefined"
      :disabled="disabled"
      v-bind="$attrs"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="value">{{ selectedLabel }}</span>
      <img src="@/assets/Header/arrow-down.svg" alt="" />
    </button>
    <ul
      v-if="open"
      :id="listId"
      ref="listRef"
      class="options"
      role="listbox"
      :aria-multiselectable="multiple || undefined"
    >
      <li
        v-for="(option, index) in options"
        :id="`${listId}-${index}`"
        :key="optionValue(option)"
        class="option"
        :class="{
          active: index === activeIndex,
          selected: isSelected(optionValue(option)),
        }"
        role="option"
        :aria-selected="isSelected(optionValue(option))"
        @mousedown.prevent
        @mousemove="activeIndex = index"
        @click="choose(index)"
      >
        <span class="value">{{ optionLabel(option) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts" generic="T extends number | string[] = number">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

defineOptions({ inheritAttrs: false })
type Option = number | { value: string; label: string }
const props = defineProps<{
  modelValue: T | null
  options: Option[]
  disabled?: boolean
  leadingZero?: boolean
  multiple?: boolean
  placeholder?: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
}>()
const selectRef = ref<HTMLDivElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const listRef = ref<HTMLUListElement | null>(null)
const listId = useId()
const open = ref(false)
const activeIndex = ref(0)
const selectedLabel = computed(() => {
  const selected = props.options.filter((option) =>
    isSelected(optionValue(option)),
  )
  return selected.length
    ? selected.map(optionLabel).join(', ')
    : (props.placeholder ?? '—')
})

function optionValue(option: Option) {
  return typeof option === 'object' ? option.value : option
}

function optionLabel(option: Option) {
  if (typeof option === 'object') return option.label
  return props.leadingZero ? String(option).padStart(2, '0') : option
}

function isSelected(value: string | number) {
  return Array.isArray(props.modelValue)
    ? typeof value === 'string' && props.modelValue.includes(value)
    : props.modelValue === value
}

function toggle() {
  if (props.disabled || !props.options.length) return
  if (!open.value)
    activeIndex.value = Math.max(
      0,
      props.options.findIndex((option) => isSelected(optionValue(option))),
    )
  open.value = !open.value
}

function choose(index: number) {
  const option = props.options[index]
  if (option === undefined) return
  const value = optionValue(option)
  if (props.multiple) {
    const selected = Array.isArray(props.modelValue) ? props.modelValue : []
    emit(
      'update:modelValue',
      (isSelected(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]) as T,
    )
  } else {
    emit('update:modelValue', value as T)
    open.value = false
  }
  buttonRef.value?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab' || event.key === 'Escape') {
    open.value = false
    return
  }
  if (
    !['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)
  )
    return
  event.preventDefault()
  if (props.disabled || !props.options.length) return
  if (!open.value) {
    toggle()
    if (event.key !== 'Home' && event.key !== 'End') return
  } else if (event.key === 'Enter' || event.key === ' ') {
    choose(activeIndex.value)
    return
  }
  if (event.key === 'Home') activeIndex.value = 0
  else if (event.key === 'End') activeIndex.value = props.options.length - 1
  else {
    const step = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = Math.max(
      0,
      Math.min(props.options.length - 1, activeIndex.value + step),
    )
  }
}

function closeOutside(event: PointerEvent) {
  if (!selectRef.value?.contains(event.target as Node)) open.value = false
}

function closeOnBlur(event: FocusEvent) {
  if (!selectRef.value?.contains(event.relatedTarget as Node | null))
    open.value = false
}

watch(
  [open, activeIndex],
  ([isOpen], [wasOpen]) => {
    const list = listRef.value
    const option = list?.children[activeIndex.value] as HTMLElement | undefined
    if (!isOpen || !list || !option) return

    if (!wasOpen) {
      list.scrollTop =
        option.offsetTop - (list.clientHeight - option.offsetHeight) / 2
    } else if (option.offsetTop < list.scrollTop) {
      list.scrollTop = option.offsetTop
    } else if (
      option.offsetTop + option.offsetHeight >
      list.scrollTop + list.clientHeight
    ) {
      list.scrollTop =
        option.offsetTop + option.offsetHeight - list.clientHeight
    }
  },
  { flush: 'post' },
)
onMounted(() => document.addEventListener('pointerdown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside))
</script>

<style scoped lang="scss">
.ui-select {
  position: relative;
  width: 100%;

  .value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trigger {
    align-items: center;
    background-color: $palette-bg;
    border: 0.5px solid #d0d0d0;
    border-radius: 8px;
    color: #161616;
    cursor: pointer;
    display: flex;
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
    gap: 8px;
    height: 40px;
    justify-content: space-between;
    padding: 0 12px;
    text-align: left;
    width: 100%;

    &:focus-visible {
      border: 1px solid $palette-blue;
      outline: none;
    }

    &:disabled {
      cursor: default;
      opacity: 0.5;
    }

    &.open {
      border: 1px solid $palette-blue;
      border-radius: 8px 8px 0 0;

      img {
        transform: rotate(180deg);
      }
    }

    img {
      flex-shrink: 0;
      height: 8px;
      width: 12px;
    }
  }

  .options {
    background-color: #fff;
    border: 0.5px solid #d0d0d0;
    border-radius: 0 0 8px 8px;
    border-top: none;
    box-shadow: 0 2px 4px rgb(0 0 0 / 12%);
    left: 0;
    list-style: none;
    margin: 0;
    max-height: 160px;
    overflow-y: auto;
    padding: 0;
    position: absolute;
    right: 0;
    scrollbar-color: #b5b5b5 transparent;
    scrollbar-width: thin;
    top: 100%;
    z-index: 20;
  }

  .option {
    align-items: center;
    color: #161616;
    cursor: pointer;
    display: flex;
    font-size: 16px;
    font-weight: 500;
    height: 40px;
    padding: 0 36px 0 12px;
    position: relative;
    white-space: nowrap;

    &.active,
    &.selected {
      background-color: $palette-bg;
    }

    &.selected::after {
      border-bottom: 2px solid $palette-blue;
      border-right: 2px solid $palette-blue;
      content: '';
      height: 10px;
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
      width: 6px;
    }
  }
}
</style>
