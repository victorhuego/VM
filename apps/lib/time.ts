/**
 * Timezone and Date utilities for automatic client timezone detection.
 */

import type { MomentItem } from './types'

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
 * Formats an ISO string, timestamp, or Date object into client local time (or target timezone).
 * Supports both colon format (10:31) and Vietnamese 'h' format (10h31).
 */
export function formatIsoToClientTime(
  isoOrDate: string | Date | number,
  options?: { timeZone?: string; format?: 'h' | 'colon'; withSeconds?: boolean }
): string {
  if (!isoOrDate && isoOrDate !== 0) return ''
  const date = typeof isoOrDate === 'object' && isoOrDate instanceof Date
    ? isoOrDate
    : new Date(isoOrDate)
  if (isNaN(date.getTime())) return ''

  const timeZone = options?.timeZone || getClientTimeZone()
  const format = options?.format || 'colon'
  const withSeconds = options?.withSeconds ?? false

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: withSeconds ? '2-digit' : undefined,
      hour12: false,
    }).formatToParts(date)

    const hour = parts.find((p) => p.type === 'hour')?.value || '00'
    const minute = parts.find((p) => p.type === 'minute')?.value || '00'
    const second = withSeconds ? parts.find((p) => p.type === 'second')?.value || '00' : ''

    if (format === 'h') {
      return withSeconds ? `${hour}h${minute}m${second}s` : `${hour}h${minute}`
    }
    return withSeconds ? `${hour}:${minute}:${second}` : `${hour}:${minute}`
  } catch {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    if (format === 'h') return `${h}h${m}`
    return `${h}:${m}`
  }
}

export function formatIsoToClientDate(
  isoOrDate: string | Date | number,
  options?: { timeZone?: string; format?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'vi' | 'en' }
): string {
  if (!isoOrDate && isoOrDate !== 0) return ''
  const date = typeof isoOrDate === 'object' && isoOrDate instanceof Date
    ? isoOrDate
    : new Date(isoOrDate)
  if (isNaN(date.getTime())) return ''

  const timeZone = options?.timeZone || getClientTimeZone()
  const format = options?.format || 'YYYY-MM-DD'

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)

    const year = parts.find((p) => p.type === 'year')?.value || '1970'
    const month = parts.find((p) => p.type === 'month')?.value || '01'
    const day = parts.find((p) => p.type === 'day')?.value || '01'

    if (format === 'DD/MM/YYYY' || format === 'vi') {
      return `${day}/${month}/${year}`
    }
    if (format === 'en') {
      return date.toLocaleDateString('en-US', { timeZone, month: 'short', day: 'numeric', year: 'numeric' })
    }
    return `${year}-${month}-${day}`
  } catch {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    if (format === 'DD/MM/YYYY' || format === 'vi') return `${d}/${m}/${y}`
    return `${y}-${m}-${d}`
  }
}

/**
 * Normalizes any date string or Excel/Sheets serial number into standard YYYY-MM-DD format
 * with client timezone awareness for ISO timestamps.
 */
