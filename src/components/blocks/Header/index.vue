<template>
  <header class="header">
    <div class="container">
      <div class="left">
        <RouterLink to="/" class="logo"
          ><img src="@/assets/logo.svg" />Calorielly</RouterLink
        >
      </div>

      <nav class="middle">{{ pathScheme[route.path] }}</nav>

      <div class="right" @click="showModal = !showModal">
        <img class="avatar" src="@/assets/default_avatar.png" />
        <img class="arrow" src="@/assets/Header/arrow-down.svg" />
      </div>
      <transition name="overlay-fade" appear>
        <div
          class="overlay"
          v-show="showModal"
          @click="showModal = false"
        ></div>
      </transition>
      <transition name="modal-anim" appear>
        <ProfileModal class="modal" v-show="showModal" />
      </transition>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import ProfileModal from './components/ProfileModal.vue'
const route = useRoute()
const showModal = ref(false)
const pathScheme: Record<string, string> = {
  '/feed': 'Главная',
  '/scales': 'Весы',
  '/settings': 'Настройки',
  '/profile': 'Профиль',
}
</script>

<style scoped lang="scss">
.overlay {
  background-color: rgb(0 0 0 / 50%);
  bottom: 0;
  display: none;
  height: 100%;
  inset: 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1999;

  @media (width <=720px) {
    & {
      display: block;
    }
  }
}

.header {
  background: #fff;
  box-shadow: 0 1px 10px rgb(139 139 139 / 10%);
  height: 46px;
  margin-left: auto;
  margin-right: auto;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 2000;

  @media (width <=720px) {
    & {
      height: 66px;
    }
  }

  .container {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: space-between;
    margin: 0 auto;
    max-width: 880px;
    position: relative;
    z-index: 2;

    @media (width <=720px) {
      & {
        padding: 10px 12px;
      }
    }

    .left {
      .logo {
        align-items: center;
        color: black;
        display: flex;
        font-size: 20px;
        font-weight: 600;
        gap: 5px;
        line-height: 1;
        text-decoration: none;

        img {
          width: 30px;
        }
      }
    }

    .middle {
      color: black;
      display: flex;
      font-size: 20px;
      font-weight: 600;

      @media (width <=720px) {
        & {
          display: none;
        }
      }
    }

    .right {
      align-items: center;
      display: flex;
      gap: 6px;
      height: 100%;
      padding: 0 10px;

      &:hover {
        background-color: $palette-bg;
        cursor: pointer;
      }

      .avatar {
        border-radius: 100%;
        height: 36px;
        width: 36px;
      }

      .arrow {
        @media (width <=720px) {
          & {
            display: none;
          }
        }
      }
    }

    .modal {
      position: absolute;
      right: 0;
      top: 50px;
      z-index: 2001;

      @media (width <=720px) {
        & {
          inset: auto 0 0;
          position: fixed;
          z-index: 2001;
        }
      }
    }
  }
}

.modal-anim-enter-active,
.modal-anim-leave-active {
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
  will-change: transform, opacity;
}

@media (width > 1000px) {
  .modal-anim-enter-active,
  .modal-anim-leave-active {
    transition:
      transform 0.05s ease-out,
      opacity 0.05s ease-out;
    will-change: transform, opacity;
  }
}

.modal-anim-enter-from,
.modal-anim-leave-to {
  opacity: 0.001;
  transform: translateY(100%);
}

.modal-anim-enter-to,
.modal-anim-leave-from {
  opacity: 1;
  transform: translateY(0%);
}
</style>
