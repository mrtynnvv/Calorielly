<template>
  <div class="main">
    <UiBlock class="ui-block">
      <img src="@/assets/logo.svg" />
      <p class="t-title-XL">
        <a v-if="steps === 'enter'">Вход</a> <a v-else>Регистрация</a> в
        Calorielly
      </p>
      <div class="switcher" v-if="steps === 'reg1' || steps === 'enter'">
        <div class="activeButton" :class="{ active: steps === 'reg1' }"></div>
        <div
          class="disabledButton"
          :class="{ active: steps === 'enter' }"
          @click="switchAuth"
        ></div>
        <div class="text"><a>Вход</a> <a>Регистрация</a></div>
      </div>

      <EnterStep1 v-if="steps === 'enter'" />
      <RegisterStep1
        v-if="steps === 'reg1'"
        @send-value="login = $event"
        @change-step="onChangeStep"
      />
      <RegisterStep2
        v-if="steps === 'reg2'"
        :login="login"
        @change-step="onChangeStep"
      />
    </UiBlock>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

import EnterStep1 from './components/EnterStep1.vue'
import RegisterStep1 from './components/RegisterStep1.vue'
import RegisterStep2 from './components/RegisterStep2.vue'

import UiBlock from '@/components/ui/UiBlock.vue'

const login = ref<string>('')

type Step = 'reg1' | 'reg2' | 'enter'
const steps = ref<Step>('reg1')
const switchAuth = () => {
  steps.value === 'reg1' ? (steps.value = 'enter') : (steps.value = 'reg1')
}

const onChangeStep = (s: Step | string) => {
  steps.value = s as Step
}
//белый фон только на /auth
onMounted(() => document.documentElement.classList.add('auth-white'))
onBeforeUnmount(() => document.documentElement.classList.remove('auth-white'))
</script>

<style scoped lang="scss">
.main {
  align-items: center;
  display: flex;
  min-height: 100vh;

  @media (width <=1000px) {
    display: block;
  }

  .ui-block {
    margin: 0 auto;
    max-width: 360px;
    padding: 28px;
    position: relative;
    text-align: center;
    width: 100%;

    @media (width <=1000px) {
      border: none;
      border-radius: 0;
      height: 100%;
      max-width: 100%;
      position: fixed;
    }

    .back {
      background: none;
      border: none;
      cursor: pointer;
      left: 10px;
      padding: 10px;
      position: absolute;
      top: 0;

      img {
        width: 26px;
      }
    }

    img {
      height: 48px;
      margin: 0 auto;
      width: 48px;
    }

    .t-title-XL {
      margin: 18px 0;
    }

    .switcher {
      background-color: $palette-bg;
      border-radius: 8px;
      height: 40px;
      margin-bottom: 18px;
      padding: 3px;
      position: relative;
      width: 100%;

      .activeButton {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 10px rgb(139 139 139 / 30%);
        cursor: pointer;
        height: calc(100% - 6px);
        position: absolute;
        transition: transform 0.25s ease;
        width: calc(50% - 3px);

        &.active {
          transform: translateX(100%);
        }
      }

      .disabledButton {
        border-radius: 8px;
        cursor: pointer;
        height: 100%;
        width: 50%;

        &.active {
          transform: translateX(100%);
        }
      }

      .text {
        align-items: center;
        display: flex;
        inset: 0;
        justify-content: space-between;
        pointer-events: none;
        position: absolute;

        a {
          width: 50%;
        }
      }
    }
  }
}
</style>

<!-- белый фон только на /auth -->
<style>
html.auth-white,
html.auth-white body {
  @media (width <=1000px) {
    background: #fff !important;
  }
}
</style>
