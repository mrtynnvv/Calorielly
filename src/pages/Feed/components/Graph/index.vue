<template>
  <UiModal :open="isOpen" @close="isOpen = false"><AddWeightModal /></UiModal>
  <UiBlock class="ui-block">
    <div class="header">
      <a class="t-title">Динамика веса</a>
      <a class="t-title right" @click="isOpen = true"> Добавить </a>
    </div>

    <div class="content">
      <Chart :data="dataList" class="chart" />
    </div>
  </UiBlock>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

import Chart from './Chart.vue'
import AddWeightModal from './components/AddWeightModal.vue'

import UiBlock from '@/components/ui/UiBlock.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { useUser } from '@/store/User'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE
const emit = defineEmits(['open'])
const isOpen = ref(false)
const dataList = ref<[number[], string[]]>([[], []]) //веса[0] и даты [1] в графике
async function getWeights() {
  try {
    const { data } = await axios.get(`${API_BASE}/users/me/weights`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })

    dataList.value[0] = (data.items as Array<{ weight: number | string }>).map(
      (i) => Number(i.weight),
    ) //пуш значений веса
    dataList.value[1] = (data.items as Array<{ measuredAt: string }>).map((i) =>
      new Date(i.measuredAt).toLocaleString('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    ) //пуш дат
  } catch (e) {
    console.log(e)
  }
}

getWeights()
</script>

<style scoped lang="scss">
.ui-block {
  margin-bottom: 6px;

  .header {
    display: flex;
    justify-content: space-between;
    margin-left: 15px;
    margin-right: 15px;
    margin-top: 8px;

    @media (width <=1000px) {
      margin-left: 5px;
      margin-right: 5px;
      margin-top: 0;
    }

    .t-title {
      display: block;

      &.right {
        color: $palette-blue;

        &:hover {
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      }
    }
  }

  .content {
    margin-top: 8px;
    padding: 8px 10px 5px 15px;
  }
}
</style>
