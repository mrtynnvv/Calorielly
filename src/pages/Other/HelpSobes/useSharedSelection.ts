import { onMounted, onUnmounted, watch, type Ref } from 'vue'

import type { RoomSelection, SelectionPoint } from './useRoom'

const messageSelector = '[data-selection-message]'
const highlightName = 'sobes-peer-selection'

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

function paintPeers(
  log: HTMLElement,
  peers?: ReadonlyMap<string, RoomSelection>,
) {
  if (!globalThis.CSS?.highlights) return
  if (!peers?.size) {
    CSS.highlights.delete(highlightName)
    return
  }
  const highlight = new Highlight()
  for (const { start, end } of peers.values()) {
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
  CSS.highlights.set(highlightName, highlight)
}

export function useSharedSelection(
  log: Ref<HTMLElement | null>,
  content: () => unknown,
  peers: () => ReadonlyMap<string, RoomSelection> | undefined,
  publish: (range: RoomSelection | null) => void,
) {
  let frame = 0
  let beforeUpdate: {
    range: RoomSelection
    anchor: Node
    focus: Node
    backward: boolean
  } | null = null

  function selectionChanged() {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const selection = document.getSelection()
      publish(
        log.value && selection ? readSelection(log.value, selection) : null,
      )
    })
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
    () => {
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
      paintPeers(box, peers())
    },
    { flush: 'post' },
  )

  watch(
    peers,
    () => {
      if (log.value) paintPeers(log.value, peers())
    },
    { flush: 'post' },
  )

  onMounted(() => {
    document.addEventListener('selectionchange', selectionChanged)
    if (log.value) paintPeers(log.value, peers())
  })
  onUnmounted(() => {
    document.removeEventListener('selectionchange', selectionChanged)
    cancelAnimationFrame(frame)
    globalThis.CSS?.highlights?.delete(highlightName)
    publish(null)
  })
}
