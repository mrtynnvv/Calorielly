import { onMounted, onUnmounted, watch, type Ref } from 'vue'

import {
  sameSelection,
  type RoomMessage,
  type RoomSelection,
  type SelectionPoint,
} from './useRoom'

const messageSelector = '[data-selection-message]'
const highlightName = 'sobes-peer-selection'
const savedHighlightName = 'sobes-saved-marks'

function messageBodies(log: HTMLElement) {
  return log.querySelectorAll<HTMLElement>(messageSelector)
}

function messageBody(log: HTMLElement, id: number) {
  return log.querySelector<HTMLElement>(`[data-selection-message="${id}"]`)
}

function containingBody(node: Node) {
  const element = node instanceof Element ? node : node.parentElement
  return element?.closest<HTMLElement>(messageSelector)
}

function readSelection(
  log: HTMLElement,
  selection: Selection,
): RoomSelection | null {
  if (selection.isCollapsed || !selection.rangeCount) return null
  const range = selection.getRangeAt(0)
  if (!log.contains(range.commonAncestorContainer)) return null
  let first = containingBody(range.startContainer)
  let last = containingBody(range.endContainer)
  if (!first || !last) {
    const bodies = Array.from(messageBodies(log)).filter((body) =>
      range.intersectsNode(body),
    )
    first ??= bodies[0]
    last ??= bodies[bodies.length - 1]
  }
  if (!first || !last) return null

  function point(
    body: HTMLElement,
    node: Node,
    offset: number,
    atEnd: boolean,
  ): SelectionPoint {
    const prefix = document.createRange()
    prefix.selectNodeContents(body)
    if (body.contains(node)) prefix.setEnd(node, offset)
    else if (!atEnd) prefix.collapse(true)
    return {
      id: Number(body.dataset.selectionMessage),
      offset: prefix.toString().length,
    }
  }

  const start = point(first, range.startContainer, range.startOffset, false)
  const end = point(last, range.endContainer, range.endOffset, true)
  return start.id === end.id && start.offset === end.offset
    ? null
    : { start, end }
}

function textPoint(body: HTMLElement, offset: number): [Node, number] {
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const length = (node as Text).length
    if (offset <= length) return [node, offset]
    offset -= length
  }
  return [body, body.childNodes.length]
}

function paintRanges(
  log: HTMLElement,
  name: string,
  ranges?: Iterable<RoomSelection>,
) {
  if (!globalThis.CSS?.highlights) return
  const highlight = new Highlight()
  for (const { start, end } of ranges ?? []) {
    // У каждого сообщения свой диапазон, чтобы не подсвечивать подписи между ними.
    const bodies =
      start.id === end.id ? [messageBody(log, start.id)] : messageBodies(log)
    for (const body of bodies) {
      if (!body) continue
      const id = Number(body.dataset.selectionMessage)
      if (id < start.id || id > end.id) continue
      const range = document.createRange()
      range.selectNodeContents(body)
      if (id === start.id) range.setStart(...textPoint(body, start.offset))
      if (id === end.id) range.setEnd(...textPoint(body, end.offset))
      if (!range.collapsed) highlight.add(range)
    }
  }
  if (highlight.size) CSS.highlights.set(name, highlight)
  else CSS.highlights.delete(name)
}

