/**
 * Timezone and Date utilities for automatic client timezone detection.
 */

export function getClientTimeZone(): string {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
  }
  return 'Asia/Ho_Chi_Minh'
}

export function getClientTimeZoneOffset(): string {
  if (typeof window === 'undefined') return 'GMT+7'
  const offsetMinutes = -new Date().getTimezoneOffset()
  const hours = Math.floor(Math.abs(offsetMinutes) / 60)
  const mins = Math.abs(offsetMinutes) % 60
  const sign = offsetMinutes >= 0 ? '+' : '-'
  return mins === 0 ? `GMT${sign}${hours}` : `GMT${sign}${hours}:${mins.toString().padStart(2, '0')}`
}

export function getClientLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getClientYesterdayDateString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return getClientLocalDateString(d)
}

export function formatClientHeaderDate(d: Date = new Date(), lang: 'vi' | 'en'): string {
  if (lang === 'vi') {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } else {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
}

export function formatClientGroupDate(dateStr: string, lang: 'vi' | 'en'): string {
  const [y, m, day] = dateStr.split('-').map(Number)
  if (!y || !m || !day) return dateStr
  const d = new Date(y, m - 1, day)
  return formatClientHeaderDate(d, lang)
}

export function formatClientTime(d: Date = new Date(), withSeconds: boolean = true): string {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  if (!withSeconds) return `${h}:${m}`
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function formatClientTimeShort(d: Date = new Date()): string {
  return formatClientTime(d, false)
}

export function formatClientDayOfWeek(d: Date = new Date(), lang: 'vi' | 'en'): string {
  if (lang === 'vi') {
    const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7']
    return days[d.getDay()]
  } else {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[d.getDay()]
  }
}

