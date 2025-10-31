<template>
  <UiBlock class="ui-block">
    <div class="header">
      <a class="t-title">Цели</a>
    </div>

    <div class="content">
      <UiBlock class="card">
        <div class="image">
          <img src="@/assets/Feed/cookie.svg" />
        </div>
        <div class="description">
          <a class="t-title">Калории</a>
          <a class="t-comment" v-if="(ccalLimit - ccalToday) < 0">переедено

            {{ Math.abs(ccalLimit - ccalToday).toFixed(0) }}
            ккал</a>
          <a v-else class="t-comment">осталось

            {{ (ccalLimit - ccalToday).toFixed(0) }}
            ккал</a>

          <div class="line">
            <div class="lineBlue" :style="{
              width: Math.min((ccalToday / ccalLimit) * 100, 100) + '%',
            }"></div>
          </div>
        </div>
      </UiBlock>

      <UiBlock class="card">
        <div class="image">
          <img src="@/assets/Feed/cookie.svg" />
        </div>
        <div class="description">
          <a class="t-title">Вес</a>
          <a class="t-comment">осталось
            {{ Math.abs((lastWeight - desiredWeight)).toFixed(1) }}
            кг
          </a>

          <div class="line">
            <div class="lineBlue" :style="{
              width: Math.min((desiredWeight / lastWeight) * 100, 100) + '%',
            }"></div>
          </div>
        </div>
      </UiBlock>
    </div>
  </UiBlock>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, watch } from 'vue'

import UiBlock from '@/components/ui/UiBlock.vue'
import { useUser } from '@/store/User'

const API_BASE = import.meta.env.VITE_API_BASE
const userStore = useUser()

const ccalToday = ref(0)
const ccalLimit = ref(0)
const desiredWeight = ref(0)
const lastWeight = ref(0)

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
    const todayItems = data.filter((i: any) => {
      const d = new Date(i.eatenAt)
      return d >= start && d <= end
    })
    //выводит сумму калорий за сегодня (чп аналогично)
    ccalToday.value = todayItems.reduce(
      (s: any, i: any) => s + Number(i.calories),
      0,
    )
  } catch (e) {
    console.log(e)
  }
}
getCcalToday()

async function getCcalLimit() {
  try {
    const { data } = await axios.get(`${API_BASE}/users/me/calorie-limit`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    ccalLimit.value = data.dailyCalorieLimit
  } catch (e) {
    console.log(e)
  }
}
getCcalLimit()

async function getDesiredWeight() {
  try {
    const { data } = await axios.get(`${API_BASE}/users/me/desired-weight`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    desiredWeight.value = data.desiredWeight
  } catch (e) {
    console.log(e)
  }
}
getDesiredWeight()

async function getLastWeight() {
  try {
    const { data } = await axios.get(`${API_BASE}/users/me/weights`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    lastWeight.value = data.items[data.items.length - 1].weight
  } catch (e) {
    console.log(e)
  }
}
getLastWeight()

watch(
  () => userStore.feedRevision,
  () => {
    getCcalToday(), getLastWeight()
  },
)
</script>

<style scoped lang="scss">
.ui-block {
  margin-bottom: 6px;

  .header {
    .t-title {
      display: block;
      margin-left: 15px;
      margin-top: 8px;

      @media (width <=1000px) {
        margin-left: 5px;
        margin-top: 0;
      }
    }
  }

  .content {
    display: flex;
    flex-wrap: nowrap;
    margin-top: 8px;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    padding: 8px 10px 5px 15px;
    white-space: nowrap;
    width: 100%;

    @media (width <=1000px) {
      padding: 5px 5px 0;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    .card {
      background-color: $palette-bg;
      border: none;
      display: inline-grid;
      flex: 0 0 auto;
      grid-template-columns: max-content 1fr;
      margin-right: 8px;
      padding: 14px;
      white-space: normal;

      .image {
        align-items: center;
        background-color: #fff;
        border-radius: 100%;
        display: flex;
        margin-right: 10px;
        padding: 5px;

        @media (width <=1000px) {
          padding: 4px;
        }

        img {
          width: 32px;

          @media (width <=1000px) {
            width: 28px;
          }
        }
      }

      .description {
        margin-right: 8px;

        .t-comment {
          margin-left: 8px;
        }

        .line {
          background-color: #fff;
          border-radius: 9999px;
          height: 4px;
          margin-top: 6px;

          .lineBlue {
            background-color: #2688eb;
            border-radius: 9999px;
            height: 100%;
          }
        }
      }
    }
  }
}
</style>
