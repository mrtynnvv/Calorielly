<template>
  <UiBlock class="ui-block" v-for="(items, index) in days">
    <div class="header">
      <a class="t-title" v-if="items[index]">{{
        new Date(items[index].date).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      }}</a>
    </div>
    <div v-for="item in items" class="content" @click="$emit('open')">
      <div class="leftBlock">
        <div class="icon">
          <img src="@/assets/Feed/pizza.svg" />
        </div>
        <div class="text">
          <p class="t-main" v-if="item.type === 'food'">
            {{ item.data.title }}
            <a>{{ item.data.calories }} ккал {{ item.data.grams }} гр</a>
          </p>
          <p class="t-main" v-else>
            Обновлен вес
            <a>{{ item.data.weight }} кг</a>
          </p>

          <p class="t-comment">
            {{
              new Date(item.date).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })
            }}
          </p>
        </div>
      </div>
      <div class="rightBlock" @click="deleteItem(item.data.id)">
        <img src="@/assets/close-gray.svg" />
      </div>
    </div>
  </UiBlock>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

import UiBlock from '@/components/ui/UiBlock.vue'
// import UiButton from '@/components/ui/UiButton.vue'
// import UiInput from '@/components/ui/UiInput.vue'
import { useUser } from '@/store/User'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE

type Item = { id: string; type: 'food' | 'weight'; date: string; data: any }
const days = ref<Item[][]>([])
// запрос записей с сервера и группировка по функции groupByLocalDay
async function load() {
  const { data } = await axios.get(`${API_BASE}/users/me/timeline`, {
    headers: { Authorization: `Bearer ${userStore.token}` },
  })

  days.value = groupByLocalDay(data)
  console.log(days)
}
load()

function groupByLocalDay(items: Item[]): Item[][] {
  //сортирует все записи по времени, новые сверху
  const sorted = items
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const buckets = new Map<number, Item[]>()
  for (const it of sorted) {
    const d = new Date(it.date)
    d.setHours(0, 0, 0, 0) //полночь по времени устройства
    const key = d.getTime() //ключ дня
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(it) //кладет запись в нужный день
  }
  //дни от нового к старому, внутри дня отсортировано выше
  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, arr]) => arr)
}

async function deleteItem(id: any) {
  try {
    await axios.delete(`${API_BASE}/users/me/entries/${id}`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    load()
  } catch (e) {
    console.log(e)
  }
}
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
