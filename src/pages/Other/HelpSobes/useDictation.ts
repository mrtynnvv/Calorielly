import { onUnmounted, ref } from 'vue'

import recorderUrl from './dictation.worklet.js?url&no-inline'

export type Transcribe = (audio: Blob, signal: AbortSignal) => Promise<string>

const displayAudioOptions = {
  audio: { channelCount: 1, suppressLocalAudioPlayback: false },
  video: { displaySurface: 'browser', frameRate: 1 },
  systemAudio: 'include',
  windowAudio: 'window',
}

function encodeWav(samples: Float32Array, sourceRate: number) {
  const rate = Math.min(16000, sourceRate)
  const ratio = sourceRate / rate
  const length = Math.floor(samples.length / ratio)
  const buffer = new ArrayBuffer(44 + length * 2)
  const view = new DataView(buffer)
  function label(offset: number, value: string) {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i))
  }
  label(0, 'RIFF')
  view.setUint32(4, buffer.byteLength - 8, true)
  label(8, 'WAVE')
  label(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  label(36, 'data')
  view.setUint32(40, length * 2, true)
  let start = 0
  for (let i = 0; i < length; i++) {
    const end = Math.floor((i + 1) * ratio)
    let sum = 0
    for (let j = start; j < end; j++) sum += samples[j]!
    const value = Math.max(-1, Math.min(1, sum / (end - start)))
    view.setInt16(44 + i * 2, value * (value < 0 ? 32768 : 32767), true)
    start = end
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

type Session = {
  context: AudioContext
  controller: AbortController
  stream?: MediaStream
  recorder?: AudioWorkletNode
  queue: Promise<void>
  stopped: () => void
  flushed: Promise<void>
  finish?: Promise<boolean>
}

export function useDictation(
  transcribe: Transcribe,
  append: (text: string) => void,
  source: 'microphone' | 'display' = 'microphone',
) {
  const display = source === 'display'
  const phase = ref<'idle' | 'starting' | 'recording' | 'finishing'>('idle')
  const error = ref('')
  let session: Session | undefined

  function release(current: Session) {
    current.stream?.getTracks().forEach((track) => track.stop())
    current.recorder?.disconnect()
    current.recorder?.port.close()
    if (current.context.state !== 'closed')
      void current.context.close().catch(() => {})
  }

  function cancel() {
    const current = session
    if (!current) return
    session = undefined
    phase.value = 'idle'
    current.controller.abort()
    current.stopped()
    release(current)
  }

  function fail(current: Session, reason: unknown) {
    if (session !== current) return
    error.value =
      reason instanceof Error ? reason.message : 'Не удалось распознать речь.'
    cancel()
  }

  async function start() {
    if (session) return
    error.value = ''
    if (
      !(display
        ? navigator.mediaDevices?.getDisplayMedia
        : navigator.mediaDevices?.getUserMedia) ||
      !window.AudioContext ||
      !window.AudioWorkletNode
    ) {
      error.value = display
        ? 'Этот браузер не поддерживает захват звука вкладки или экрана.'
        : 'Диктовка недоступна в этом браузере.'
      return
    }
    let context: AudioContext
    try {
      context = new AudioContext()
    } catch {
      error.value = 'Не удалось запустить запись звука.'
      return
    }
    let stopped!: () => void
    const flushed = new Promise<void>((resolve) => {
      stopped = resolve
    })
    const current: Session = {
      context,
      controller: new AbortController(),
      queue: Promise.resolve(),
      stopped,
      flushed,
    }
    session = current
    phase.value = 'starting'
    try {
      const capture = display
        ? navigator.mediaDevices.getDisplayMedia(displayAudioOptions)
        : navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } })
      const [stream] = await Promise.all([
        capture.then((stream) => {
          if (session === current) {
            current.stream = stream
            // Screen Capture requires video, but the recorder uses only audio.
            for (const track of stream.getVideoTracks()) track.enabled = false
          } else stream.getTracks().forEach((track) => track.stop())
          return stream
        }),
        context.resume(),
        context.audioWorklet.addModule(recorderUrl),
      ])
      if (session !== current) return
      const audioTrack = stream
        .getAudioTracks()
        .find((track) => track.readyState === 'live')
      if (!audioTrack) {
        fail(
          current,
          new Error(
            display
              ? 'Источник не передал звук. Выберите вкладку или экран и включите в окне выбора передачу аудио.'
              : 'Микрофон не найден.',
          ),
        )
        return
      }
      const recorder = new AudioWorkletNode(context, 'sobes-dictation', {
        numberOfOutputs: 0,
        channelCount: 1,
        channelCountMode: 'explicit',
      })
      current.recorder = recorder
      recorder.port.onmessage = ({
        data,
      }: MessageEvent<Float32Array | string>) => {
        if (session !== current) return
        if (typeof data === 'string') {
          if (data === 'stopped') current.stopped()
          return
        }
        const audio = encodeWav(data, context.sampleRate)
        current.queue = current.queue
          .then(async () => {
            if (session !== current) return
            const text = (
              await transcribe(audio, current.controller.signal)
            ).trim()
            if (session === current && text) append(text)
          })
          .catch((reason) => fail(current, reason))
      }
      recorder.onprocessorerror = () =>
        fail(
          current,
          new Error('Запись прервалась. Запустите распознавание ещё раз.'),
        )
      const sourceEnded = () => {
        if (session === current && phase.value === 'recording') {
          error.value = display
            ? 'Передача звука завершена.'
            : 'Микрофон отключён.'
          void finish()
        }
      }
      for (const track of stream.getTracks())
        track.addEventListener('ended', sourceEnded, { once: true })
      context
        .createMediaStreamSource(new MediaStream([audioTrack]))
        .connect(recorder)
      phase.value = 'recording'
    } catch (reason) {
      const name = reason instanceof Error ? reason.name : ''
      let message: string
      if (display) {
        message =
          name === 'NotAllowedError'
            ? 'Передача звука не разрешена. Выберите источник и подтвердите доступ в браузере.'
            : 'Не удалось получить звук. Проверьте разрешение на запись экрана и звука или выберите вкладку со звуком.'
      } else {
        message =
          name === 'NotAllowedError'
            ? 'Разрешите доступ к микрофону в браузере.'
            : name === 'NotFoundError'
              ? 'Микрофон не найден.'
              : 'Не удалось включить микрофон.'
      }
      fail(current, new Error(message))
    }
  }

  async function finish(): Promise<boolean> {
    const current = session
    if (!current) return true
    if (!current.recorder) {
      cancel()
      return true
    }
    if (current.finish) return current.finish
    phase.value = 'finishing'
    current.recorder.port.postMessage('stop')
    current.stream?.getTracks().forEach((track) => track.stop())
    current.finish = (async () => {
      const timeout = window.setTimeout(
        () => fail(current, new Error('Не удалось завершить запись звука.')),
        2500,
      )
      await current.flushed
      window.clearTimeout(timeout)
      if (session !== current) return false
      release(current)
      await current.queue
      if (session !== current) return false
      session = undefined
      phase.value = 'idle'
      return true
    })()
    return current.finish
  }

  onUnmounted(cancel)
  return { phase, error, start, finish, cancel }
}
