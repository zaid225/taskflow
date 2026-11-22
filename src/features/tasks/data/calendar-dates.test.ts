import { expect, it } from 'vitest'
import { localDateKey, monthDays, shiftMonth } from './calendar-dates'

it('builds an aligned leap-year calendar and navigates across year boundaries', () => {
  const days = monthDays('2024-02')
  expect(days.slice(0, 4)).toEqual([null, null, null, '2024-02-01'])
  expect(days.at(-1)).toBe('2024-02-29')
  expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  expect(shiftMonth('2027-01', -1)).toBe('2026-12')
  expect(localDateKey(new Date(2026, 0, 2, 23))).toBe('2026-01-02')
})
