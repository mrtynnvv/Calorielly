import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'

export type AiChannel = 'ai' | 'system'
export type Channel = AiChannel | 'chat'
export type RoomMessage = {
  id: number
  channel: Channel
  author: string
  text: string
  images?: { id: string }[]
  createdAt?: string | null
  interrupted?: boolean
}

type RoomModel = { id: string; label: string }
type RoomTodo = { id: string; text: string }
type RoomText = { text: string; revision: number }

export type SelectionPoint = { id: number; offset: number }
export type RoomSelection = { start: SelectionPoint; end: SelectionPoint }
type RoomMark = { id: number; author: string; range: RoomSelection }
type MarkEdit =
  | { type: 'mark' | 'erase-mark'; range: RoomSelection; channel: AiChannel }
  | { type: 'clear-marks' }

function before(a: SelectionPoint, b: SelectionPoint) {
  return a.id < b.id || (a.id === b.id && a.offset < b.offset)
}

function overlaps(a: RoomSelection, b: RoomSelection) {
  return before(a.start, b.end) && before(b.start, a.end)
}

function subtractMark(saved: RoomSelection, cut: RoomSelection) {
  if (!overlaps(saved, cut)) return [saved]
  const remaining: RoomSelection[] = []
  if (before(saved.start, cut.start))
    remaining.push({ start: saved.start, end: cut.start })
  if (before(cut.end, saved.end))
    remaining.push({ start: cut.end, end: saved.end })
  return remaining
}

export function sameSelection(
  a: RoomSelection | null,
  b: RoomSelection | null,
) {
  return (
    a?.start.id === b?.start.id &&
    a?.start.offset === b?.start.offset &&
    a?.end.id === b?.end.id &&
    a?.end.offset === b?.end.offset
  )
}