export function useSharedSelection(
  log: Ref<HTMLElement | null>,
  content: () => readonly [
    RoomMessage[],
    string | undefined,
    boolean | undefined,
  ],
  peers: () => ReadonlyMap<string, RoomSelection> | undefined,
  marks: () => readonly RoomSelection[] | undefined,
  publish: (range: RoomSelection | null) => void,
  toggle: (range: RoomSelection) => boolean | undefined,
) {
  let frame = 0
  let completed: RoomSelection | null = null
  let pointer: number | null = null
  let keyboard = false
  const listeners = new AbortController()
  let beforeUpdate: {
    range: RoomSelection
    anchor: Node
    focus: Node
    backward: boolean
  } | null = null

  function currentRange() {
    const selection = document.getSelection()
    return log.value && selection ? readSelection(log.value, selection) : null
  }

  function selectionChanged() {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const range = currentRange()
      publish(sameSelection(range, completed) ? null : range)
    })
  }

  function finishSelection() {
    const range = currentRange()
    // У сенсорного жеста могут сработать и pointerup, и touchend.
    if (range && !sameSelection(range, completed)) {
      completed = range
      const erased = toggle(range)
      if (erased) document.getSelection()?.removeAllRanges()
    }
    publish(null)
  }

  function startPointer(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0) return
    // Иначе браузер начнёт перетаскивать уже выделенный текст.
    if (
      event.pointerType === 'mouse' &&
      !event.shiftKey &&
      completed &&
      sameSelection(currentRange(), completed)
    )
      document.getSelection()?.removeAllRanges()
    pointer = event.pointerId
    completed = null
  }

  function endPointer(event: PointerEvent) {
    if (pointer !== event.pointerId) return
    pointer = null
    finishSelection()
  }

  function startKey(event: KeyboardEvent) {
    if (
      event.shiftKey &&
      /^(Arrow(Left|Right|Up|Down)|Home|End|Page(Up|Down))$/.test(event.key)
    ) {
      keyboard = true
      completed = null
    }
  }

  function endKey(event: KeyboardEvent) {
    if (keyboard && event.key === 'Shift') {
      keyboard = false
      finishSelection()
    }
  }

  watch(content, () => {
    const selection = document.getSelection()
    if (!log.value || !selection?.anchorNode || !selection.focusNode) return
    const range = readSelection(log.value, selection)
    if (!range) return
    const native = selection.getRangeAt(0)
    beforeUpdate = {
      range,
      anchor: selection.anchorNode,
      focus: selection.focusNode,
      backward:
        native.startContainer !== selection.anchorNode ||
        native.startOffset !== selection.anchorOffset,
    }
  })

  watch(
    content,
    ([messages], [previousMessages]) => {
      const box = log.value
      if (!box) return
      const previous = beforeUpdate
      beforeUpdate = null
      // Потоковый Markdown заменяет узлы. Восстанавливаем также направление выделения.
      if (
        previous &&
        (!previous.anchor.isConnected || !previous.focus.isConnected)
      ) {
        const { start, end } = previous.range
        const first = messageBody(box, start.id)
        const last = start.id === end.id ? first : messageBody(box, end.id)
        if (first && last) {
          const from = textPoint(first, start.offset)
          const to = textPoint(last, end.offset)
          if (previous.backward)
            document.getSelection()?.setBaseAndExtent(...to, ...from)
          else document.getSelection()?.setBaseAndExtent(...from, ...to)
        }
        selectionChanged()
      }
      paintRanges(box, highlightName, peers()?.values())
      const latest = messages[messages.length - 1]
      // Токены последнего ответа меняют DOM только этого сообщения.
      if (
        messages !== previousMessages ||
        (latest &&
          marks()?.some(
            (range) => range.start.id <= latest.id && latest.id <= range.end.id,
          ))
      )
        paintRanges(box, savedHighlightName, marks())
    },
    { flush: 'post' },
  )

  watch(
    peers,
    () => {
      if (log.value) paintRanges(log.value, highlightName, peers()?.values())
    },
    { flush: 'post' },
  )
  watch(
    marks,
    () => {
      if (log.value) paintRanges(log.value, savedHighlightName, marks())
    },
    { flush: 'post' },
  )

  onMounted(() => {
    const box = log.value
    if (!box) return
    const options = { signal: listeners.signal }
    document.addEventListener('selectionchange', selectionChanged, options)
    box.addEventListener('pointerdown', startPointer, options)
    window.addEventListener('pointerup', endPointer, options)
    window.addEventListener(
      'pointercancel',
      () => {
        pointer = null
      },
      options,
    )
    // Системные маркеры выделения на сенсорном экране могут отменить pointer-событие.
    box.addEventListener('touchend', finishSelection, options)
    box.addEventListener('keydown', startKey, options)
    window.addEventListener('keyup', endKey, options)
    paintRanges(box, highlightName, peers()?.values())
    paintRanges(box, savedHighlightName, marks())
  })
  onUnmounted(() => {
    listeners.abort()
    cancelAnimationFrame(frame)
    globalThis.CSS?.highlights?.delete(highlightName)
    globalThis.CSS?.highlights?.delete(savedHighlightName)
    publish(null)
  })
}
