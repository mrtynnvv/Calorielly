// проверяет валидность JWT по полю exp (если оно есть)
export function isJwtValid(token?: string): boolean {
  // Пустого токена нет — невалиден
  if (!token) return false
  // разбивает JWT на части: header.payload.signature
  const parts = token.split('.')
  // должно быть минимум две части (header и payload)
  if (parts.length < 2) return false
  try {
    // приводит JWT к стандартному base64
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    )

    const json = atob(padded)
    // преобразует в объект
    const payload = JSON.parse(json) as { exp?: number }
    // если есть exp (секунды юникс) сравнивает с текущим временем
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000 > Date.now()
    }
    // Если exp нет - считает валидным (проверку отдает серверу)
    return true // нет exp - токен считать валидным
  } catch {
    // любая ошибка парсинга - считает токен невалидным
    return false
  }
}
