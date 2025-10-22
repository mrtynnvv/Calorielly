<template>
  <UiBlock class="ui-block">
    <div class="header">
      <a class="t-title">События сегодня</a>
      <!-- <div class="daySelector">
        <a
          class="selectorBack"
          @click="
            () => {
              if (daysCount > daySelector + 1) {
                daySelector++
              }
            }
          "
        >
          <img class="back" src="@/assets/Feed/arrow-right.svg"
        /></a>
        <a class="t-title">{{ day ? day[0] : '' }}</a>

        <a
          v-if="daySelector !== 0"
          class="selectorForward"
          @click="
            () => {
              if (daySelector > 0) {
                daySelector--
              }
            }
          "
        >
          <img class="back" src="@/assets/Feed/arrow-right.svg"
        /></a>
      </div> -->
    </div>
    <div v-for="eat in eatingList" class="content" @click="$emit('open')">
      <div class="leftBlock">
        <div class="icon">
          <img src="@/assets/Feed/pizza.svg" />
        </div>
        <div class="text">
          <p class="t-main">
            {{ eat.title }}
            <a>{{ eat.calories }} ккал</a>
          </p>
          <p class="t-comment">
            {{
              new Date(eat.eatenAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })
            }}
          </p>
        </div>
      </div>
      <!-- <div
        class="rightBlock"
        @click="day && deleteCcalValue(day[2].length - 1 - index)"
      >
        <img src="@/assets/close-gray.svg" />
      </div> -->
    </div>
  </UiBlock>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

import UiBlock from '@/components/ui/UiBlock.vue'
import { useUser } from '@/store/User'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE

defineProps({
  msg: String,
})

const eatingList = ref<any[]>([])

async function getCcalToday() {
  try {
    const { data } = await axios.get(`${API_BASE}/users/me/foods`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    //выводит записи приемов пищи только за сегодня (границы дня по часовому поясу устройства)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    eatingList.value = data.filter((i: any) => {
      const d = new Date(i.eatenAt)
      return d >= start && d <= end
    })
  } catch (e) {
    console.log(e)
  }
}
getCcalToday()
</script>

<style scoped lang="scss">
.ui-block {
  margin-bottom: 6px;

  .header {
    display: flex;
    justify-content: space-between;
    margin-left: 15px;
    margin-top: 8px;
    padding-right: 15px;

    @media (width <=1000px) {
      margin-left: 5px;
      margin-top: 0;
      padding-right: 5px;
    }

    .daySelector {
      align-items: center;
      display: flex;

      .selectorBack {
        img {
          background-color: rgb(0 0 0 / 7%);
          border-radius: 100%;
          color: #666;
          cursor: pointer;
          margin-right: 8px;
          padding: 1px;
          transform: rotate(180deg);
          transition: 0.3s;
          width: 18px;

          &:hover {
            background-color: rgb(0 0 0 / 14%);
            color: #9b9b9b;
            transition: 0.3s;
          }

          @media (width <=1000px) {
            width: 15px;
          }
        }
      }

      .t-title {
        color: $palette-blue;
      }

      .selectorForward {
        img {
          background-color: rgb(0 0 0 / 7%);
          border-radius: 100%;
          color: #666;
          cursor: pointer;
          margin-left: 8px;
          padding: 1px;
          transition: 0.3s;
          width: 18px;

          &:hover {
            background-color: rgb(0 0 0 / 14%);
            color: #9b9b9b;
            transition: 0.3s;
          }

          @media (width <=1000px) {
            width: 15px;
          }
        }
      }
    }
  }

  .content {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    padding: 8px 10px 8px 15px;
    transition: 0.5s;

    @media (width <=1000px) {
      padding: 5px;
    }

    .leftBlock {
      align-items: center;
      display: flex;

      .icon {
        padding: 8px 8px 8px 0;

        @media (width <=1000px) {
          padding: 7px;
        }

        img {
          width: 32px;

          @media (width <=1000px) {
            width: 28px;
          }
        }
      }

      .text {
        display: block;
        margin-left: 14px;

        a {
          color: #58636f;
        }

        @media (width <=1000px) {
          margin-left: 10px;
        }
      }
    }

    .rightBlock {
      cursor: pointer;
      display: inline-flex;

      img {
        transition: 1s;
        width: 24px;

        &:hover {
          filter: brightness(1.1);
          transition: 1s;
        }

        @media (width <=1000px) {
          width: 20px;
        }
      }
    }
  }
}
</style>
