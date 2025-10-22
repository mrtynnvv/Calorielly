<template>
  <UiInput v-model="login" placeholder="+7 000 000 00 00" />
  <UiInput
    class="pass"
    v-if="showPasswordInput"
    type="password"
    v-model="password"
    placeholder="Введите пароль"
  />
  <UiButton
    v-if="!showPasswordInput"
    text="Продолжить"
    @click="openPasswordInput"
  />
  <UiButton v-if="showPasswordInput" text="Войти" @click="enter" />
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import { useUser } from '@/store/User'
const API_BASE = import.meta.env.VITE_API_BASE
const userStore = useUser()
const router = useRouter()

const login = ref('+7')
const password = ref('')
const showPasswordInput = ref(false)
function openPasswordInput() {
  //включает инпут пароля
  if (login.value.length === 12) {
    showPasswordInput.value = true
  }
}
async function enter() {
  try {
    const { data } = await axios.post(
      `${API_BASE}/auth/login`,
      {
        phone: login.value,
        password: password.value,
      },
      {
        headers: {
          'Content-type': 'application/json',
        },
      },
    )
    userStore.token = data.accessToken
    router.push('/feed')
  } catch (e) {
    console.log(e)
  }
}
</script>

<style scoped lang="scss">
.pass {
  margin-top: 14px;
}
</style>
