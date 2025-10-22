<template>
  <a class="back" @click="stepBack"><img src="@/assets/Auth/back.svg" /></a>
  <UiInput v-model="password1" placeholder="Пароль" type="password" />
  <UiInput
    class="ui-input2"
    placeholder="Повторите пароль"
    v-model="password2"
    type="password"
  />
  <UiButton text="Продолжить" @click="checkPassword" />
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import { useUser } from '@/store/User'
const API_BASE = import.meta.env.VITE_API_BASE
const router = useRouter()
const userStore = useUser()
const password1 = ref('')
const password2 = ref('')

const props = defineProps<{ login: string }>()

const emit = defineEmits<{
  (e: 'change-step', value: string): void
}>()
function stepBack() {
  emit('change-step', 'reg1')
}

async function checkPassword() {
  if (password1.value === password2.value) {
    try {
      const { data } = await axios.post(
        `${API_BASE}/auth/register`,
        {
          phone: props.login,
          password: password1.value,
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
}
</script>

<style scoped lang="scss">
.back {
  background: none;
  border: none;
  cursor: pointer;
  left: 10px;
  padding: 10px;
  position: absolute;
  top: 10px;

  img {
    width: 26px;
  }
}

.ui-input2 {
  margin-top: 18px;
}
</style>
