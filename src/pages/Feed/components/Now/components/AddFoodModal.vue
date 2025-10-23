<template>
  <div class="login">
    <div class="title">Добавить прием пищи</div>
    <div class="nameInput">Калорийность</div>
    <UiInput
      placeholder="Введите количество калорий"
      v-model.number="ccalValue"
      type="number"
    />
    <div class="nameInput">Вес</div>
    <UiInput
      placeholder="Введите количество грамм"
      v-model.number="grValue"
      type="number"
    />
    <div class="nameInput">Название</div>
    <UiInput
      placeholder="Введите название продукта"
      v-model.trim="ccalName"
      type="string"
    />

    <UiButton @click="addCcal()" text="Добавить" />
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

const ccalValue = ref(null)
const ccalName = ref('')
const grValue = ref(null)

async function addCcal() {
  try {
    await axios.post(
      `${API_BASE}/users/me/foods`,
      {
        title: ccalName.value,
        calories: ccalValue.value,
        grams: grValue.value,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      },
    )
    userStore.feedRevision++
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
