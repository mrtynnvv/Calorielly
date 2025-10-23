<template>
  <transition name="overlay-fade">
    <div class="overlay" v-show="open" @click="$emit('close')"></div>
  </transition>
  <transition name="modal-anim">
    <div class="mainBlockAdd" v-show="open">
      <div class="close" @click="$emit('close')">
        <img class="img-white" src="@/assets/Add/close.svg" />
        <img class="img-gray" src="@/assets/close-gray.svg" />
      </div>

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
    </div>
  </transition>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import { useUser } from '@/store/User'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE
defineProps<{ open: boolean }>()
const emit = defineEmits(['close'])
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
.overlay {
  background-color: rgb(0 0 0 / 50%);
  bottom: 0;
  height: 100%;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1100;
}

.mainBlockAdd {
  background-color: rgb(255 255 255 / 100%);
  border: 0.5px solid #d9d9d9;
  border-radius: 16px;
  bottom: 35%;
  height: max-content;
  left: 0;
  margin: 0 auto;
  max-width: 400px;
  padding: 0 36px 36px;
  position: fixed;
  right: 0;
  width: 100%;
  z-index: 3301;

  @media (width <=1000px) {
    bottom: 1%;
  }

  .close {
    background-color: rgb(0 0 0 / 40%);
    border-radius: 100%;
    color: #666;
    float: right;
    margin-right: -80px;
    margin-top: 14px;
    padding: 4px;
    transition: 0.3s;

    &:hover {
      background-color: rgb(0 0 0 / 50%);
      color: #9b9b9b;
      cursor: pointer;
      transition: 0.3s;
    }

    @media (width <=1000px) {
      background: none;
      margin-right: -20px;

      .img-white {
        display: none;
      }
    }

    @media (width >1000px) {
      .img-gray {
        display: none;
      }
    }
  }

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
}
</style>
