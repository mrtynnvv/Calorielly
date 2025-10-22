import axios from 'axios'
import type { Router } from 'vue-router'

import { useUser } from '@/store/User'

// Создаём общий axios-инстанс с базовым URL из .env
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
})

// регистрация интерцепторов: подставляет токен и ловит 401
export function setupHttp(router: Router) {
  // интерцептор запросов - подстановка токена в заголовок authorization
  http.interceptors.request.use((config) => {
    const user = useUser()
    if (user.token) {
      config.headers = config.headers ?? {}
      ;(config.headers as any).Authorization = `Bearer ${user.token}`
    }
    return config
  })
  // интерцептор ответов - авто-выход при 401
  http.interceptors.response.use(
    // успешный ответ — без изменений
    (res) => res,
    // ошибка ответа - проверяет статус
    (error) => {
      const status = error?.response?.status
      // если 401 — токен протух
      if (status === 401) {
        // очищает токен в сторе
        const user = useUser()
        user.clear()
        // редирект на страницу авторизации
        if (router.currentRoute.value.path !== '/auth') {
          router.push('/auth')
        }
      }
      // пробрасывает ошибку дальше
      return Promise.reject(error)
    },
  )
}

export default http
