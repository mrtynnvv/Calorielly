<template>
  <div class="login">
    <div class="title">Обновить вес</div>
    <div class="nameInput">Текущий вес</div>
    <UiInput
      placeholder="Введите свой вес"
      v-model="weightValue"
      type="number"
    />

    <UiButton @click="addWeight()" text="Обновить" />
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import { useUser } from '@/store/User'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE

const weightValue = ref(null)
async function addWeight() {
  try {
    await axios.post(
      `${API_BASE}/users/me/weights`,
      {
        weight: weightValue.value,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      },
    )
    userStore.feedRevision++
    weightValue.value = null
  } catch (e) {
    console.log(e)
  }
}
</script>

<style scoped lang="scss">
.login {
  .title {
    font-size: 17px;
    font-weight: 600;
    margin-top: 18px;
  }

  .nameInput {
    color: rgb(88 99 111);
    font-size: 15px;
    font-weight: 500;
    margin-top: 18px;
  }
}
</style>
