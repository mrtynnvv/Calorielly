import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getCaloriePeriod, getMealScheduleError } from './mealSchedule.ts'

const meals = [
  { time: '08:00', calories: 500 },
  { time: '13:00', calories: 800 },
  { time: '19:00', calories: 700 },
]
const schedule = { enabled: true, meals }
const at = (hour, minute = 0, second = 0) =>
  new Date(2026, 10, 2, hour, minute, second)

test('accepts 2 to 8 meals, endpoint times and an exact two-hour gap', () => {
  assert.equal(getMealScheduleError(meals), '')
  assert.equal(
    getMealScheduleError([
      { time: '01:00', calories: 1 },
      { time: '23:00', calories: 2147483647 },
    ]),
    '',
  )
  assert.equal(
    getMealScheduleError(
      Array.from({ length: 8 }, (_, index) => ({
        time: `${String(index * 2 + 1).padStart(2, '0')}:00`,
        calories: 100,
      })),
    ),
    '',
  )
})

test('rejects missing, excessive, unordered and overlapping meals', () => {
  for (const invalid of [
    [],
    meals.slice(0, 1),
    Array.from({ length: 9 }, (_, index) => ({
      time: `${String(index * 2 + 1).padStart(2, '0')}:00`,
      calories: 100,
    })),
    [meals[1], meals[0]],
    [meals[0], meals[0]],
    [meals[0], { time: '09:59', calories: 500 }],
  ]) {
    assert.notEqual(getMealScheduleError(invalid), '')
  }
})

test('rejects malformed times and times outside 01:00 to 23:00', () => {
  for (const time of ['', '8:00', '12:60', '00:59', '23:01', '24:00']) {
    assert.notEqual(
      getMealScheduleError([{ time, calories: 500 }, meals[2]]),
      '',
    )
  }
})

test('requires a positive integer calorie limit for every meal', () => {
  for (const calories of [null, 0, -1, 1.5, NaN, Infinity, 2147483648]) {
    assert.notEqual(
      getMealScheduleError([{ ...meals[0], calories }, meals[2]]),
      '',
    )
  }
})

test('ordinary mode uses the whole local day and its independent limit', () => {
  const period = getCaloriePeriod(at(14), 1800, { ...schedule, enabled: false })
  assert.equal(+period.start, +at(0))
  assert.equal(+period.end, +at(24))
  assert.equal(period.limit, 1800)
  assert.equal(period.mealIndex, null)
})

test('the first meal starts at midnight, regardless of breakfast time', () => {
  for (const now of [at(0), at(7), at(11, 59, 59)]) {
    const period = getCaloriePeriod(now, 1800, schedule)
    assert.equal(+period.start, +at(0))
    assert.equal(+period.end, +at(12))
    assert.equal(period.limit, 500)
    assert.equal(period.mealIndex, 0)
  }
})

test('12:00 belongs to lunch and 18:00 belongs to dinner', () => {
  const lunch = getCaloriePeriod(at(12), 1800, schedule)
  assert.equal(+lunch.start, +at(12))
  assert.equal(+lunch.end, +at(18))
  assert.equal(lunch.limit, 800)
  assert.equal(lunch.mealIndex, 1)

  const dinner = getCaloriePeriod(at(18), 1800, schedule)
  assert.equal(+dinner.start, +at(18))
  assert.equal(+dinner.end, +at(24))
  assert.equal(dinner.limit, 700)
  assert.equal(dinner.mealIndex, 2)
})

test('midnight starts the next breakfast without carrying dinner over', () => {
  const period = getCaloriePeriod(at(24), 1800, schedule)
  assert.equal(+period.start, +at(24))
  assert.equal(+period.end, +at(36))
  assert.equal(period.limit, 500)
  assert.equal(period.mealIndex, 0)
})

test('editing the schedule recalculates the current interval immediately', () => {
  const changed = {
    enabled: true,
    meals: [
      { time: '08:00', calories: 550 },
      { time: '14:00', calories: 900 },
      { time: '19:00', calories: 750 },
    ],
  }
  assert.equal(getCaloriePeriod(at(12, 30), 1800, schedule).mealIndex, 1)
  const period = getCaloriePeriod(at(12, 30), 1800, changed)
  assert.equal(period.mealIndex, 0)
  assert.equal(period.limit, 550)
  assert.equal(+period.end, +at(13))
})

test('UTC timestamps are assigned by local boundaries, once per interval', () => {
  const entries = [
    { eatenAt: at(0).toISOString(), calories: 750 },
    { eatenAt: at(12).toISOString(), calories: 100 },
    { eatenAt: at(17, 59).toISOString(), calories: 40 },
    { eatenAt: at(18).toISOString(), calories: 900 },
  ]
  const period = getCaloriePeriod(at(14), 1800, schedule)
  const eaten = entries
    .filter((food) => {
      const time = new Date(food.eatenAt)
      return time >= period.start && time < period.end
    })
    .reduce((sum, food) => sum + food.calories, 0)
  assert.equal(eaten, 140)
  assert.equal(period.limit - eaten, 660)
})

test('day boundaries use the next local date even on a clock-change day', () => {
  const now = new Date(2026, 10, 1, 12)
  const period = getCaloriePeriod(now, 1800, { enabled: false, meals: [] })
  assert.equal(+period.start, +new Date(2026, 10, 1))
  assert.equal(+period.end, +new Date(2026, 10, 2))
})

test('an incomplete schedule falls back to the ordinary model', () => {
  const period = getCaloriePeriod(at(14), 1800, {
    enabled: true,
    meals: [{ time: '', calories: null }],
  })
  assert.equal(period.mealIndex, null)
  assert.equal(period.limit, 1800)
})
