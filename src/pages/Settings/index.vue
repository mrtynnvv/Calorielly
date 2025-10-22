<template>
  <div class="mainBlockSettings">
    <div class="title">Настройки целей</div>

    <div class="nameInput">Желаемый вес</div>
    <div>
      <UiInput placeholder="Вес кг" v-model.number="weight" type="number" />
    </div>
    <div>
      <UiButton @click="editDesiredWeight()" text="Изменить" />
    </div>

    <div class="nameInput">Лимит калорий</div>
    <div>
      <UiInput placeholder="Ккал" v-model.number="ccal" type="number" />
    </div>

    <UiButton @click="editLimitCcal()" text="Изменить" />
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

const weight = ref<number | null>(null)
const ccal = ref<number | null>(null)

defineProps({
  msg: String,
})

async function editDesiredWeight() {
  try {
    const { data } = await axios.patch(
      `${API_BASE}/users/me/desired-weight`,
      {
        value: weight.value,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      },
    )
    console.log(data)
  } catch (e) {
    console.log(e)
  }
}

async function editLimitCcal() {
  try {
    const { data } = await axios.patch(
      `${API_BASE}/users/me/calorie-limit`,
      {
        value: ccal.value,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      },
    )
    console.log(data)
  } catch (e) {
    console.log(e)
  }
}
</script>

<style scoped lang="scss">
.mainBlockSettings {
  background-color: #fff;
  border: 0.5px solid #d9d9d9;
  border-radius: 16px;
  padding: 20px 22px;

  .title {
    font-size: 17px;
    font-weight: 600;
  }

  .nameInput {
    color: rgb(88 99 111);
    font-size: 15px;
    font-weight: 500;
    margin-top: 18px;
  }
}
</style>
