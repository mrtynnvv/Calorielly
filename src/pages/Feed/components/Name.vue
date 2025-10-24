<template>
  <UiBlock class="ui-block">
    <div class="content" @click="router.push('/profile')">
      <div class="leftBlock">
        <div class="icon">
          <img src="@/assets/default_avatar.png" />
        </div>
        <div class="text">
          <p class="t-title">Guest</p>
          <p class="t-comment">ID: 0</p>
        </div>
      </div>
      <div class="rightBlock">
        <img src="@/assets/Feed/arrow-right.svg" />
      </div>
    </div>
  </UiBlock>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import UiBlock from '@/components/ui/UiBlock.vue'

const router = useRouter()
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
