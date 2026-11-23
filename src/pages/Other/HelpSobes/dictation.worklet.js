// Микрофон работает непрерывно, а каждая фраза уходит на распознавание отдельно.
class DictationProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.frames = []
    this.length = 0
    this.voiced = 0
    this.voicedRun = 0
    this.longestRun = 0
    this.silence = 0
    this.active = true
    this.port.onmessage = ({ data }) => {
      if (data === 'stop') {
        this.active = false
        this.flush()
        this.port.postMessage('stopped')
      }
    }
  }

  process(inputs) {
    if (!this.active) return false
    const input = inputs[0][0]
    if (!input?.length) return true
    let energy = 0
    for (const value of input) energy += value * value
    const audible = energy / input.length > 0.006 ** 2

    this.frames.push(input.slice())
    this.length += input.length
    if (audible) {
      this.voiced += input.length
      this.voicedRun += input.length
      this.longestRun = Math.max(this.longestRun, this.voicedRun)
      this.silence = 0
    } else if (this.voiced) {
      this.voicedRun = 0
      this.silence += input.length
    } else {
      // Оставляем начало тихих слогов, но не отправляем тишину провайдеру.
      while (this.length > sampleRate * 0.2 && this.frames.length > 1)
        this.length -= this.frames.shift().length
    }

    if (
      this.silence >= sampleRate * 0.6 ||
      (this.length >= sampleRate * 4 && this.silence >= sampleRate * 0.12) ||
      this.length >= sampleRate * 7
    )
      this.flush()
    return true
  }

  flush() {
    // У отдельных щелчков клавиатуры нет протяжённого звука, как у короткого слова.
    if (
      this.voiced >= sampleRate * 0.1 &&
      this.longestRun >= sampleRate * 0.045
    ) {
      const phrase = new Float32Array(this.length)
      let offset = 0
      for (const frame of this.frames) {
        phrase.set(frame, offset)
        offset += frame.length
      }
      this.port.postMessage(phrase, [phrase.buffer])
    }
    this.frames = []
    this.length = this.voiced = this.silence = 0
    this.voicedRun = this.longestRun = 0
  }
}

registerProcessor('sobes-dictation', DictationProcessor)
