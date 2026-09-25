import { ExpenseItem, DebtItem, MomentItem, InitialBalances, UserProfile, CurrencyType } from '@/lib/types'

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

export async function apiLogin(
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { success: false, error: data.error || 'Đăng nhập thất bại' }
    }
    return { success: true, user: data.user }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Không thể kết nối tới máy chủ' }
  }
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

export async function fetchBalances(refresh?: boolean, user?: string): Promise<BalancesResponse | null> {
  try {
    const params = new URLSearchParams()
    if (refresh) params.set('refresh', 'true')
    if (user) params.set('user', user)
    const url = `/api/balances${params.toString() ? `?${params.toString()}` : ''}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function saveBalances(data: Partial<BalancesResponse>, user?: string): Promise<boolean> {
  try {
    const params = user ? `?user=${encodeURIComponent(user)}` : ''
    const res = await fetch(`/api/balances${params}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, user }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchExpenses(refresh?: boolean, user?: string): Promise<{ data: ExpenseItem[]; source: string } | null> {
  try {
    const params = new URLSearchParams()
    if (refresh) params.set('refresh', 'true')
    if (user) params.set('user', user)
    const url = `/api/expenses${params.toString() ? `?${params.toString()}` : ''}`
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

export async function fetchDebts(refresh?: boolean, user?: string): Promise<{ data: DebtItem[]; source: string } | null> {
  try {
    const params = new URLSearchParams()
    if (refresh) params.set('refresh', 'true')
    if (user) params.set('user', user)
    const url = `/api/debts${params.toString() ? `?${params.toString()}` : ''}`
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
  username?: string,
  customFilename?: string,
  uploadType: 'image' | 'avatar' = 'image'
): Promise<{ fileId: string; url: string; name: string } | null> {
  try {
    const user = username || 'jeandev'
    const formData = new FormData()
    const prefix = uploadType === 'avatar' ? `${user}_avatar_` : `${user}_image_`
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const finalFilename = customFilename || `${prefix}${Date.now()}_${sanitized}`
    formData.append('file', file, finalFilename)
    formData.append('filename', finalFilename)
    formData.append('username', user)
    formData.append('type', uploadType)

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

export async function apiUpdateUserAvatar(
  username: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, avatarUrl }),
    })
    const data = await res.json()
    return { success: res.ok && data.success, error: data.error }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi mạng khi cập nhật avatar' }
  }
}

export async function apiUpdateUserCurrency(
  username: string,
  currency: CurrencyType
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/users/currency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, currency }),
    })
    const data = await res.json()
    return { success: res.ok && data.success, error: data.error }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi mạng khi cập nhật đơn vị tiền tệ' }
  }
}
