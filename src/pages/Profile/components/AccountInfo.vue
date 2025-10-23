<template>
  Лк в разработке
  <UiButton @click="exit()" text="Выход" />
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
</script>
