<template>
  <UiInput v-model="login" placeholder="+7 000 000 00 00" />
  <UiButton text="Продолжить" @click="checkLogin" />

  <a href="/demo">
    <UiButtonGray class="ui-button-gray" text="Демо режим" />
  </a>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import UiButton from '@/components/ui/UiButton.vue'
import UiButtonGray from '@/components/ui/UiButtonGray.vue'
import UiInput from '@/components/ui/UiInput.vue'

const login = ref('+7')

const emit = defineEmits<{
  (e: 'send-value', value: string): void
  (e: 'change-step', value: string): void
}>()
function checkLogin() {
  emit('send-value', login.value)

  emit('change-step', 'reg2')
}
</script>

<style scoped lang="scss">
.ui-button-gray {
  margin-top: 10px;
}
</style>
