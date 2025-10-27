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
  background-color: rgb(0 0 0 / 4%);
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
    background-color: rgb(0 0 0 / 8%);
    cursor: pointer;
    transition: 0.3s;
  }
}
</style>
