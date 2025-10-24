import axios from 'axios'
import type { Router } from 'vue-router'

import { useUser } from '@/store/User'

// создает общий axios инстанс с базовым url из env
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
})

// регистрирует интерцепторы, подставляет токен и ловит 401
export function setupHttp(router: Router) {
  // перед каждым запросом добавляет Bearer токен, если он есть
  http.interceptors.request.use((config) => {
    const user = useUser()
    if (user.token) {
      config.headers = config.headers ?? {}
        ; (config.headers as any).Authorization = `Bearer ${user.token}`
    }
    return config
  })

  // после ответа если 401, очищает токен и редирект на /auth
  http.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error?.response?.status
      if (status === 401) {
        const user = useUser()
        user.clear()
        if (router.currentRoute.value.path !== '/auth') {
          router.push('/auth')
        }
      }
      return Promise.reject(error)
    },
  )
}

// включает демо режим по домену demo.
const IS_DEMO = typeof location !== 'undefined' && (location.hostname.startsWith('demo.') || location.pathname.startsWith('/demo'))

if (IS_DEMO) {
  // сохраняет оригинальные адаптеры, чтобы уметь падать обратно
  const originalHttp = http.defaults.adapter!
  const originalAxios = axios.defaults.adapter!

  // подменяет адаптеры у http и у глобального axios на случай прямых вызовов
  http.defaults.adapter = demoAdapter(originalHttp)
  axios.defaults.adapter = demoAdapter(originalAxios)
}

// адаптер для демо: отдаёт данные из demo-db.json и запрещает запись
function demoAdapter(original: any) {
  // кэш json и заранее посчитанный сдвиг по дням
  let cache: any | null = null
  let deltaDays: number = 0

  // вспомогательные функции
  const dayStart = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
  }
  const daysDiff = (a: Date, b: Date) => Math.round((+a - +b) / 86_400_000)
  const rebase = (iso: string) => {
    const d = new Date(iso)
    d.setDate(d.getDate() + deltaDays) // сдвигает на разницу суток сохраняя часы и минуты
    return d.toISOString()
  }

  // загружает demo-db.json и считает сдвиг дат к сегодняшнему дню
  async function loadDb() {
    if (cache) return cache
    const res = await fetch('/demo-db.json')
    cache = await res.json()

    const dates: string[] = []
      ; (cache['GET /users/me/foods'] || []).forEach((f: any) => dates.push(f.eatenAt))
      ; (cache['GET /users/me/weights']?.items || []).forEach((w: any) => dates.push(w.measuredAt))
      ; (cache['GET /users/me/timeline'] || []).forEach((t: any) => dates.push(t.date))

    // находит последний день в демо-данных и считает разницу с сегодня
    const last = new Date(dates.sort()[dates.length - 1]!)
    deltaDays = daysDiff(dayStart(new Date()), dayStart(last))
    return cache
  }

  // утилиты формирования успешного/ошибочного ответа axios
  const ok = (config: any, data: any, status = 200) =>
    Promise.resolve({ data, status, statusText: 'OK', headers: {}, config })
  const err = (config: any, status = 403, data: any = { message: 'Demo: read-only' }) =>
    Promise.resolve({ data, status, statusText: 'Forbidden', headers: {}, config })

  // сам адаптер: решает, что вернуть по запросу
  return async (config: any) => {
    const method = (config.method || 'get').toLowerCase()
    const url = new URL(config.url!, config.baseURL || (typeof location !== 'undefined' ? location.origin : 'http://localhost'))
    const path = url.pathname

    // только в демо подменяет, иначе отдает в оригинальный адаптер
    if (!IS_DEMO) return original(config)

    // блокирует любые изменения данных
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      return err(config)
    }

    // готовит БД и сдвиг дат
    const db = await loadDb()

    // отдаем заготовленные ответы по известным эндпоинтам
    if (method === 'get') {
      if (path.endsWith('/users/me/foods')) {
        const data = (db['GET /users/me/foods'] || []).map((f: any) => ({
          ...f,
          eatenAt: rebase(f.eatenAt),
        }))
        return ok(config, data)
      }

      if (path.endsWith('/users/me/weights')) {
        const items = (db['GET /users/me/weights']?.items || [])
          .map((w: any) => ({ ...w, measuredAt: rebase(w.measuredAt) }))
          .sort((a: any, b: any) => a.measuredAt.localeCompare(b.measuredAt))
        return ok(config, { items, truncated: false })
      }

      if (path.endsWith('/users/me/calorie-limit')) {
        return ok(config, db['GET /users/me/calorie-limit'])
      }

      if (path.endsWith('/users/me/desired-weight')) {
        return ok(config, db['GET /users/me/desired-weight'])
      }

      if (path.endsWith('/users/me/timeline')) {
        const data = (db['GET /users/me/timeline'] || []).map((t: any) => ({
          ...t,
          date: rebase(t.date),
          data:
            t.type === 'food'
              ? { ...t.data, eatenAt: rebase(t.data.eatenAt) }
              : { ...t.data, measuredAt: rebase(t.data.measuredAt) },
        }))
        return ok(config, data)
      }
    }

    // все остальное отдает в оригинальный адаптер на всякий случай
    return original(config)
  }
}

export default http
