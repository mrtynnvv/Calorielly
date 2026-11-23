import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export type Channel = 'ai' | 'chat'
type Participant = '1' | '2'
export type RoomMessage = {
  id: number
  channel: Channel
  author: Participant | 'assistant'
  text: string
}

type RoomEvent =
  | {
      type: 'state'
      messages: RoomMessage[]
      me: Participant
      context: { text: string; revision: number }
      busy: boolean
    }
  | { type: 'delta'; id: number; text: string }

const sessionKey = 'help-sobes.invite'

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
  const route = useRoute()
  const router = useRouter()
  const apiUrl = getApiUrl()
  const token = ref(sessionStorage.getItem(sessionKey) ?? '')
  const connected = ref(false)
  const status = ref('')
  const messages = ref<RoomMessage[]>([])
  const me = ref<Participant | null>(null)
  const context = ref({ text: '', revision: 0 })
  const busy = ref(false)

  watch(
    () => (route.name === 'help-sobes' ? route.hash : ''),
    (hash) => {
      const invite = new URLSearchParams(hash.slice(1)).get('invite')
      if (invite === null) return
      sessionStorage.setItem(sessionKey, invite)
      token.value = invite
      void router.replace({ path: route.path, query: route.query, hash: '' })
    },
    { immediate: true },
  )

  watch(
    token,
    (invite, _, onCleanup) => {
      connected.value = false
      messages.value = []
      me.value = null
      busy.value = false
      context.value = { text: '', revision: 0 }
      if (!invite || !apiUrl) {
        status.value = !invite
          ? 'Откройте комнату по своей ссылке-приглашению.'
          : 'Адрес сервера комнаты не настроен.'
        return
      }

      const wsUrl = new URL(apiUrl + '/room')
      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
      let disposed = false
      let retryDelay = 1000
      let timer: number | undefined
      let socket: WebSocket
      status.value = 'Подключение…'
      function connect() {
        socket = new WebSocket(wsUrl)
        socket.onopen = () => {
          if (!disposed)
            socket.send(JSON.stringify({ type: 'auth', token: invite }))
        }
        socket.onmessage = ({ data }) => {
          if (disposed) return
          const event: RoomEvent = JSON.parse(data)
          if (event.type === 'state') {
            messages.value = event.messages
            context.value = event.context
            busy.value = event.busy
            me.value = event.me
            connected.value = true
            status.value = ''
            retryDelay = 1000
          } else if (event.type === 'delta') {
            const message = messages.value.find((item) => item.id === event.id)
            if (message) message.text += event.text
          }
        }
        socket.onclose = ({ code }) => {
          if (disposed) return
          connected.value = false
          if (code === 4401) {
            sessionStorage.removeItem(sessionKey)
            messages.value = []
            context.value = { text: '', revision: 0 }
            me.value = null
            busy.value = false
            status.value = 'Ссылка недействительна. Откройте новое приглашение.'
            return
          }
          status.value = 'Связь прервалась. Переподключение…'
          timer = window.setTimeout(connect, retryDelay)
          retryDelay = Math.min(retryDelay * 2, 10000)
        }
      }

      connect()
      onCleanup(() => {
        disposed = true
        window.clearTimeout(timer)
        socket.close()
      })
    },
    { immediate: true },
  )

  async function request(path: string, init: RequestInit) {
    if (!connected.value) throw new Error('Подождите подключения к комнате.')
    const headers = new Headers(init.headers)
    headers.set('Authorization', 'Bearer ' + token.value)
    let response: Response
    try {
      response = await fetch(apiUrl + path, { ...init, headers })
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