type RoomEvent =
  | {
      type: 'state'
      messages: RoomMessage[]
      model: string
      models: RoomModel[]
      context: RoomText
      dictationPrompt: RoomText
      busy: boolean
      systemBusy?: boolean
      onlineAuthors?: string[]
      marks?: RoomMark[]
      systemMarks?: RoomMark[]
      todos?: RoomTodo[]
    }
  | { type: 'delta'; id: number; text: string }
  | { type: 'presence'; onlineAuthors: string[] }
  | { type: 'todos'; todos: RoomTodo[] }
  | {
      type: 'selection' | 'system-selection'
      peer: string
      range: RoomSelection | null
    }
  | {
      type: 'marks'
      marks: RoomMark[]
      systemMarks?: RoomMark[]
      operationId?: string
    }
  | { type: 'mark-error'; message: string; operationId?: string }

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
  const todos = shallowRef<RoomTodo[]>([])
  const context = ref({ text: '', revision: 0 })
  const dictationPrompt = ref<RoomText>({ text: '', revision: -1 })
  const busy = ref(false)
  const systemBusy = ref(false)
  const model = ref<string | null>(null)
  const models = ref<RoomModel[]>([])
  const peerSelections = shallowRef<ReadonlyMap<string, RoomSelection>>(
    new Map(),
  )
  const systemPeerSelections = shallowRef<ReadonlyMap<string, RoomSelection>>(
    new Map(),
  )
  const marks = shallowRef<Record<AiChannel, RoomMark[]>>({
    ai: [],
    system: [],
  })
  const pendingMarks = shallowRef<(MarkEdit & { operationId: string })[]>([])
  function selectionsFor(channel: AiChannel) {
    const mine = computed(() => {
      let ranges = marks.value[channel]
        .filter((mark) => mark.author === me)
        .map((mark) => mark.range)
      for (const edit of pendingMarks.value) {
        if (edit.type === 'clear-marks') ranges = []
        else if (edit.channel === channel) {
          if (edit.type === 'mark') ranges.push(edit.range)
          else
            ranges = ranges.flatMap((range) => subtractMark(range, edit.range))
        }
      }
      return ranges
    })
    const saved = computed(() => [
      ...marks.value[channel]
        .filter((mark) => mark.author !== me)
        .map((mark) => mark.range),
      ...mine.value,
    ])
    return { mine, saved }
  }
  const selections = {
    ai: selectionsFor('ai'),
    system: selectionsFor('system'),
  }
  const markError = ref('')
  const localSelections: Record<AiChannel, RoomSelection | null> = {
    ai: null,
    system: null,
  }
  let retryDelay = 1000
  let timer: number | undefined
  let socket: WebSocket | undefined

  function sendSocket(event: object) {
    if (socket?.readyState === WebSocket.OPEN && connected.value)
      socket.send(JSON.stringify(event))
  }

  function publishSelection(
    range: RoomSelection | null,
    channel: AiChannel = 'ai',
  ) {
    if (sameSelection(range, localSelections[channel])) return
    localSelections[channel] = range
    sendSocket({
      type: channel === 'ai' ? 'selection' : 'system-selection',
      range,
    })
  }

  function applyMark(edit: MarkEdit) {
    const operation = { ...edit, operationId: crypto.randomUUID() }
    markError.value = ''
    pendingMarks.value = [...pendingMarks.value, operation]
    sendSocket(operation)
  }

  function toggleMark(range: RoomSelection) {
    const channel = messages.value.find(
      ({ id }) => id === range.start.id,
    )?.channel
    if (channel !== 'ai' && channel !== 'system') return false
    const erase = selections[channel].mine.value.some((saved) =>
      overlaps(saved, range),
    )
    applyMark({ type: erase ? 'erase-mark' : 'mark', range, channel })
    return erase
  }

  function acknowledgeMark(operationId?: string) {
    if (operationId && pendingMarks.value.length)
      pendingMarks.value = pendingMarks.value.filter(
        (edit) => edit.operationId !== operationId,
      )
  }

  function clearMyMarks() {
    if (!connected.value) return
    publishSelection(null)
    publishSelection(null, 'system')
    applyMark({ type: 'clear-marks' })
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
        todos.value = event.todos ?? []
        model.value = event.model ?? null
        models.value = event.models ?? []
        context.value = event.context
        if (event.dictationPrompt) dictationPrompt.value = event.dictationPrompt
        busy.value = event.busy
        systemBusy.value = event.systemBusy ?? false
        onlineAuthors.value = event.onlineAuthors
          ? new Set(event.onlineAuthors)
          : null
        const reconnecting = !connected.value
        connected.value = true
        marks.value = { ai: event.marks ?? [], system: event.systemMarks ?? [] }
        if (pendingMarks.value.length) {
          const ids = new Set(event.messages.map((message) => message.id))
          pendingMarks.value = pendingMarks.value.filter(
            (edit) =>
              edit.type === 'clear-marks' ||
              (ids.has(edit.range.start.id) && ids.has(edit.range.end.id)),
          )
          if (reconnecting)
            for (const edit of pendingMarks.value) sendSocket(edit)
        }
        if (reconnecting && localSelections.ai)
          sendSocket({ type: 'selection', range: localSelections.ai })
        if (reconnecting && localSelections.system)
          sendSocket({
            type: 'system-selection',
            range: localSelections.system,
          })
        status.value = ''
        retryDelay = 1000
      } else if (event.type === 'delta') {
        const message = messages.value.find((item) => item.id === event.id)
        if (message && !message.interrupted) message.text += event.text
      } else if (event.type === 'presence') {
        onlineAuthors.value = new Set(event.onlineAuthors)
      } else if (event.type === 'todos') {
        todos.value = event.todos
      } else if (event.type === 'marks') {
        marks.value = { ai: event.marks, system: event.systemMarks ?? [] }
        acknowledgeMark(event.operationId)
      } else if (event.type === 'mark-error') {
        acknowledgeMark(event.operationId)
        markError.value = event.message
      } else if (
        event.type === 'selection' ||
        event.type === 'system-selection'
      ) {
        const currentPeers =
          event.type === 'selection' ? peerSelections : systemPeerSelections
        const peers = new Map(currentPeers.value)
        if (event.range) peers.set(event.peer, event.range)
        else peers.delete(event.peer)
        currentPeers.value = peers
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
    systemPeerSelections.value = new Map()
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
    } catch (error) {
      if (init.signal?.aborted) throw error
      throw new Error('Не удалось связаться с сервером.')
    }
    if (!response.ok) {
      if (response.status === 413 && path === '/transcriptions')
        throw new Error('Аудиофрагмент слишком большой.')
      if (
        response.status === 413 &&
        path === '/messages' &&
        init.body instanceof FormData
      )
        throw new Error('Размер изображений превышает допустимый для отправки.')
      const body = await response.json().catch(() => null)
      throw new Error(body?.message || body?.error || 'Сервер отклонил запрос.')
    }
    return response
  }

  return {
    me,
    imageBaseUrl: apiUrl ? apiUrl + '/images/' : '',
    model,
    models,
    context,
    dictationPrompt,
    todos,
    busy,
    systemBusy,
    connected,
    onlineAuthors,
    status,
    request,
    peerSelections,
    systemPeerSelections,
    publishSelection,
    publishSystemSelection: (range: RoomSelection | null) =>
      publishSelection(range, 'system'),
    savedSelections: selections.ai.saved,
    systemSavedSelections: selections.system.saved,
    hasMyMarks: computed(
      () =>
        selections.ai.mine.value.length > 0 ||
        selections.system.mine.value.length > 0,
    ),
    markError,
    toggleMark,
    clearMyMarks,
    aiMessages: computed(() =>
      messages.value.filter((item) => item.channel === 'ai'),
    ),
    systemMessages: computed(() =>
      messages.value.filter((item) => item.channel === 'system'),
    ),
    chatMessages: computed(() =>
      messages.value.filter((item) => item.channel === 'chat'),
    ),
  }
}
