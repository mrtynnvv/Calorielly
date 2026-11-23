import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'

export type Channel = 'ai' | 'chat'
export type RoomMessage = {
  id: number
  channel: Channel
  author: string
  text: string
  createdAt?: string | null
  interrupted?: boolean
}

type RoomModel = { id: string; label: string }

export type SelectionPoint = { id: number; offset: number }
export type RoomSelection = { start: SelectionPoint; end: SelectionPoint }

type RoomEvent =
  | {
      type: 'state'
      messages: RoomMessage[]
      model: string
      models: RoomModel[]
      context: { text: string; revision: number }
      busy: boolean
      onlineAuthors?: string[]
    }
  | { type: 'delta'; id: number; text: string }
  | { type: 'presence'; onlineAuthors: string[] }
  | { type: 'selection'; peer: string; range: RoomSelection | null }

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
  const onlineAuthors = shallowRef<ReadonlySet<string> | null>(null)
  const status = ref('Подключение…')
  const messages = ref<RoomMessage[]>([])
  const context = ref({ text: '', revision: 0 })
  const busy = ref(false)
  const model = ref<string | null>(null)
  const models = ref<RoomModel[]>([])
  const peerSelections = shallowRef<ReadonlyMap<string, RoomSelection>>(
    new Map(),
  )
  let localSelection: RoomSelection | null = null
  let retryDelay = 1000
  let timer: number | undefined
  let socket: WebSocket | undefined

  function sendSelection() {
    if (socket?.readyState === WebSocket.OPEN && connected.value)
      socket.send(JSON.stringify({ type: 'selection', range: localSelection }))
  }

  function publishSelection(range: RoomSelection | null) {
    if (
      range?.start.id === localSelection?.start.id &&
      range?.start.offset === localSelection?.start.offset &&
      range?.end.id === localSelection?.end.id &&
      range?.end.offset === localSelection?.end.offset
    )
      return
    localSelection = range
    sendSelection()
  }

  function connect() {
    window.clearTimeout(timer)
    if (!apiUrl) {
      status.value = 'Адрес сервера комнаты не настроен.'
      return
    }
    if (navigator.onLine === false) {
      disconnect()
      return
    }
    if (socket) return
    const wsUrl = new URL(apiUrl + '/room')
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    const current = new WebSocket(wsUrl)
    socket = current
    current.onopen = () => {
      if (socket === current)
        current.send(JSON.stringify({ type: 'join', author: me }))
    }
    current.onmessage = ({ data }) => {
      if (socket !== current) return
      const event: RoomEvent = JSON.parse(data)
      if (event.type === 'state') {
        messages.value = event.messages
        model.value = event.model ?? null
        models.value = event.models ?? []
        context.value = event.context
        busy.value = event.busy
        onlineAuthors.value = event.onlineAuthors
          ? new Set(event.onlineAuthors)
          : null
        const reconnecting = !connected.value
        connected.value = true
        if (reconnecting && localSelection) sendSelection()
        status.value = ''
        retryDelay = 1000
      } else if (event.type === 'delta') {
        const message = messages.value.find((item) => item.id === event.id)
        if (message && !message.interrupted) message.text += event.text
      } else if (event.type === 'presence') {
        onlineAuthors.value = new Set(event.onlineAuthors)
      } else if (event.type === 'selection') {
        const peers = new Map(peerSelections.value)
        if (event.range) peers.set(event.peer, event.range)
        else peers.delete(event.peer)
        peerSelections.value = peers
      }
    }
    current.onclose = () => {
      if (socket !== current) return
      disconnect()
      if (navigator.onLine === false) return
      timer = window.setTimeout(connect, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 10000)
    }
  }

  function disconnect() {
    window.clearTimeout(timer)
    const previous = socket
    socket = undefined
    previous?.close()
    connected.value = false
    onlineAuthors.value = null
    peerSelections.value = new Map()
    status.value = 'Связь прервалась. Переподключение…'
  }

  onMounted(() => {
    window.addEventListener('offline', disconnect)
    window.addEventListener('online', connect)
    connect()
  })
  onUnmounted(() => {
    window.removeEventListener('offline', disconnect)
    window.removeEventListener('online', connect)
    disconnect()
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
    model,
    models,
    context,
    busy,
    connected,
    onlineAuthors,
    status,
    request,
    peerSelections,
    publishSelection,
    aiMessages: computed(() =>
      messages.value.filter((item) => item.channel === 'ai'),
    ),
    chatMessages: computed(() =>
      messages.value.filter((item) => item.channel === 'chat'),
    ),
  }
}
