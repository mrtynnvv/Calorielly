type Origin = 'typed' | 'dictated' | 'corrected'

export function createDictationDraft(initialText: string) {
  let text = initialText
  // Keep the same UTF-16 offsets the textarea uses, including for emoji.
  let origins = Array<Origin>(text.length).fill('typed')
  let selection: { start: number; end: number } | undefined

  function beforeEdit(field: HTMLTextAreaElement) {
    selection = { start: field.selectionStart, end: field.selectionEnd }
  }

  function update(value: string, caret = value.length) {
    const previous = selection
    selection = undefined
    let start = previous?.start ?? 0
    let end = previous?.end ?? 0
    let insertedEnd = value.length - (text.length - end)
    if (
      !previous ||
      insertedEnd < start ||
      text.slice(0, start) !== value.slice(0, start) ||
      text.slice(end) !== value.slice(insertedEnd)
    ) {
      if (value === text) return
      // Deletion by word, undo and some IMEs can edit outside the selection.
      start = 0
      end = text.length
      insertedEnd = value.length
      while (
        insertedEnd > caret &&
        end > 0 &&
        text[end - 1] === value[insertedEnd - 1]
      ) {
        end--
        insertedEnd--
      }
      while (start < end && start < insertedEnd && text[start] === value[start])
        start++
      while (
        end > start &&
        insertedEnd > start &&
        text[end - 1] === value[insertedEnd - 1]
      ) {
        end--
        insertedEnd--
      }
    }

    const replacement = origins
      .slice(start, end)
      .some((origin) => origin !== 'typed')
    const insidePhrase =
      start > 0 &&
      end < origins.length &&
      origins[start - 1] !== 'typed' &&
      origins[end] !== 'typed'
    const inserted = Array<Origin>(insertedEnd - start).fill(
      replacement || insidePhrase ? 'corrected' : 'typed',
    )
    origins = origins.slice(0, start).concat(inserted, origins.slice(end))
    text = value
  }

  function edited(field: HTMLTextAreaElement) {
    update(field.value, field.selectionStart)
  }

  function appended(value: string, start: number) {
    update(value.slice(0, start))
    origins = origins.concat(
      Array<Origin>(value.length - start).fill('dictated'),
    )
    text = value
  }

  function hasTranscript() {
    return origins.some(
      (origin, i) => origin !== 'typed' && /\S/.test(text.charAt(i)),
    )
  }

  function rollback(field: HTMLTextAreaElement) {
    edited(field)
    const direction = field.selectionDirection
    let end = origins.length
    while (end > 0) {
      let start = end
      while (start > 0 && origins[start - 1] === 'dictated') start--
      if (start < end) {
        const space = text.slice(start, end).search(/\s/)
        if (
          space >= 0 &&
          /[\p{L}\p{M}\p{N}_]$/u.test(text.slice(0, start)) &&
          /^[\p{L}\p{M}\p{N}_]/u.test(text.slice(end))
        ) {
          // Keep the original separator between surviving words and its caret position.
          const keep = start + space
          field.setRangeText('', keep + 1, end, 'preserve')
          field.setRangeText('', start, keep, 'preserve')
        } else field.setRangeText('', start, end, 'preserve')
      }
      end = start - 1
    }
    field.setSelectionRange(field.selectionStart, field.selectionEnd, direction)
    text = field.value
    origins = Array<Origin>(text.length).fill('typed')
  }

  return { beforeEdit, edited, appended, hasTranscript, rollback }
}
