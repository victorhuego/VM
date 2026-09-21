import { getGoogleSheets, getSpreadsheetId } from './client'
import { ExpenseItem, DebtItem, MomentItem, InitialBalances, FinancialState } from '@/lib/types'

// Cache structure
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL_MS = 2 * 1000 // 2 seconds for near real-time synchronization
const memoryCache: Record<string, CacheEntry<unknown>> = {}

export function clearSheetCache() {
  for (const key of Object.keys(memoryCache)) {
    delete memoryCache[key]
  }
}

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache[key]
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    delete memoryCache[key]
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T) {
  memoryCache[key] = {
    data,
    timestamp: Date.now(),
  }
}

// Tab headers
export const EXPENSES_HEADERS = [
  'id',
  'date',
  'type',
  'category',
  'amount',
  'source',
  'transferDirection',
  'note',
  'image',
  'debtId',
  'reconcileDiff',
  'createdAt',
]

export const DEBTS_HEADERS = [
  'id',
  'title',
  'amount',
  'date',
  'creditor',
  'note',
  'status',
  'createdAt',
]

export const MOMENTS_HEADERS = [
  'id',
  'date',
  'time',
  'caption',
  'mood',
  'image',
  'driveFileId',
  'driveName',
  'createdAt',
]

export const BALANCES_HEADERS = [
  'cash',
  'bankAccount',
  'savings',
  'monthlyBudget',
  'savingsGoal',
  'updatedAt',
]

export const AUTH_TOKENS_HEADERS = [
  'service',
  'refreshToken',
  'accessToken',
  'expiryDate',
  'updatedAt',
]

/**
 * Returns map of sheetTitle -> sheetId (numeric ID)
 */
export async function getSheetMap(): Promise<Record<string, number>> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(sheetId,title)',
  })

  const map: Record<string, number> = {}
  for (const s of res.data.sheets || []) {
    if (s.properties?.title && s.properties?.sheetId !== undefined && s.properties?.sheetId !== null) {
      map[s.properties.title] = s.properties.sheetId
    }
  }
  return map
}

/**
 * Auto-initializes tabs, headers, and freeze rows in Google Spreadsheet
 */
