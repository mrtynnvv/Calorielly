import { computed, onMounted, onUnmounted, ref } from 'vue'

export type Channel = 'ai' | 'chat'
export type RoomMessage = {
  id: number
  channel: Channel
  author: string
  text: string
}

type RoomEvent =
  | {
      type: 'state'
      messages: RoomMessage[]
      context: { text: string; revision: number }
      busy: boolean
    }
  | { type: 'delta'; id: number; text: string }

function getAuthorId() {
  const key = 'help-sobes.author'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}

function getApiUrl() {
  const value =
    import.meta.env.VITE_SOBES_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3011' : '')
  if (!value) return null
  try {
    const url = new URL(value, location.origin)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (location.protocol === 'https:' && url.protocol !== 'https:') return null
    return url.href.replace(/\/$/, '')
  } catch {
    return null
  }
}

export function useRoom() {
  const apiUrl = getApiUrl()
  const me = getAuthorId()
  const connected = ref(false)
  const status = ref('Подключение…')
  const messages = ref<RoomMessage[]>([])
  const context = ref({ text: '', revision: 0 })
  const busy = ref(false)
  let disposed = false
  let retryDelay = 1000
  let timer: number | undefined
  let socket: WebSocket | undefined

  function connect() {
    if (!apiUrl) {
      status.value = 'Адрес сервера комнаты не настроен.'
      return
    }
    const wsUrl = new URL(apiUrl + '/room')
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    socket = new WebSocket(wsUrl)
    socket.onmessage = ({ data }) => {
      if (disposed) return
      const event: RoomEvent = JSON.parse(data)
      if (event.type === 'state') {
        messages.value = event.messages
        context.value = event.context
        busy.value = event.busy
        connected.value = true
        status.value = ''
        retryDelay = 1000
      } else if (event.type === 'delta') {
        const message = messages.value.find((item) => item.id === event.id)
        if (message) message.text += event.text
      }
    }
    socket.onclose = () => {
      if (disposed) return
      connected.value = false
      status.value = 'Связь прервалась. Переподключение…'
      timer = window.setTimeout(connect, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 10000)
    }
  }

  onMounted(connect)
  onUnmounted(() => {
    disposed = true
    window.clearTimeout(timer)
    socket?.close()
  })

  async function request(path: string, init: RequestInit) {
    if (!connected.value) throw new Error('Подождите подключения к комнате.')
    let response: Response
    try {
      response = await fetch(apiUrl + path, { ...init, credentials: 'omit' })
    } catch {
      throw new Error('Не удалось связаться с сервером.')
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.message || body?.error || 'Сервер отклонил запрос.')
    }
  }

  return {
    me,
    context,
    busy,
    connected,
    status,
    request,
    aiMessages: computed(() =>
      messages.value.filter((item) => item.channel === 'ai'),
    ),
    chatMessages: computed(() =>
      messages.value.filter((item) => item.channel === 'chat'),
    ),
  }
}
