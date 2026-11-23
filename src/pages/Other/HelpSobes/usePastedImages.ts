import { onUnmounted, ref, shallowRef, type Ref } from 'vue'

const mib = 1024 * 1024
const maxImageBytes = 4 * mib
const maxMessageBytes = 8 * mib
const supportedTypes = ['image/png', 'image/jpeg', 'image/webp']

type DraftImage = { file: File; url: string }

async function prepareImage(file: File) {
  if (file.size > 32 * mib)
    throw new Error('Для вставки подойдёт изображение размером до 32 МБ.')
  if (supportedTypes.includes(file.type) && file.size <= maxImageBytes)
    return file
  if (file.type === 'image/svg+xml')
    throw new Error('Для вставки подойдёт растровое изображение или скриншот.')

  const image = new Image()
  const source = URL.createObjectURL(file)
  try {
    image.src = source
    await image.decode()
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error()
    let scale = Math.min(
      1,
      4096 / Math.max(image.naturalWidth, image.naturalHeight),
    )
    for (let attempt = 0; attempt < 5; attempt++) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.9),
      )
      if (!blob) throw new Error()
      if (blob.size <= maxImageBytes)
        return new File([blob], 'image.' + blob.type.split('/')[1], {
          type: blob.type,
        })
      scale *= 0.75
    }
  } catch {
    throw new Error(
      'Не удалось прочитать изображение. Попробуйте вставить скриншот.',
    )
  } finally {
    URL.revokeObjectURL(source)
  }
  throw new Error('Не удалось уменьшить изображение до 4 МБ.')
}

export function usePastedImages(error: Ref<string>) {
  const images = shallowRef<DraftImage[]>([])
  const preparing = ref(0)
  let queue = Promise.resolve(true)
  let active = true

  function discard(removed: DraftImage[]) {
    for (const image of removed) URL.revokeObjectURL(image.url)
    images.value = images.value.filter((image) => !removed.includes(image))
  }

  function paste(event: ClipboardEvent) {
    const data = event.clipboardData
    if (!data) return
    const files = data.files.length
      ? Array.from(data.files)
      : Array.from(data.items, (item) => item.getAsFile())
    const pasted = files.filter(
      (file): file is File => !!file?.type.startsWith('image/'),
    )
    if (!pasted.length) return
    event.preventDefault()
    error.value = ''
    if (images.value.length + preparing.value + pasted.length > 4) {
      error.value = 'К сообщению можно приложить до четырёх изображений.'
      return
    }
    const previous = preparing.value ? queue : Promise.resolve(true)
    preparing.value += pasted.length
    queue = previous.then(async (earlierImagesReady) => {
      try {
        const prepared: File[] = []
        for (const file of pasted) {
          if (!active) return false
          prepared.push(await prepareImage(file))
        }
        if (!active) return false
        const bytes = [
          ...images.value.map((image) => image.file),
          ...prepared,
        ].reduce((sum, file) => sum + file.size, 0)
        if (bytes > maxMessageBytes)
          throw new Error('Суммарный размер изображений может быть до 8 МБ.')
        images.value = [
          ...images.value,
          ...prepared.map((file) => ({ file, url: URL.createObjectURL(file) })),
        ]
        return earlierImagesReady
      } catch (reason) {
        if (active)
          error.value =
            reason instanceof Error
              ? reason.message
              : 'Не удалось вставить изображение.'
        return false
      } finally {
        preparing.value -= pasted.length
      }
    })
  }

  onUnmounted(() => {
    active = false
    discard(images.value)
  })

  return { images, preparing, paste, discard, finishPreparing: () => queue }
}
