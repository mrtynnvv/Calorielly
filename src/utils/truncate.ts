export function truncate(text: string | null | undefined, max = 26) {
  const s = (text ?? '').trim()
  return s.length > max ? s.slice(0, max) + '...' : s
}
