<template>
  <button class="ui-button">
    {{ text }}
  </button>
</template>

<script setup lang="ts">
defineProps({ text: { type: String } })
</script>

<style scoped lang="scss">
.ui-button {
    background-color: rgba(0, 0, 0, 0.04);
  border: none;
  border-radius: 8px;
  color: #2688eb;
  font-size: 15px;
  font-weight: 600;
  height: 40px;
  margin-top: 20px;
  transition: 0.3s;
  width: 100%;

  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: 0.3s;
  }
}
</style>
