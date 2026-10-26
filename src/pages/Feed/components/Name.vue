<template>
  <UiBlock class="ui-block">
    <div class="content" @click="router.push('/profile')">
      <div class="leftBlock">
        <div class="icon">
          <img src="@/assets/default_avatar.png" />
        </div>
        <div class="text">
          <p class="t-title">Мой профиль</p>
          <p class="t-comment">{{ phone }}</p>
        </div>
      </div>
      <div class="rightBlock">
        <img src="@/assets/Feed/arrow-right.svg" />
      </div>
    </div>
  </UiBlock>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import UiBlock from '@/components/ui/UiBlock.vue'
import { useUser } from '@/store/User'

const router = useRouter()
const userStore = useUser()
const phone = computed(() => {
  if (userStore.token === 'demo') return 'Демонстрационный аккаунт'

  try {
    const payload = userStore.token.split('.')[1]!
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const { phone } = JSON.parse(atob(padded)) as { phone?: unknown }
    return typeof phone === 'string' ? phone : 'Телефон недоступен'
  } catch {
    return 'Телефон недоступен'
  }
})
</script>

<style scoped lang="scss">
.ui-block {
  margin-bottom: 6px;

  .content {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    padding: 8px 10px 8px 15px;
    transition: 0.5s;

    @media (width <=1000px) {
      padding: 5px;
    }

    &:hover {
      background-color: $palette-bg;
      border-radius: 8px;
      transition: 0.5s;
    }

    .leftBlock {
      align-items: center;
      display: flex;

      .icon {
        img {
          width: 48px;

          @media (width <=1000px) {
            width: 42px;
          }
        }
      }

      .text {
        display: block;
        margin-left: 14px;

        @media (width <=1000px) {
          margin-left: 10px;
        }
      }
    }

    .rightBlock {
      display: inline-flex;

      img {
        width: 24px;

        @media (width <=1000px) {
          width: 20px;
        }
      }
    }
  }
}
</style>
