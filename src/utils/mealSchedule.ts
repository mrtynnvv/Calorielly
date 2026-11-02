export type Meal = {
  time: string
  calories: number | null
  favoriteIds: string[]
}

export type MealSchedule = {
  enabled: boolean
  meals: Meal[]
}

export function getMealEatenAt(time: string, now: Date): string {
  const date = new Date(now)
  const hours = Number(time.slice(0, 2))
  const minutes = Number(time.slice(3))
  date.setHours(hours, minutes, 0, 0)
  if (date.getHours() !== hours || date.getMinutes() !== minutes) {
    throw new RangeError('INVALID_MEAL_TIME')
  }
  return date.toISOString()
}

export function getMealScheduleError(meals: Meal[]): string {
  if (meals.length < 2 || meals.length > 8) {
    return 'Выберите от 2 до 8 приёмов пищи.'
  }

  let previousTime = -120
  for (const [index, meal] of meals.entries()) {
    if (!/^\d{2}:\d{2}$/.test(meal.time)) {
      return `Укажите время приёма ${index + 1}.`
    }

    const hours = Number(meal.time.slice(0, 2))
    const minutes = Number(meal.time.slice(3))
    const time = hours * 60 + minutes
    if (minutes > 59 || time < 60 || time > 1380) {
      return 'Время приёмов должно быть от 01:00 до 23:00.'
    }
    if (time - previousTime < 120) {
      return 'Между приёмами должно быть не меньше двух часов.'
    }
    if (
      typeof meal.calories !== 'number' ||
      !Number.isInteger(meal.calories) ||
      meal.calories <= 0 ||
      meal.calories > 2147483647
    ) {
      return `Укажите положительное целое количество ккал для приёма ${index + 1}.`
    }
    previousTime = time
  }

  return ''
}

export function getCaloriePeriod(
  now: Date,
  dailyLimit: number,
  schedule: MealSchedule,
) {
  let start = new Date(now)
  start.setHours(0, 0, 0, 0)
  let end = new Date(start)
  end.setDate(end.getDate() + 1)

  if (!schedule.enabled || !schedule.meals.length) {
    return { start, end, limit: dailyLimit, mealIndex: null }
  }

  let mealIndex = schedule.meals.length - 1
  // Первый период начинается в полночь, остальные — за час до приёма.
  for (let i = 1; i < schedule.meals.length; i++) {
    const time = schedule.meals[i]!.time
    const hours = Number(time.slice(0, 2))
    const minutes = Number(time.slice(3))
    const boundary = new Date(start)
    boundary.setHours(hours - 1, minutes, 0, 0)
    if (now < boundary) {
      end = boundary
      mealIndex = i - 1
      break
    }
    start = boundary
  }

  return {
    start,
    end,
    limit: schedule.meals[mealIndex]!.calories ?? 0,
    mealIndex,
  }
}
