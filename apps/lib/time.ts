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

/**
 * Normalizes any date string or Excel/Sheets serial number into standard YYYY-MM-DD format
 */
export function normalizeDateString(val: any): string {
  if (!val) return ''
  const rawStr = String(val).trim()
  if (!rawStr) return ''

  // Support Vietnamese locale decimal comma in serial numbers (e.g. 46286,86919 -> 46286.86919)
  const str = rawStr.replace(',', '.')

  // Excel / Google Sheets serial date (e.g. 46286 or 46286.86919 -> 2026-09-21)
  const num = Number(str)
  if (!isNaN(num) && num > 30000 && num < 75000) {
    const intDays = Math.floor(num)
    // 25569 days between 1899-12-30 and 1970-01-01
    const ms = Math.round((intDays - 25569) * 86400 * 1000)
    const date = new Date(ms)
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // YYYY.MM.DD or YYYY-MM-DD or YYYY/MM/DD (optionally followed by time)
  const ymd = str.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/)
  if (ymd) {
    const [, y, m, d] = ymd
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // ISO string with T (e.g. 2026-09-21T14:19:42.881Z)
  if (str.includes('T')) {
    const parsed = new Date(str)
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear()
      const m = String(parsed.getMonth() + 1).padStart(2, '0')
      const d = String(parsed.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/)
  if (dmy) {
    const [, d, m, y] = dmy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return rawStr
}

/**
 * Normalizes any time value into standard HH:mm format (24H).
 * Handles:
 * - HH:mm or HH:mm:ss strings
 * - Excel/Google Sheets fractional day serial numbers (e.g. 0,86875 -> 20:51, 0,09444444444 -> 02:16)
 * - Serial datetimes with fraction (e.g. 46286.86875 -> 20:51)
 * - Embedded time inside datetime strings (e.g. "2026.09.21 20:51:30" -> "20:51")
 */
export function normalizeTimeString(val: any): string {
  if (!val && val !== 0) return ''
  const rawStr = String(val).trim()
  if (!rawStr) return ''

  // Replace comma with dot for numeric parsing
  const str = rawStr.replace(',', '.')

  // Standard HH:mm or HH:mm:ss
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
  }

  // Decimal time fraction of day from Excel / Google Sheets (0 <= num < 1)
  const num = Number(str)
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalSeconds = Math.round(num * 86400)
    const hours = Math.floor(totalSeconds / 3600) % 24
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  // Serial datetime where time is fractional part (e.g. 46286.86875)
  if (!isNaN(num) && num >= 1) {
    const frac = num - Math.floor(num)
    if (frac > 0) {
      const totalSeconds = Math.round(frac * 86400)
      const hours = Math.floor(totalSeconds / 3600) % 24
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  // Date string containing time (e.g. 2026.09.21 20:51:30 or 2026-09-21T20:51:00.000Z)
  const embeddedTime = str.match(/(?:T|\s)(\d{1,2}):(\d{2})/)
  if (embeddedTime) {
    return `${embeddedTime[1].padStart(2, '0')}:${embeddedTime[2]}`
  }

  return rawStr
}

/**
 * Extracts a numeric timestamp from an ID (e.g. exp-1790045297489 -> 1790045297489)
 * or falls back to Date + Time parse.
 */
export function parseItemTimestamp(id: string, dateStr?: string, timeStr?: string): number {
  if (id) {
    const match = id.match(/\d{10,}/)
    if (match) return Number(match[0])
  }
  if (dateStr) {
    const time = timeStr || '00:00'
    const cleanDate = normalizeDateString(dateStr)
    const cleanTime = normalizeTimeString(time) || '00:00'
    const d = new Date(`${cleanDate}T${cleanTime}:00`)
    if (!isNaN(d.getTime())) return d.getTime()
  }
  return 0
}

/**
 * Sorts expenses descending: latest date first; within the same date, latest transaction first.
 */
export function compareExpensesDescending<T extends { id: string; date: string }>(a: T, b: T): number {
  const dateA = normalizeDateString(a.date)
  const dateB = normalizeDateString(b.date)
  if (dateA !== dateB) {
    return dateB.localeCompare(dateA)
  }
  const timeA = parseItemTimestamp(a.id, dateA)
  const timeB = parseItemTimestamp(b.id, dateB)
  if (timeA !== timeB) {
    return timeB - timeA
  }
  return b.id.localeCompare(a.id)
}

/**
 * Sorts moments descending: latest date first; within the same date, latest time first.
 */
export function compareMomentsDescending<T extends { id: string; date: string; time: string }>(a: T, b: T): number {
  const dateA = normalizeDateString(a.date)
  const dateB = normalizeDateString(b.date)
  if (dateA !== dateB) {
    return dateB.localeCompare(dateA)
  }
  const normTimeA = normalizeTimeString(a.time)
  const normTimeB = normalizeTimeString(b.time)
  if (normTimeA !== normTimeB) {
    return normTimeB.localeCompare(normTimeA)
  }
  const timeA = parseItemTimestamp(a.id, dateA, normTimeA)
  const timeB = parseItemTimestamp(b.id, dateB, normTimeB)
  if (timeA !== timeB) {
    return timeB - timeA
  }
  return b.id.localeCompare(a.id)
}