export async function initSpreadsheet() {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()
  const currentSheetMap = await getSheetMap()

  const requiredSheets = [
    { title: 'Expenses', headers: EXPENSES_HEADERS },
    { title: 'Debts', headers: DEBTS_HEADERS },
    { title: 'Moments', headers: MOMENTS_HEADERS },
    { title: 'InitialBalances', headers: BALANCES_HEADERS },
    { title: 'AuthTokens', headers: AUTH_TOKENS_HEADERS },
  ]

  const requests: any[] = []

  // 1. Create missing sheets
  for (const req of requiredSheets) {
    if (!(req.title in currentSheetMap)) {
      requests.push({
        addSheet: {
          properties: {
            title: req.title,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      })
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    })
  }

  // Refresh map after creation
  const updatedSheetMap = await getSheetMap()

  // 2. Ensure headers and freeze rows
  for (const req of requiredSheets) {
    const sheetId = updatedSheetMap[req.title]
    // Check header
    const checkHeader = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${req.title}!A1:Z1`,
    })

    const existingHeaders = checkHeader.data.values?.[0]
    if (!existingHeaders || existingHeaders.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${req.title}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [req.headers],
        },
      })
    }

    // Freeze row 1 and format header
    if (sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
                fields: 'gridProperties.frozenRowCount',
              },
            },
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: req.headers.length,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.94, green: 0.95, blue: 0.96 },
                    textFormat: { bold: true },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      })
    }
  }

  // 3. Seed InitialBalances if empty
  const balCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'InitialBalances!A2:F2',
  })

  if (!balCheck.data.values || balCheck.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'InitialBalances!A2:F2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[0, 0, 0, 0, 0, new Date().toISOString()]],
      },
    })
  }

  clearSheetCache()
  return { success: true, message: 'Google Spreadsheet initialized successfully' }
}

// ---------------------------------------------------------------------------
// EXPENSES CRUD
// ---------------------------------------------------------------------------

export async function getExpenses(): Promise<ExpenseItem[]> {
  const cacheKey = 'expenses'
  const cached = getFromCache<ExpenseItem[]>(cacheKey)
  if (cached) return cached

  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Expenses!A2:L',
  })

  const rows = res.data.values || []
  const items: ExpenseItem[] = rows
    .filter((r) => Boolean(r[0])) // must have id
    .map((r) => ({
      id: String(r[0] || ''),
      date: String(r[1] || ''),
      type: (r[2] as any) || 'expense',
      category: String(r[3] || 'other'),
      amount: Number(r[4] || 0),
      source: (r[5] as any) || 'account',
      transferDirection: r[6] ? (r[6] as any) : undefined,
      note: String(r[7] || ''),
      timeAgo: String(r[1] || '').split('-').slice(1).reverse().join('/') || '',
      image: r[8] ? String(r[8]) : undefined,
      debtId: r[9] ? String(r[9]) : undefined,
      reconcileDiff: r[10] ? Number(r[10]) : undefined,
    }))

  setCache(cacheKey, items)
  return items
}

export async function addExpense(item: ExpenseItem): Promise<ExpenseItem> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const row = [
    item.id,
    item.date,
    item.type || 'expense',
    item.category,
    item.amount,
    item.source || 'account',
    item.transferDirection || '',
    item.note || '',
    item.image && item.image.length > 2000 ? '' : (item.image || ''),
    item.debtId || '',
    item.reconcileDiff !== undefined ? item.reconcileDiff : '',
    new Date().toISOString(),
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Expenses!A:L',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  })

  clearSheetCache()
  return item
}

export async function updateExpense(id: string, updated: Partial<ExpenseItem>): Promise<ExpenseItem | null> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  // Find row index (1-indexed)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Expenses!A:L',
  })

  const rows = res.data.values || []
  const rowIndex = rows.findIndex((r) => r[0] === id)
  if (rowIndex === -1) return null

  const existingRow = rows[rowIndex]
  const existingItem: ExpenseItem = {
    id: String(existingRow[0]),
    date: String(existingRow[1]),
    type: (existingRow[2] as any) || 'expense',
    category: String(existingRow[3]),
    amount: Number(existingRow[4]),
    source: (existingRow[5] as any) || 'account',
    transferDirection: existingRow[6] ? (existingRow[6] as any) : undefined,
    note: String(existingRow[7] || ''),
    timeAgo: '',
    image: existingRow[8] ? String(existingRow[8]) : undefined,
    debtId: existingRow[9] ? String(existingRow[9]) : undefined,
    reconcileDiff: existingRow[10] ? Number(existingRow[10]) : undefined,
  }

  const merged: ExpenseItem = {
    ...existingItem,
    ...updated,
    id, // preserve id
  }

  const newRow = [
    merged.id,
    merged.date,
    merged.type || 'expense',
    merged.category,
    merged.amount,
    merged.source || 'account',
    merged.transferDirection || '',
    merged.note || '',
    merged.image && merged.image.length > 2000 ? '' : (merged.image || ''),
    merged.debtId || '',
    merged.reconcileDiff !== undefined ? merged.reconcileDiff : '',
    new Date().toISOString(),
  ]

  const targetRange = `Expenses!A${rowIndex + 1}:L${rowIndex + 1}`
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: targetRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [newRow],
    },
  })

  clearSheetCache()
  return merged
}

export async function deleteExpense(id: string): Promise<boolean> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()
  const sheetMap = await getSheetMap()
  const sheetId = sheetMap['Expenses']
  if (sheetId === undefined) return false

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Expenses!A:A',
  })

  const rows = res.data.values || []
  const rowIndex = rows.findIndex((r) => r[0] === id)
  if (rowIndex === -1) return false

  // Delete row using deleteDimension
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex, // 0-indexed inclusive
              endIndex: rowIndex + 1, // 0-indexed exclusive
            },
          },
        },
      ],
    },
  })

  clearSheetCache()
  return true
}

// ---------------------------------------------------------------------------
// DEBTS CRUD
// ---------------------------------------------------------------------------

export async function getDebts(): Promise<DebtItem[]> {
  const cacheKey = 'debts'
  const cached = getFromCache<DebtItem[]>(cacheKey)
  if (cached) return cached

  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Debts!A2:H',
  })

  const rows = res.data.values || []
  const items: DebtItem[] = rows
    .filter((r) => Boolean(r[0]))
    .map((r) => ({
      id: String(r[0] || ''),
      title: String(r[1] || ''),
      amount: Number(r[2] || 0),
      date: String(r[3] || ''),
      creditor: r[4] ? String(r[4]) : undefined,
      note: r[5] ? String(r[5]) : undefined,
    }))

  setCache(cacheKey, items)
  return items
}

export async function addDebt(item: DebtItem): Promise<DebtItem> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const row = [
    item.id,
    item.title,
    item.amount,
    item.date,
    item.creditor || '',
    item.note || '',
    'active',
    new Date().toISOString(),
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Debts!A:H',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  })

  clearSheetCache()
  return item
}

export async function updateDebt(id: string, updated: Partial<DebtItem>): Promise<DebtItem | null> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Debts!A:H',
  })

  const rows = res.data.values || []
  const rowIndex = rows.findIndex((r) => r[0] === id)
  if (rowIndex === -1) return null

  const existingRow = rows[rowIndex]
  const existingItem: DebtItem = {
    id: String(existingRow[0]),
    title: String(existingRow[1]),
    amount: Number(existingRow[2]),
    date: String(existingRow[3]),
    creditor: existingRow[4] ? String(existingRow[4]) : undefined,
    note: existingRow[5] ? String(existingRow[5]) : undefined,
  }

  const merged: DebtItem = {
    ...existingItem,
    ...updated,
    id,
  }

  const newRow = [
    merged.id,
    merged.title,
    merged.amount,
    merged.date,
    merged.creditor || '',
    merged.note || '',
    merged.amount <= 0 ? 'paid' : 'active',
    new Date().toISOString(),
  ]

  const targetRange = `Debts!A${rowIndex + 1}:H${rowIndex + 1}`
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: targetRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [newRow],
    },
  })

  clearSheetCache()
  return merged
}

export async function deleteDebt(id: string): Promise<boolean> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()
  const sheetMap = await getSheetMap()
  const sheetId = sheetMap['Debts']
  if (sheetId === undefined) return false

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Debts!A:A',
  })

  const rows = res.data.values || []
  const rowIndex = rows.findIndex((r) => r[0] === id)
  if (rowIndex === -1) return false

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  })

  clearSheetCache()
  return true
}

// ---------------------------------------------------------------------------
// MOMENTS CRUD
// ---------------------------------------------------------------------------

export async function getMoments(): Promise<MomentItem[]> {
  const cacheKey = 'moments'
  const cached = getFromCache<MomentItem[]>(cacheKey)
  if (cached) return cached

  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Moments!A2:I',
  })

  const rows = res.data.values || []
  const items: MomentItem[] = rows
    .filter((r) => Boolean(r[0]))
    .map((r) => ({
      id: String(r[0] || ''),
      date: String(r[1] || ''),
      time: String(r[2] || ''),
      caption: String(r[3] || ''),
      mood: (r[4] as any) || 'serene',
      image: r[5] ? String(r[5]) : undefined,
      driveName: r[7] ? String(r[7]) : undefined,
    }))

  setCache(cacheKey, items)
  return items
}

export async function addMoment(item: MomentItem & { driveFileId?: string }): Promise<MomentItem> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const row = [
    item.id,
    item.date,
    item.time,
    item.caption,
    item.mood,
    item.image && item.image.length > 2000 ? '' : (item.image || ''),
    item.driveFileId || '',
    item.driveName || (item.image ? 'Google Drive' : ''),
    new Date().toISOString(),
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Moments!A:I',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  })

  clearSheetCache()
  return item
}

export async function deleteMoment(id: string): Promise<boolean> {
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()
  const sheetMap = await getSheetMap()
  const sheetId = sheetMap['Moments']
  if (sheetId === undefined) return false

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Moments!A:A',
  })

  const rows = res.data.values || []
  const rowIndex = rows.findIndex((r) => r[0] === id)
  if (rowIndex === -1) return false

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  })

  clearSheetCache()
  return true
}

// ---------------------------------------------------------------------------
// INITIAL BALANCES & BUDGET GOALS
// ---------------------------------------------------------------------------

export interface InitialBalancesData {
  initialBalances: InitialBalances
  monthlyBudget: number
  savingsGoal: number
  updatedAt: string
}

export async function getBalancesData(): Promise<InitialBalancesData> {
  const cacheKey = 'balances'
  const cached = getFromCache<InitialBalancesData>(cacheKey)
  if (cached) return cached

  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'InitialBalances!A2:F2',
  })

  const row = res.data.values?.[0] || []
  const parseNum = (v: any): number => {
    if (v === undefined || v === null || v === '') return 0
    const n = Number(String(v).replace(/,/g, '').trim())
    return isNaN(n) ? 0 : n
  }

  const data: InitialBalancesData = {
    initialBalances: {
      cash: parseNum(row[0]),
      bankAccount: parseNum(row[1]),
      savings: parseNum(row[2]),
    },
    monthlyBudget: parseNum(row[3]),
    savingsGoal: parseNum(row[4]),
    updatedAt: String(row[5] || new Date().toISOString()),
  }

  setCache(cacheKey, data)
  return data
}

export async function updateBalancesData(data: Partial<InitialBalancesData>): Promise<InitialBalancesData> {
  const current = await getBalancesData()
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  const merged: InitialBalancesData = {
    initialBalances: {
      ...current.initialBalances,
      ...(data.initialBalances || {}),
    },
    monthlyBudget: data.monthlyBudget !== undefined ? data.monthlyBudget : current.monthlyBudget,
    savingsGoal: data.savingsGoal !== undefined ? data.savingsGoal : current.savingsGoal,
    updatedAt: new Date().toISOString(),
  }

  const row = [
    merged.initialBalances.cash,
    merged.initialBalances.bankAccount,
    merged.initialBalances.savings,
    merged.monthlyBudget,
    merged.savingsGoal,
    merged.updatedAt,
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'InitialBalances!A2:F2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  })

  clearSheetCache()
  return merged
}

export interface StoredOAuthToken {
  service: string
  refreshToken: string
  accessToken?: string
  expiryDate?: number
  updatedAt: string
}

export async function getOAuthTokenFromSheet(service: string = 'google_drive'): Promise<StoredOAuthToken | null> {
  const cacheKey = `auth_token_${service}`
  const cached = getFromCache<StoredOAuthToken>(cacheKey)
  if (cached) return cached

  try {
    const sheets = getGoogleSheets()
    const spreadsheetId = getSpreadsheetId()

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'AuthTokens!A2:E',
    })

    const rows = res.data.values || []
    for (const row of rows) {
      if (row[0] === service && row[1]) {
        const tokenData: StoredOAuthToken = {
          service: String(row[0]),
          refreshToken: String(row[1]),
          accessToken: row[2] ? String(row[2]) : undefined,
          expiryDate: row[3] ? Number(row[3]) : undefined,
          updatedAt: String(row[4] || new Date().toISOString()),
        }
        setCache(cacheKey, tokenData)
        return tokenData
      }
    }
    return null
  } catch (err) {
    console.warn(`Could not read OAuth token for ${service} from AuthTokens sheet:`, err)
    return null
  }
}

export async function saveOAuthTokenToSheet(data: {
  service?: string
  refreshToken: string
  accessToken?: string
  expiryDate?: number
}): Promise<StoredOAuthToken> {
  const service = data.service || 'google_drive'
  const sheets = getGoogleSheets()
  const spreadsheetId = getSpreadsheetId()

  // Make sure sheet exists
  await initSpreadsheet()

  // Check if row already exists
  let rowIndex = -1
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'AuthTokens!A2:E',
    })
    const rows = res.data.values || []
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === service) {
        rowIndex = i + 2 // 1-based, skipping header row 1
        break
      }
    }
  } catch {
    rowIndex = -1
  }

  const now = new Date().toISOString()
  const tokenRecord: StoredOAuthToken = {
    service,
    refreshToken: data.refreshToken,
    accessToken: data.accessToken,
    expiryDate: data.expiryDate,
    updatedAt: now,
  }

  const rowValues = [
    service,
    data.refreshToken,
    data.accessToken || '',
    data.expiryDate ? String(data.expiryDate) : '',
    now,
  ]

  if (rowIndex > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `AuthTokens!A${rowIndex}:E${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowValues] },
    })
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'AuthTokens!A2:E2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowValues] },
    })
  }

  clearSheetCache()
  setCache(`auth_token_${service}`, tokenRecord)
  return tokenRecord
}

