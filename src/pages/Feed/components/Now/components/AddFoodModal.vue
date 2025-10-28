<template>
  <div class="modal">
    <div class="login">
      <div class="title">Добавить прием пищи</div>
      <div class="nameInput">Калорийность</div>
      <UiInput
        placeholder="Введите количество калорий"
        v-model.number="ccalValue"
        type="number"
      />
      <div class="nameInput">Вес</div>
      <UiInput
        placeholder="Введите количество грамм"
        v-model.number="grValue"
        type="number"
      />
      <div class="nameInput">Название</div>
      <UiInput
        placeholder="Введите название продукта"
        v-model.trim="ccalName"
        type="string"
      />

      <UiButton @click="addCcal()" text="Добавить" />

      <UiButtonGray
        class="ui-button-gray"
        @click="addToFavorite()"
        text="В избранное"
      />
    </div>

    <div class="divider"></div>
    <div class="favorite">
      <div class="content" v-for="favorite in favoriteList">
        <div class="leftBlock">
          <div class="text">
            <p class="t-main">
              {{ favorite.calories }} ккал
              <a> {{ favorite.grams }} гр</a>
            </p>

            <p class="t-comment">
              {{ truncate(favorite.title, 20) }}
            </p>
          </div>
        </div>
        <div class="rightBlock">
          <UiButtonGray
            class="ui-button-gray"
            text="Добавить"
            @click="favoriteToInput(favorite)"
          />
          <img
            src="@/assets/close-gray.svg"
            @click="deleteFavorite(favorite.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, watch } from 'vue'

import UiButton from '@/components/ui/UiButton.vue'
import UiButtonGray from '@/components/ui/UiButtonGray.vue'
import UiInput from '@/components/ui/UiInput.vue'
import { useUser } from '@/store/User'
const userStore = useUser()
const API_BASE = import.meta.env.VITE_API_BASE

type Favorite = { title: string; calories: number; grams: number; id: string }
const favoriteList = ref<Favorite[]>([])

const ccalValue = ref(null)
const ccalName = ref('')
const grValue = ref(null)

async function addCcal() {
  try {
    await axios.post(
      `${API_BASE}/users/me/foods`,
      {
        title: ccalName.value,
        calories: ccalValue.value,
        grams: grValue.value,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      },
    )
    ccalValue.value = null
    ccalName.value = ''
    grValue.value = null
    userStore.feedRevision++
  } catch (e) {
    console.log(e)
  }
}

async function addToFavorite() {
  try {
    await axios.post(
      `${API_BASE}/users/me/favorites`,
      {
        title: ccalName.value,
        calories: ccalValue.value,
        grams: grValue.value,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      },
    )
    userStore.feedRevision++
  } catch (e) {
    console.log(e)
  }
}

async function getFavorite() {
  try {
    const { data } = await axios.get(`${API_BASE}/users/me/favorites`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    favoriteList.value = data
    console.log(favoriteList)
  } catch (e) {
    console.log(e)
  }
}
getFavorite()

function favoriteToInput(item: any) {
  console.log(item)
  ccalValue.value = item.calories
  ccalName.value = item.title
  grValue.value = item.grams
}

async function deleteFavorite(id: any) {
  try {
    await axios.delete(`${API_BASE}/users/me/entries/${id}`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    })
    userStore.feedRevision++
  } catch (e) {
    console.log(e)
  }
}

function truncate(text: string | null | undefined, max = 26) {
  const s = (text ?? '').trim()
  return s.length > max ? s.slice(0, max) + '...' : s
}

watch(
  () => userStore.feedRevision,
  () => {
    getFavorite()
  },
)
</script>

<style scoped lang="scss">
.modal {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  max-height: 99dvh;

  // display: flex;
  // flex-direction: column;
  min-height: 0;
  overflow: hidden;

  .login {
    .title {
      font-size: 17px;
      font-weight: 600;
      margin-top: 18px;
    }

    .nameInput {
      color: rgb(88 99 111);
      font-size: 15px;
      font-weight: 500;
      margin-top: 18px;
    }

    .ui-button-gray {
      margin-top: 14px;
    }
  }

  .divider {
    background-color: #d6d6d6;
    height: 1px;
    margin: 20px 0;
    width: 100%;
  }

  .favorite {
    margin-bottom: 20px;
    min-height: 0;
    -webkit-overflow-scrolling: touch;
    overflow-y: auto;
    padding-right: 10px;
    scrollbar-gutter: stable;

    .content {
      display: flex;
      gap: 8px;
      justify-content: space-between;
      transition: 0.5s;

      @media (width <=1000px) {
        padding: 0 5px;
      }

      .leftBlock {
        align-items: center;
        display: flex;
        min-width: 0;

        .text {
          display: block;
          min-width: 0;
          overflow: hidden;

          a {
            color: #58636f;
          }
        }
      }

      .rightBlock {
        align-items: center;
        display: flex;
        margin-bottom: 8px;
        margin-right: -10px;

        .ui-button-gray {
          align-items: center;
          font-size: 13px;
          margin: auto 7px;
          max-height: 67%;
          padding: 0 20px;
        }

        img {
          align-items: center;
          cursor: pointer;
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
}
</style>
