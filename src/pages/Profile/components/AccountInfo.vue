<template>
  <div class="content">
    <div class="icon">
      <img src="@/assets/default_avatar.png" alt="" />
    </div>
    <div class="text">
      <p class="t-title">Мой профиль</p>
      <p v-if="userId" class="t-comment">
        ID: {{ userId }}
        <button
          class="copy"
          type="button"
          aria-label="Скопировать ID"
          :title="copyText"
          @click="copyId()"
        >
          <img src="@/assets/Profile/copy.svg" alt="" width="16" height="16" />
        </button>
      </p>
    </div>
  </div>
  <UiButton @click="exit()" text="Выход" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '@/components/ui/UiButton.vue'
import { useUser } from '@/store/User'

const router = useRouter()
const userStore = useUser()
const userId = computed(() => {
  try {
    const payload = userStore.token.split('.')[1]!
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const { sub } = JSON.parse(atob(padded)) as { sub?: unknown }
    return typeof sub === 'string' && sub.trim() ? sub : null
  } catch {
    return null
  }
})
const copyText = ref('Скопировать ID')

async function copyId() {
  if (!userId.value) return

  try {
    await navigator.clipboard.writeText(userId.value)
    copyText.value = 'ID скопирован'
  } catch {
    copyText.value = 'Не удалось скопировать ID'
  }
}

function exit() {
  userStore.clear()
  router.push('/auth')
}
</script>

<style scoped lang="scss">
.content {
  align-items: center;
  display: flex;
  padding: 8px 10px 8px 15px;

  @media (width <=1000px) {
    padding: 5px;
  }

  .icon {
    img {
      width: 48px;

      @media (width <=1000px) {
        width: 42px;
      }
    }
  }

  .text {
    margin-left: 14px;

    @media (width <=1000px) {
      margin-left: 10px;
    }
  }

  .copy {
    background: none;
    border: none;
    cursor: pointer;
    display: inline-flex;
    margin-left: 4px;
    padding: 0;
    vertical-align: middle;
  }
}
</style>
