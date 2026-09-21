import { ExpenseItem, DebtItem, MomentItem, InitialBalances } from '@/lib/types'

export interface HealthResponse {
  status: 'ok' | 'not_configured' | 'degraded' | 'error'
  message?: string
  config?: {
    isConfigured: boolean
    hasSpreadsheetId: boolean
    hasDriveFolderId: boolean
    hasCredentials: boolean
    error?: string
  }
  sheets?: {
    connected: boolean
    tabs: string[]
    error?: string
  }
  drive?: {
    connected: boolean
    folderName?: string
    error?: string
  }
}

export interface BalancesResponse {
  initialBalances: InitialBalances
  monthlyBudget: number
  savingsGoal: number
  updatedAt?: string
  source?: string
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' })
    return await res.json()
  } catch (err: any) {
    return {
      status: 'error',
      message: err?.message || 'Không thể kết nối tới server API',
    }
  }
}

export async function initSpreadsheetApi(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const res = await fetch('/api/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    return await res.json()
  } catch (err: any) {
    return {
      success: false,
      message: 'Không thể gửi yêu cầu khởi tạo',
      error: err?.message,
    }
  }
}

export async function fetchBalances(refresh?: boolean): Promise<BalancesResponse | null> {
  try {
    const url = refresh ? '/api/balances?refresh=true' : '/api/balances'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function saveBalances(data: Partial<BalancesResponse>): Promise<boolean> {
  try {
    const res = await fetch('/api/balances', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchExpenses(refresh?: boolean): Promise<{ data: ExpenseItem[]; source: string } | null> {
  try {
    const url = refresh ? '/api/expenses?refresh=true' : '/api/expenses'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function apiCreateExpense(item: ExpenseItem): Promise<ExpenseItem | null> {
  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data || item
  } catch {
    return null
  }
}

export async function apiUpdateExpense(id: string, updated: Partial<ExpenseItem>): Promise<boolean> {
  try {
    const res = await fetch(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function apiDeleteExpense(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/expenses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchDebts(refresh?: boolean): Promise<{ data: DebtItem[]; source: string } | null> {
  try {
    const url = refresh ? '/api/debts?refresh=true' : '/api/debts'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function apiCreateDebt(item: DebtItem): Promise<DebtItem | null> {
  try {
    const res = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data || item
  } catch {
    return null
  }
}

export async function apiUpdateDebt(id: string, updated: Partial<DebtItem>): Promise<boolean> {
  try {
    const res = await fetch(`/api/debts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function apiDeleteDebt(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/debts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchMoments(refresh?: boolean): Promise<{ data: MomentItem[]; source: string } | null> {
  try {
    const url = refresh ? '/api/moments?refresh=true' : '/api/moments'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function apiCreateMoment(item: MomentItem & { driveFileId?: string }): Promise<MomentItem | null> {
  try {
    const res = await fetch('/api/moments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data || item
  } catch {
    return null
  }
}

export async function apiDeleteMoment(id: string, driveFileId?: string): Promise<boolean> {
  try {
    const query = driveFileId ? `?driveFileId=${encodeURIComponent(driveFileId)}` : ''
    const res = await fetch(`/api/moments/${encodeURIComponent(id)}${query}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch {
    return false
  }
}

export async function apiUploadImage(
  file: File,
  customFilename?: string
): Promise<{ fileId: string; url: string; name: string } | null> {
  try {
    const formData = new FormData()
    const finalFilename = customFilename || file.name
    formData.append('file', file, finalFilename)
    formData.append('filename', finalFilename)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