export function normalizeDateString(
  val: any,
  options?: { timeZone?: string }
): string {
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

  // YYYY.MM.DD or YYYY-MM-DD or YYYY/MM/DD (without T/ISO suffix)
  const ymd = str.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})(?!\s*T)/)
  if (ymd && !str.includes('T')) {
    const [, y, m, d] = ymd
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Full ISO string with T (e.g. 2026-10-01T03:31:52.851Z or 2026-09-21T14:19:42.881Z)
  if (str.includes('T')) {
    const formatted = formatIsoToClientDate(str, { timeZone: options?.timeZone })
    if (formatted) return formatted
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
 * Normalizes any time value into standard HH:mm or HHhMM format.
 * Handles:
 * - HH:mm or HH:mm:ss strings
 * - ISO timestamps with UTC/Z (e.g. 2026-10-01T03:31:52.851Z) converted to client local time
 * - Excel/Google Sheets fractional day serial numbers (e.g. 0,86875 -> 20:51, 0,09444444444 -> 02:16)
 * - Serial datetimes with fraction (e.g. 46286.86875 -> 20:51)
 * - Embedded time inside datetime strings (e.g. "2026.09.21 20:51:30" -> "20:51")
 */
export function normalizeTimeString(
  val: any,
  options?: { timeZone?: string; format?: 'colon' | 'h'; withSeconds?: boolean }
): string {
  if (!val && val !== 0) return ''
  const rawStr = String(val).trim()
  if (!rawStr) return ''

  // Replace comma with dot for numeric parsing
  const str = rawStr.replace(',', '.')

  // Standard HH:mm or HH:mm:ss without timezone offset
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (timeMatch) {
    const hour = timeMatch[1].padStart(2, '0')
    const minute = timeMatch[2]
    return options?.format === 'h' ? `${hour}h${minute}` : `${hour}:${minute}`
  }

  // Full ISO string with T and UTC 'Z' or offset (e.g. 2026-10-01T03:31:52.851Z)
  if (str.includes('T') && (str.endsWith('Z') || /[+-]\d{2}(?::?\d{2})?$/.test(str))) {
    const formatted = formatIsoToClientTime(str, {
      timeZone: options?.timeZone,
      format: options?.format || 'colon',
      withSeconds: options?.withSeconds,
    })
    if (formatted) return formatted
  }

  // Decimal time fraction of day from Excel / Google Sheets (0 <= num < 1)
  const num = Number(str)
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalSeconds = Math.round(num * 86400)
    const hours = Math.floor(totalSeconds / 3600) % 24
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const h = String(hours).padStart(2, '0')
    const m = String(minutes).padStart(2, '0')
    return options?.format === 'h' ? `${h}h${m}` : `${h}:${m}`
  }

  // Serial datetime where time is fractional part (e.g. 46286.86875)
  if (!isNaN(num) && num >= 1) {
    const frac = num - Math.floor(num)
    if (frac > 0) {
      const totalSeconds = Math.round(frac * 86400)
      const hours = Math.floor(totalSeconds / 3600) % 24
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const h = String(hours).padStart(2, '0')
      const m = String(minutes).padStart(2, '0')
      return options?.format === 'h' ? `${h}h${m}` : `${h}:${m}`
    }
  }

  // Date string containing time (e.g. 2026.09.21 20:51:30 or 2026-09-21T20:51:00)
  const embeddedTime = str.match(/(?:T|\s)(\d{1,2}):(\d{2})/)
  if (embeddedTime) {
    const h = embeddedTime[1].padStart(2, '0')
    const m = embeddedTime[2]
    return options?.format === 'h' ? `${h}h${m}` : `${h}:${m}`
  }

  return rawStr
}

/**
 * Validates timezone conversions for DB timestamps across target regions:
 * - South Korea (Asia/Seoul, UTC+9): 12h31 / 12:31
 * - Vietnam (Asia/Ho_Chi_Minh, UTC+7): 10h31 / 10:31
 * - Client local device timezone
 */
export function testClientTimeZoneConversion(sampleIso: string = '2026-10-01T03:31:52.851Z'): {
  iso: string
  korea: { timeZone: string; colon: string; h: string; date: string }
  vietnam: { timeZone: string; colon: string; h: string; date: string }
  client: { timeZone: string; colon: string; h: string; date: string }
  passed: boolean
} {
  const koreaTime = formatIsoToClientTime(sampleIso, { timeZone: 'Asia/Seoul', format: 'h' })
  const koreaColon = formatIsoToClientTime(sampleIso, { timeZone: 'Asia/Seoul', format: 'colon' })
  const koreaDate = formatIsoToClientDate(sampleIso, { timeZone: 'Asia/Seoul' })

  const vietnamTime = formatIsoToClientTime(sampleIso, { timeZone: 'Asia/Ho_Chi_Minh', format: 'h' })
  const vietnamColon = formatIsoToClientTime(sampleIso, { timeZone: 'Asia/Ho_Chi_Minh', format: 'colon' })
  const vietnamDate = formatIsoToClientDate(sampleIso, { timeZone: 'Asia/Ho_Chi_Minh' })

  const clientTz = getClientTimeZone()
  const clientTime = formatIsoToClientTime(sampleIso, { format: 'h' })
  const clientColon = formatIsoToClientTime(sampleIso, { format: 'colon' })
  const clientDate = formatIsoToClientDate(sampleIso)

  const koreaPassed = koreaTime === '12h31' && koreaColon === '12:31'
  const vietnamPassed = vietnamTime === '10h31' && vietnamColon === '10:31'
  const passed = koreaPassed && vietnamPassed

  return {
    iso: sampleIso,
    korea: { timeZone: 'Asia/Seoul', colon: koreaColon, h: koreaTime, date: koreaDate },
    vietnam: { timeZone: 'Asia/Ho_Chi_Minh', colon: vietnamColon, h: vietnamTime, date: vietnamDate },
    client: { timeZone: clientTz, colon: clientColon, h: clientTime, date: clientDate },
    passed,
  }
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

/**
 * Normalizes a MomentItem to the client's local timezone using createdAt or id timestamp.
 * In Vietnam (Asia/Ho_Chi_Minh): a moment with createdAt 2026-10-01T03:31:52.851Z renders as 10:31
 * In Korea (Asia/Seoul): it renders as 12:31
 */
export function normalizeMomentToClient(
  item: MomentItem,
  timeZone?: string
): MomentItem {
  const tz = timeZone || getClientTimeZone()
  let iso = item.createdAt
  if (!iso && item.id && item.id.startsWith('mom-')) {
    const ts = Number(item.id.replace('mom-', ''))
    if (!isNaN(ts) && ts > 1000000000000) {
      iso = new Date(ts).toISOString()
    }
  }

  if (iso) {
    const clientTime = formatIsoToClientTime(iso, { timeZone: tz, format: 'colon' })
    const clientDate = formatIsoToClientDate(iso, { timeZone: tz })
    return {
      ...item,
      time: clientTime || item.time,
      date: clientDate || item.date,
      createdAt: iso,
    }
  }

  return item
}

export function getMomentClientTime(
  item: MomentItem,
  options?: { format?: 'colon' | 'h'; withSeconds?: boolean; timeZone?: string }
): string {
  const tz = options?.timeZone || getClientTimeZone()
  let iso = item.createdAt
  if (!iso && item.id && item.id.startsWith('mom-')) {
    const ts = Number(item.id.replace('mom-', ''))
    if (!isNaN(ts) && ts > 1000000000000) {
      iso = new Date(ts).toISOString()
    }
  }
  if (iso) {
    const formatted = formatIsoToClientTime(iso, { ...options, timeZone: tz })
    if (formatted) return formatted
  }
  return normalizeTimeString(item.time, { ...options, timeZone: tz }) || item.time || ''
}

export function getMomentClientDate(
  item: MomentItem,
  options?: { timeZone?: string; format?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'vi' | 'en' }
): string {
  const tz = options?.timeZone || getClientTimeZone()
  let iso = item.createdAt
  if (!iso && item.id && item.id.startsWith('mom-')) {
    const ts = Number(item.id.replace('mom-', ''))
    if (!isNaN(ts) && ts > 1000000000000) {
      iso = new Date(ts).toISOString()
    }
  }
  if (iso) {
    const formatted = formatIsoToClientDate(iso, { ...options, timeZone: tz })
    if (formatted) return formatted
  }
  return normalizeDateString(item.date, { timeZone: tz }) || item.date || ''
}



