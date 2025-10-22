<template>
  <UiButton @click="exit()" text="Выход" />

  <div class="regLogin">
    Хотите прекратить использование?
    <a class="buttonDeleteAcc" @click="deleteAccount()">Удалить аккаунт</a>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import { useUser } from '@/store/User'
const router = useRouter()
const userStore = useUser()
defineProps({
  msg: String,
})

function exit() {
  userStore.clear()
  router.push('/auth')
}

function deleteAccount() {
  //сюда повесить метод на удаление аккаунта
}
</script>

<style scoped lang="scss">
.regLogin {
  color: #6c727f;
  margin-top: 15px;

  .buttonDeleteAcc {
    color: #df0000;
    transition: 0.3s;

    &:hover {
      color: #ca5858;
      cursor: pointer;
      transition: 0.3s;
    }
  }
}
</style>
