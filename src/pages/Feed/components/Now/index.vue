<template>
  <UiModal :open="isOpen" @close="isOpen = false"><AddFoodModal /></UiModal>
  <UiBlock class="ui-block">
    <a class="t-title">Калорий сегодня</a>

    <div class="content" @click="isOpen = true">
      <div class="leftBlock">
        <div class="icon">
          <img src="@/assets/Feed/fire.svg" />
        </div>
        <div class="text">
          <p class="t-main">{{ ccalToday }} ккал</p>
          <p class="t-comment">обновлено {{ backTime }} мин назад</p>
        </div>
      </div>
      <div class="rightBlock">
        <img src="@/assets/Feed/arrow-right.svg" />
      </div>
    </div>
  </UiBlock>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, watch } from 'vue'

import AddFoodModal from './components/AddFoodModal.vue'

import UiBlock from '@/components/ui/UiBlock.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { useUser } from '@/store/User'
const API_BASE = import.meta.env.VITE_API_BASE
const userStore = useUser()

const emit = defineEmits(['open'])
const isOpen = ref(false)

const backTime = ref('')
const upTime = ref(0)
setInterval(() => updateTime(), 60000) //обновлено ... мин назад
function updateTime() {
  backTime.value = ((Date.now() - upTime.value) / 1000 / 60).toFixed()
}
defineProps({
  msg: String,
})

const ccalToday = ref(0)
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
    upTime.value = Date.now()
    updateTime()
  } catch (e) {
    console.log(e)
  }
}
getCcalToday()
watch(
  () => userStore.feedRevision,
  () => {
    getCcalToday()
  },
)
</script>

<style scoped lang="scss">
.ui-block {
  margin-bottom: 6px;

  .t-title {
    display: block;
    margin-left: 15px;
    margin-top: 8px;

    @media (width <=1000px) {
      margin-left: 5px;
      margin-top: 0;
    }
  }

  .content {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
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
        background-color: $palette-bg;
        border-radius: 100%;
        padding: 8px;

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
