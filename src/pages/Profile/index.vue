<template>
  <div class="mainBlockLogin">
    <AccountInfo />
  </div>
</template>

<script setup lang="ts">
import AccountInfo from './components/AccountInfo.vue'

defineProps({
  msg: String,
})
</script>

<style scoped lang="scss">
.mainBlockLogin {
  background-color: #fff;
  border: 0.5px solid #d9d9d9;
  border-radius: 16px;
  padding: 20px 22px;
}
</style>
