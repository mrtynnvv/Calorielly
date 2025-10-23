import { defineStore } from 'pinia'

type State = {
  token: string
  feedRevision: number
}

export const useUser = defineStore('userStore', {
  state: (): State => ({
    token: '',
    feedRevision: 0,
  }),

  getters: {
    // признак авторизации: true, если токен есть
    isAuth: (state) => !!state.token,
  },
  actions: {
    // устанавливает токен после логина/регистрации
    setToken(t: string) {
      this.token = t
    },
    // очищает токен (логаут/401)
    clear() {
      this.token = ''
    },
  },
  persist: {
    pick: ['token'],
  },
})
