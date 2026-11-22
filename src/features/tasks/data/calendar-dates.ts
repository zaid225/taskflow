export function localDateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function dateFromKey(key: string) {
  return new Date(key + 'T00:00:00Z')
}

export function monthDays(month: string) {
  const first = dateFromKey(month + '-01')
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return [
    ...Array<string | null>((first.getUTCDay() + 6) % 7).fill(null),
    ...Array.from({ length: count }, (_, index) => month + '-' + String(index + 1).padStart(2, '0')),
  ]
}

export function shiftMonth(month: string, offset: number) {
  const date = dateFromKey(month + '-01')
  date.setUTCMonth(date.getUTCMonth() + offset)
  return date.toISOString().slice(0, 7)
}
