'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  ThemeType,
  LanguageType,
  TabType,
  FinancialState,
  ExpenseItem,
  MomentItem,
  TransferDirection,
  DebtItem,
  InitialBalances,
  UserProfile,
  CurrencyType,
} from '@/lib/types'
import { dictionary, setActiveCurrency, themeMetadata } from '@/lib/i18n'
import { applyTheme } from '@/lib/theme'
import {
  getClientLocalDateString,
  getClientYesterdayDateString,
  normalizeDateString,
  normalizeMomentToClient,
  compareExpensesDescending,
  compareMomentsDescending,
} from '@/lib/time'
import { computeLedgerBalances, computeMonthlySpent, computeDaySpent } from '@/lib/accounting'
import { AppHeader } from '@/components/AppHeader'
import { MetricCards } from '@/components/MetricCards'
import { BudgetAlert } from '@/components/BudgetAlert'
import { ExpenseList } from '@/components/ExpenseList'
import { NetWorthModal } from '@/components/NetWorthModal'
import { SavingsModal } from '@/components/SavingsModal'
import { QuickExpenseModal } from '@/components/QuickExpenseModal'
import { BudgetModal } from '@/components/BudgetModal'
import { DebtModal } from '@/components/DebtModal'
import { CircadianRibbon } from '@/components/CircadianRibbon'
import { MomentComposer } from '@/components/MomentComposer'
import { MomentsTimeline } from '@/components/MomentsTimeline'
import { StoryZenModal } from '@/components/StoryZenModal'
import { LightboxModal } from '@/components/LightboxModal'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { ToastNotification } from '@/components/ToastNotification'
import { GoogleDriveAuthIndicator } from '@/components/GoogleDriveAuthBanner'
import { LoginModal } from '@/components/LoginModal'
import { UserManagerTab } from '@/components/UserManagerTab'
import { CurrencySetupModal } from '@/components/CurrencySetupModal'
import {
  fetchBalances,
  saveBalances,
  fetchExpenses,
  apiCreateExpense,
  apiUpdateExpense,
  apiDeleteExpense,
  fetchDebts,
  apiCreateDebt,
  apiUpdateDebt,
  apiDeleteDebt,
  fetchMoments,
  apiCreateMoment,
  apiDeleteMoment,
  apiUploadImage,
  apiUpdateUserCurrency,
} from '@/lib/api-client'
import { Plus } from 'lucide-react'

export default function Home() {
  const [theme, setTheme] = useState<ThemeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_theme')
      const validThemes: ThemeType[] = ['classic', 'cozy', 'fantasy', 'retro', 'ronin']
      if (saved && validThemes.includes(saved as ThemeType)) {
        return saved as ThemeType
      }
    }
    return 'classic'
  })
  const [lang, setLang] = useState<LanguageType>('vi')
  const [tab, setTab] = useState<TabType>('moments')

  // Financial State (budgets and goals; balances are derived from ledger)
  const [finances, setFinances] = useState<FinancialState>({
    cash: 0,
    bankAccount: 0,
    currentSavings: 0,
    totalDebt: 0,
    savingsGoal: 0,
    monthlyBudget: 0,
    totalMonthlySpent: 0,
    todaySpent: 0,
    yesterdaySpent: 0,
  })

  // Opening-balance seed (immutable by transactions, modified only via explicit audit setup)
  const [initialBalances, setInitialBalances] = useState<InitialBalances>({
    cash: 0,
    bankAccount: 0,
    savings: 0,
  })

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [authChecked, setAuthChecked] = useState<boolean>(false)

  // Direct API / Google Sheets Live State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [moments, setMoments] = useState<MomentItem[]>([])
  const [debts, setDebts] = useState<DebtItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Modals & Overlays State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false)
  const [quickExpenseModal, setQuickExpenseModal] = useState<{
    isOpen: boolean
    targetCard: 'cash' | 'account' | 'debt' | 'month' | 'general'
  }>({
    isOpen: false,
    targetCard: 'general',
  })
  const [isZenStoryOpen, setIsZenStoryOpen] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const [isListModalOpen, setIsListModalOpen] = useState(false)

  // Overall check if any modal is currently open
  const isAnyModalOpen =
    isBalanceModalOpen ||
    isSavingsModalOpen ||
    isBudgetModalOpen ||
    isDebtModalOpen ||
    quickExpenseModal.isOpen ||
    isZenStoryOpen ||
    Boolean(lightboxImg) ||
    !currentUser ||
    isListModalOpen

  // Toast Notification State (with interactive action support)
  const [toastConfig, setToastConfig] = useState<{
    message: string | null
    actionLabel?: string | null
    onAction?: () => void
  }>({ message: null })
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleOpenExpenseModal = (target: 'cash' | 'account' | 'debt' | 'month' | 'general' = 'general') => {
    setQuickExpenseModal({
      isOpen: true,
      targetCard: target,
    })
  }

  // Synchronize client local theme & auth session
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme')
    const validThemes: ThemeType[] = ['classic', 'cozy', 'fantasy', 'retro', 'ronin']
    const activeTheme: ThemeType = validThemes.includes(savedTheme as any) ? (savedTheme as ThemeType) : 'classic'
    setTheme(activeTheme)
    applyTheme(activeTheme)

    const storedUser = localStorage.getItem('dayflow_user')
    if (storedUser) {
      try {
        const parsed: UserProfile = JSON.parse(storedUser)
        if (parsed.username.toLowerCase() === 'jeandev' && !parsed.currency) {
          parsed.currency = 'VND'
        }
        setCurrentUser(parsed)
        setActiveCurrency(parsed.currency || (parsed.username.toLowerCase() === 'jeandev' ? 'VND' : 'KRW'))
        loadInitialData(false, parsed.username)
      } catch {
        loadInitialData(false, '')
      }
    } else {
      loadInitialData(false, '')
    }
    setAuthChecked(true)
  }, [])

  const loadInitialData = async (forceRefresh = false, userParam?: string) => {
    setIsLoading(true)
    const targetUser = userParam !== undefined ? userParam : currentUser?.username
    try {
      const [balRes, expRes, debtRes, momRes] = await Promise.all([
        targetUser ? fetchBalances(forceRefresh, targetUser) : Promise.resolve(null),
        targetUser ? fetchExpenses(forceRefresh, targetUser) : Promise.resolve({ data: [] }),
        targetUser ? fetchDebts(forceRefresh, targetUser) : Promise.resolve({ data: [] }),
        fetchMoments(forceRefresh),
      ])

      if (balRes) {
        if (balRes.initialBalances) {
          setInitialBalances(balRes.initialBalances)
        } else {
          setInitialBalances({ cash: 0, bankAccount: 0, savings: 0 })
        }
        setFinances((prev) => ({
          ...prev,
          monthlyBudget: balRes.monthlyBudget ?? 0,
          savingsGoal: balRes.savingsGoal ?? 0,
        }))
      } else if (!targetUser) {
        setInitialBalances({ cash: 0, bankAccount: 0, savings: 0 })
      }

      if (expRes && Array.isArray(expRes.data)) {
        setExpenses(expRes.data.sort(compareExpensesDescending))
      } else {
        setExpenses([])
      }

      if (debtRes && Array.isArray(debtRes.data)) {
        setDebts(debtRes.data)
      } else {
        setDebts([])
      }

      if (momRes && Array.isArray(momRes.data)) {
        const clientMoments = momRes.data.map((m) => normalizeMomentToClient(m))
        setMoments(clientMoments.sort(compareMomentsDescending))
      }
    } catch (err) {
      console.warn('Google Sheets sync notice:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = (user: UserProfile) => {
    if (user.username.toLowerCase() === 'jeandev' && !user.currency) {
      user.currency = 'VND'
    }
    setCurrentUser(user)
    setActiveCurrency(user.currency || (user.username.toLowerCase() === 'jeandev' ? 'VND' : 'KRW'))
    localStorage.setItem('dayflow_user', JSON.stringify(user))
    loadInitialData(true, user.username)
    showToast(
      lang === 'vi'
        ? `Chào mừng ${user.displayName || user.username}!`
        : `Welcome ${user.displayName || user.username}!`
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('dayflow_user')
    setCurrentUser(null)
    setActiveCurrency('VND')
    setExpenses([])
    setDebts([])
    setFinances({
      cash: 0,
      bankAccount: 0,
      currentSavings: 0,
      totalDebt: 0,
      savingsGoal: 0,
      monthlyBudget: 0,
      totalMonthlySpent: 0,
      todaySpent: 0,
      yesterdaySpent: 0,
    })
    setInitialBalances({
      cash: 0,
      bankAccount: 0,
      savings: 0,
    })
    setTab('moments')
    showToast(lang === 'vi' ? 'Đã đăng xuất thành công' : 'Logged out successfully')
  }

  const handleConfirmCurrency = async (selectedCurrency: CurrencyType) => {
    if (!currentUser) return
    const res = await apiUpdateUserCurrency(currentUser.username, selectedCurrency)
    if (!res.success) {
      throw new Error(res.error || (lang === 'vi' ? 'Không thể thiết lập đơn vị tiền tệ' : 'Failed to set currency'))
    }
    const updatedUser: UserProfile = {
      ...currentUser,
      currency: selectedCurrency,
    }
    setCurrentUser(updatedUser)
    setActiveCurrency(selectedCurrency)
    localStorage.setItem('dayflow_user', JSON.stringify(updatedUser))
    showToast(
      lang === 'vi'
        ? `Đã thiết lập đơn vị tiền tệ: ${selectedCurrency}`
        : `Currency set to: ${selectedCurrency}`
    )
  }

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return
    const updatedUser: UserProfile = {
      ...currentUser,
      avatar: newAvatarUrl,
    }
    setCurrentUser(updatedUser)
    localStorage.setItem('dayflow_user', JSON.stringify(updatedUser))
    showToast(lang === 'vi' ? 'Cập nhật ảnh đại diện thành công' : 'Avatar updated successfully')
  }

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab)
  }

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('app_theme', newTheme)
    const themeName = lang === 'vi' ? themeMetadata[newTheme]?.viName || newTheme : themeMetadata[newTheme]?.name || newTheme
    showToast(lang === 'vi' ? `Đã chuyển sang giao diện ${themeName}` : `Switched to ${themeName} theme`)
  }

  const showToast = (
    msg: string,
    actionLabel?: string | null,
    onAction?: () => void,
    duration = 2500
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToastConfig({ message: msg, actionLabel, onAction })
    toastTimerRef.current = setTimeout(() => {
      setToastConfig({ message: null })
      toastTimerRef.current = null
    }, duration)
  }

  // Financial Handlers
  const handleAddExpense = async (
    newExp: Omit<ExpenseItem, 'id' | 'timeAgo'>,
    rawReceiptFile?: File
  ) => {
    const user = currentUser?.username || 'jeandev'
    let uploadedImage = newExp.image

    if (rawReceiptFile) {
      showToast(lang === 'vi' ? 'Đang tải hóa đơn lên Google Drive...' : 'Uploading receipt to Google Drive...')
      const ext = rawReceiptFile.name.includes('.') ? rawReceiptFile.name.split('.').pop()!.toLowerCase() : 'jpg'
      const receiptFilename = `${user}_image_${Date.now()}_receipt.${ext}`
      const uploadRes = await apiUploadImage(rawReceiptFile, user, receiptFilename)
      if (uploadRes?.url) {
        uploadedImage = uploadRes.url
      }
    }

    const item: ExpenseItem = {
      ...newExp,
      user,
      image: uploadedImage,
      id: `exp-${Date.now()}`,
      timeAgo: lang === 'vi' ? 'Vừa xong' : 'Just now',
    }

    setExpenses((prev) => [item, ...prev].sort(compareExpensesDescending))
    apiCreateExpense(item)

    if (item.type === 'income') {
      showToast(dictionary[lang].toast_income_added)
    } else {
      showToast(dictionary[lang].toast_expense_added)
    }
  }

  const handleDeleteExpense = (id: string, _amount: number) => {
    const deletedItem = expenses.find((exp) => exp.id === id)
    if (!deletedItem) return

    const previousDebts = [...debts]

    setExpenses((prev) => prev.filter((exp) => exp.id !== id))

    if (deletedItem.debtId) {
      setDebts((prevDebts) => {
        const exists = prevDebts.some((d) => d.id === deletedItem.debtId)
        if (exists) {
          return prevDebts.map((d) =>
            d.id === deletedItem.debtId ? { ...d, amount: d.amount + deletedItem.amount } : d
          )
        } else {
          return [
            ...prevDebts,
            {
              id: deletedItem.debtId!,
              title: deletedItem.note.replace(/^Trả nợ:\s*/i, '').replace(/^Repay:\s*/i, '') || 'Khoản nợ đã khôi phục',
              amount: deletedItem.amount,
              date: getClientLocalDateString(),
            },
          ]
        }
      })
    }

    // Show toast with 5-second Undo action
    let isUndone = false
    showToast(
      dictionary[lang].toast_expense_deleted,
      dictionary[lang].toast_undo_action,
      () => {
        isUndone = true
        setExpenses((prev) => [deletedItem, ...prev])
        if (deletedItem.debtId) {
          setDebts(previousDebts)
        }
        showToast(dictionary[lang].toast_undo_success)
      },
      5000
    )

    setTimeout(() => {
      if (!isUndone) {
        apiDeleteExpense(id)
      }
    }, 5500)
  }

  const handleUpdateExpense = (updatedItem: ExpenseItem, oldItem: ExpenseItem) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    )
    apiUpdateExpense(updatedItem.id, updatedItem)

    if (oldItem.debtId || updatedItem.debtId) {
      setDebts((prevDebts) => {
        let newDebts = [...prevDebts]

        if (oldItem.debtId) {
          const oldDebtExists = newDebts.some((d) => d.id === oldItem.debtId)
          if (oldDebtExists) {
            newDebts = newDebts.map((d) =>
              d.id === oldItem.debtId ? { ...d, amount: d.amount + oldItem.amount } : d
            )
          } else {
            newDebts.push({
              id: oldItem.debtId,
              title: oldItem.note.replace(/^Trả nợ:\s*/i, '').replace(/^Repay:\s*/i, '') || 'Khoản nợ đã khôi phục',
              amount: oldItem.amount,
              date: getClientLocalDateString(),
            })
          }
        }

        if (updatedItem.debtId) {
          newDebts = newDebts
            .map((d) => {
              if (d.id === updatedItem.debtId) {
                const remaining = d.amount - updatedItem.amount
                return remaining > 0 ? { ...d, amount: remaining } : null
              }
              return d
            })
            .filter(Boolean) as DebtItem[]
        }

        return newDebts
      })
    }

    showToast(dictionary[lang].toast_expense_updated)
  }

  const handleTransfer = (direction: TransferDirection, amount: number, note: string) => {
    if (amount <= 0) return

    const today = getClientLocalDateString()
    const defaultNote =
      direction === 'cash_to_bank'
        ? (lang === 'vi' ? 'Nạp tiền vào tài khoản' : 'Deposit to bank')
        : direction === 'bank_to_cash'
        ? (lang === 'vi' ? 'Rút tiền mặt' : 'Withdraw cash')
        : direction === 'savings_to_bank'
        ? (lang === 'vi' ? 'Rút tiết kiệm về tài khoản' : 'Withdraw from savings to bank')
        : (lang === 'vi' ? 'Gửi tiền vào quỹ tiết kiệm' : 'Deposit into savings vault')

    const user = currentUser?.username || 'jeandev'
    const transferItem: ExpenseItem = {
      id: `transfer-${Date.now()}`,
      type: 'transfer',
      category: 'transfer',
      amount,
      note: note || defaultNote,
      date: today,
      timeAgo: lang === 'vi' ? 'Vừa xong' : 'Just now',
      transferDirection: direction,
      user,
    }

    setExpenses((prev) => [transferItem, ...prev].sort(compareExpensesDescending))
    apiCreateExpense(transferItem)

    if (direction === 'savings_to_bank') {
      showToast(dictionary[lang].toast_savings_withdrawn)
    } else if (direction === 'bank_to_savings') {
      showToast(dictionary[lang].toast_savings_deposited)
    } else {
      showToast(dictionary[lang].toast_transfer_done)
    }
  }

  // Dynamic Total Debt (Payable) & Total Receivable
  const computedTotalDebt = useMemo(() => {
    return debts
      .filter((d) => !d.type || d.type === 'payable')
      .reduce((sum, d) => sum + d.amount, 0)
  }, [debts])

  const computedTotalReceivable = useMemo(() => {
    return debts
      .filter((d) => d.type === 'receivable')
      .reduce((sum, d) => sum + d.amount, 0)
  }, [debts])

  // Pure Accounting Ledger Replay (SSOT)
  const ledgerBalances = useMemo(() => {
    return computeLedgerBalances(expenses, initialBalances)
  }, [expenses, initialBalances])

  // Dynamic Time-Window Spending Engine
  const currentMonthSpent = useMemo(() => {
    return computeMonthlySpent(expenses)
  }, [expenses])

  const computedTodaySpent = useMemo(() => {
    return computeDaySpent(expenses, getClientLocalDateString())
  }, [expenses])

  const computedYesterdaySpent = useMemo(() => {
    return computeDaySpent(expenses, getClientYesterdayDateString())
  }, [expenses])

  // Consolidated Financial State
  const computedFinances: FinancialState = useMemo(() => ({
    cash: ledgerBalances.cash,
    bankAccount: ledgerBalances.bankAccount,
    currentSavings: ledgerBalances.savings,
    totalDebt: computedTotalDebt,
    totalReceivable: computedTotalReceivable,
    totalMonthlySpent: currentMonthSpent,
    todaySpent: computedTodaySpent,
    yesterdaySpent: computedYesterdaySpent,
    monthlyBudget: finances.monthlyBudget,
    savingsGoal: finances.savingsGoal,
  }), [ledgerBalances, computedTotalDebt, computedTotalReceivable, currentMonthSpent, computedTodaySpent, computedYesterdaySpent, finances.monthlyBudget, finances.savingsGoal])

  // Today's Moments (Strictly filtered for 24H Circadian Ribbon and Zen Story)
  const todayStr = getClientLocalDateString()
  const todayMoments = useMemo(() => {
    return moments.filter((m) => normalizeDateString(m.date) === todayStr)
  }, [moments, todayStr])

  // Audit Reconciliation Handler
  // Audit Reconciliation Handler
  const handleReconcileBalance = ({
    source,
    diff,
    reason,
  }: {
    source: 'cash' | 'account' | 'savings'
    actualAmount: number
    diff: number
    reason: string
  }) => {
    const today = getClientLocalDateString()
    const user = currentUser?.username || 'jeandev'
    const recItem: ExpenseItem = {
      id: `rec-${Date.now()}`,
      type: 'reconciliation',
      category: 'reconciliation',
      amount: Math.abs(diff),
      note: reason,
      date: today,
      timeAgo: lang === 'vi' ? 'Vừa xong' : 'Just now',
      source: source,
      reconcileDiff: diff,
      user,
    }

    setExpenses((prev) => [recItem, ...prev].sort(compareExpensesDescending))
    apiCreateExpense(recItem)
    showToast(dictionary[lang].toast_balance_reconciled)
  }

  const handleSaveSavingsGoal = (newGoal: number) => {
    const user = currentUser?.username || 'jeandev'
    setFinances((prev) => ({ ...prev, savingsGoal: newGoal }))
    saveBalances({ savingsGoal: newGoal }, user)
    showToast(dictionary[lang].toast_savings_goal_updated)
  }

  const handleUpdateInitialBalances = async (newInit: InitialBalances) => {
    const user = currentUser?.username || 'jeandev'
    setInitialBalances(newInit)
    const ok = await saveBalances({ initialBalances: newInit }, user)
    if (ok) {
      showToast(lang === 'vi' ? 'Đã lưu số dư ban đầu vào Google Sheets' : 'Saved opening balances to Google Sheets')
    } else {
      showToast(lang === 'vi' ? 'Không thể lưu vào Google Sheets' : 'Failed to save to Google Sheets')
    }
  }

  const handlePaySpecificDebt = ({
    debtId,
    debtTitle,
    amount,
    source,
    note,
  }: {
    debtId: string
    debtTitle: string
    amount: number
    source: 'cash' | 'account'
    note?: string
  }) => {
    const today = getClientLocalDateString()
    const user = currentUser?.username || 'jeandev'
    const payItem: ExpenseItem = {
      id: `debt-pay-${Date.now()}`,
      type: 'expense',
      category: 'debt',
      amount: amount,
      note: note || (lang === 'vi' ? `Trả nợ: ${debtTitle}` : `Repay: ${debtTitle}`),
      date: today,
      timeAgo: lang === 'vi' ? 'Vừa xong' : 'Just now',
      source: source,
      debtId: debtId,
      user,
    }

    setExpenses((prev) => [payItem, ...prev].sort(compareExpensesDescending))
    apiCreateExpense(payItem)

    setDebts((prevDebts) => {
      return prevDebts
        .map((d) => {
          if (d.id === debtId) {
            const rem = d.amount - amount
            if (rem > 0) {
              apiUpdateDebt(debtId, { amount: rem })
              return { ...d, amount: rem }
            } else {
              apiDeleteDebt(debtId)
              return null
            }
          }
          return d
        })
        .filter(Boolean) as DebtItem[]
    })

    showToast(dictionary[lang].toast_debt_paid)
  }

  const handleCollectSpecificDebt = ({
    debtId,
    debtTitle,
    amount,
    source,
    note,
  }: {
    debtId: string
    debtTitle: string
    amount: number
    source: 'cash' | 'account'
    note?: string
  }) => {
    const today = getClientLocalDateString()
    const user = currentUser?.username || 'jeandev'
    const collectItem: ExpenseItem = {
      id: `debt-collect-${Date.now()}`,
      type: 'income',
      category: 'debt_collection',
      amount: amount,
      note: note || (lang === 'vi' ? `Thu nợ: ${debtTitle}` : `Collect: ${debtTitle}`),
      date: today,
      timeAgo: lang === 'vi' ? 'Vừa xong' : 'Just now',
      source: source,
      debtId: debtId,
      user,
    }

    setExpenses((prev) => [collectItem, ...prev].sort(compareExpensesDescending))
    apiCreateExpense(collectItem)

    setDebts((prevDebts) => {
      return prevDebts
        .map((d) => {
          if (d.id === debtId) {
            const rem = d.amount - amount
            if (rem > 0) {
              apiUpdateDebt(debtId, { amount: rem })
              return { ...d, amount: rem }
            } else {
              apiDeleteDebt(debtId)
              return null
            }
          }
          return d
        })
        .filter(Boolean) as DebtItem[]
    })

    showToast(dictionary[lang].toast_debt_collected)
  }

  // Moments Handlers
  const handleAddMoment = async (newMom: Omit<MomentItem, 'id'>, rawFile?: File) => {
    const user = currentUser?.username || 'jeandev'
    let uploadedImage = newMom.image
    let driveFileId: string | undefined

    if (rawFile) {
      showToast(lang === 'vi' ? 'Đang tải ảnh lên Google Drive...' : 'Uploading photo to Google Drive...')
      const uploadRes = await apiUploadImage(rawFile, user)
      if (uploadRes?.url) {
        uploadedImage = uploadRes.url
        driveFileId = uploadRes.fileId
      }
    }

    const item: MomentItem = {
      ...newMom,
      user,
      image: uploadedImage,
      id: `mom-${Date.now()}`,
    }

    const normalizedItem = normalizeMomentToClient(item)
    setMoments((prev) => [normalizedItem, ...prev].sort(compareMomentsDescending))
    apiCreateMoment({ ...item, driveFileId })
    showToast(dictionary[lang].toast_moment_added)
  }

  const handleDeleteMoment = async (id: string) => {
    const target = moments.find((m) => m.id === id)
    setMoments((prev) => prev.filter((m) => m.id !== id))
    apiDeleteMoment(id)
    showToast(lang === 'vi' ? 'Đã xóa tin' : 'Moment deleted')
  }

  const handleSelectMoment = (id: string) => {
    const el = document.getElementById(`moment-card-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlight-flash')
      setTimeout(() => el.classList.remove('highlight-flash'), 1600)
    }
  }

  // Debt Handlers
  const handleAddDebt = (newDebt: Omit<DebtItem, 'id'>) => {
    const user = currentUser?.username || 'jeandev'
    const item: DebtItem = {
      ...newDebt,
      user,
      id: `debt-${Date.now()}`,
    }
    setDebts((prev) => [item, ...prev])
    apiCreateDebt(item)
    showToast(dictionary[lang].toast_debt_added)
  }

  const handleDeleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id))
    apiDeleteDebt(id)
    showToast(dictionary[lang].toast_debt_deleted)
  }

  // Budget Handler
  const handleSaveBudget = (newBudget: number) => {
    const user = currentUser?.username || 'jeandev'
    setFinances((prev) => ({ ...prev, monthlyBudget: newBudget }))
    saveBalances({ monthlyBudget: newBudget }, user)
    showToast(dictionary[lang].toast_budget_updated)
  }

  const t = dictionary[lang]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-16 sm:pb-0">
      <AppHeader
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        currentLang={lang}
        onLangChange={setLang}
        currentTab={tab}
        onTabChange={handleTabChange}
        onRefresh={() => loadInitialData(true)}
        isRefreshing={isLoading}
        currentUser={currentUser}
        driveAuthIndicator={
          <GoogleDriveAuthIndicator
            lang={lang}
            onReauthSuccess={() => loadInitialData(true)}
          />
        }
      />

      {/* Screen A: Financial Dashboard */}
      {tab === 'expenses' && (
        <main className="max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-8 pb-36 sm:pb-12 space-y-5 sm:space-y-6 flex-1 animate-in fade-in duration-200 relative">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-theme/60">
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-theme-main flex items-center gap-2">
                <span>{t.tab_expenses}</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-theme-muted truncate">
                {lang === 'vi' ? 'Quản lý tài sản, ngân sách & lịch sử thu chi' : 'Manage assets, budgets & transaction records'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6 animate-pulse pt-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-theme-surface/60 rounded-xl border border-theme" />
                ))}
              </div>
              <div className="h-20 bg-theme-surface/40 rounded-xl border border-theme" />
              <div className="space-y-3">
                <div className="h-10 bg-theme-surface/50 rounded-lg" />
                <div className="h-36 bg-theme-surface/40 rounded-xl border border-theme" />
              </div>
            </div>
          ) : (
            <>
              <MetricCards
                finances={computedFinances}
                expenses={expenses}
                lang={lang}
                onOpenBalanceModal={() => setIsBalanceModalOpen(true)}
                onOpenSavingsModal={() => setIsSavingsModalOpen(true)}
                onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
                onOpenDebtModal={() => setIsDebtModalOpen(true)}
                theme={theme}
              />

              <BudgetAlert lang={lang} finances={computedFinances} expenses={expenses} />

              <div className="w-full">
                <ExpenseList
                  expenses={expenses}
                  initialBalances={initialBalances}
                  lang={lang}
                  onDeleteExpense={handleDeleteExpense}
                  onOpenLightbox={(src) => setLightboxImg(src)}
                  onUpdateExpense={handleUpdateExpense}
                  finances={computedFinances}
                  debts={debts}
                  onModalChange={setIsListModalOpen}
                />
                <div className="h-6 sm:h-2" aria-hidden="true" />
              </div>

              {!isAnyModalOpen && (
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal('general')}
                  className={`fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.25rem)] sm:bottom-8 right-4 sm:right-8 z-40 bubble-fab-mobile btn-theme-gradient w-14 h-14 sm:w-auto sm:h-auto p-0 sm:px-5 sm:py-3 rounded-full flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    theme === 'retro'
                      ? '!rounded-none !bg-[#C0C0C0] !text-black !border-none !shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#fff,inset_-2px_-2px_#808080,inset_2px_2px_#dfdfdf]'
                      : theme === 'ronin'
                      ? '!rounded-none !bg-gradient-to-br !from-[#E52535] !to-[#7F0910] hover:!from-[#FF1E38] hover:!to-[#9E0B15] !text-white !border !border-[#FF3B4E] shadow-[0_0_24px_rgba(229,37,53,0.7)] katana-cut'
                      : theme === 'fantasy'
                      ? 'text-[#1E2533] border-2 border-[#FFF2D1] shadow-[0_0_20px_rgba(229,201,146,0.5)]'
                      : theme === 'cozy'
                      ? 'text-white border-2 border-white shadow-xl'
                      : 'text-white shadow-2xl hover:shadow-3xl border border-white/25 active:scale-95'
                  }`}
                  title={t.btn_note_expense}
                  aria-label={t.btn_note_expense}
                >
                  {theme === 'retro' ? (
                    <span className="text-base sm:text-sm font-black font-mono">💾</span>
                  ) : theme === 'fantasy' ? (
                    <span className="text-xl sm:text-lg font-black leading-none">✦</span>
                  ) : (
                    <Plus className="w-7 h-7 sm:w-5 sm:h-5 stroke-[2.5]" />
                  )}
                  <span className="hidden sm:inline">{t.btn_note_expense}</span>
                </button>
              )}
            </>
          )}
        </main>
      )}

      {/* Screen B: Moments Timeline */}
      {tab === 'moments' && (
        <main className="max-w-3xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-8 pb-28 sm:pb-8 space-y-5 sm:space-y-6 flex-1 animate-in fade-in duration-200">
          <CircadianRibbon
            moments={todayMoments}
            lang={lang}
            onOpenZenStory={() => setIsZenStoryOpen(true)}
            onSelectMoment={handleSelectMoment}
            theme={theme}
          />

          <MomentComposer
            lang={lang}
            onAddMoment={handleAddMoment}
            existingMoments={moments}
          />
          {isLoading ? (
            <div className="space-y-4 animate-pulse pt-2">
              <div className="h-6 w-36 bg-theme-surface/60 rounded" />
              <div className="h-28 bg-theme-surface/40 rounded-xl border border-theme" />
              <div className="h-28 bg-theme-surface/40 rounded-xl border border-theme" />
            </div>
          ) : (
            <MomentsTimeline
              moments={moments}
              lang={lang}
              onOpenLightbox={(src) => setLightboxImg(src)}
              onDeleteMoment={handleDeleteMoment}
              currentUser={currentUser}
            />
          )}
        </main>
      )}

      {/* Screen C: USER MANAGER */}
      {tab === 'users' && currentUser && (
        <main className="max-w-md w-full mx-auto px-3 sm:px-6 pt-8 sm:pt-16 pb-28 sm:pb-8 flex-1 animate-in fade-in duration-200">
          <UserManagerTab
            currentUser={currentUser}
            lang={lang}
            onLogout={handleLogout}
            onUpdateAvatar={handleUpdateAvatar}
            onOpenLightbox={(src) => setLightboxImg(src)}
          />
        </main>
      )}

      {/* Modals & Overlays */}
      <NetWorthModal
        open={isBalanceModalOpen}
        onOpenChange={setIsBalanceModalOpen}
        finances={computedFinances}
        totalDebt={computedTotalDebt}
        lang={lang}
        initialBalances={initialBalances}
        onUpdateInitialBalances={handleUpdateInitialBalances}
        onReconcileBalance={handleReconcileBalance}
        onOpenExpenseModal={handleOpenExpenseModal}
        onOpenSavingsModal={() => setIsSavingsModalOpen(true)}
        onOpenDebtModal={() => setIsDebtModalOpen(true)}
      />

      <SavingsModal
        isOpen={isSavingsModalOpen}
        onClose={() => setIsSavingsModalOpen(false)}
        currentSavings={computedFinances.currentSavings}
        bankAccount={computedFinances.bankAccount}
        savingsGoal={computedFinances.savingsGoal}
        lang={lang}
        onWithdrawToBank={(amount, note) => handleTransfer('savings_to_bank', amount, note)}
        onDepositToSavings={(amount, note) => handleTransfer('bank_to_savings', amount, note)}
        onSaveSavingsGoal={handleSaveSavingsGoal}
      />

      <QuickExpenseModal
        isOpen={quickExpenseModal.isOpen}
        onClose={() => setQuickExpenseModal((prev) => ({ ...prev, isOpen: false }))}
        targetCard={quickExpenseModal.targetCard}
        finances={computedFinances}
        debts={debts}
        lang={lang}
        onAddExpense={handleAddExpense}
        onTransfer={handleTransfer}
        onPayDebt={handlePaySpecificDebt}
        onCollectDebt={handleCollectSpecificDebt}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        monthlyBudget={computedFinances.monthlyBudget}
        monthlySpent={currentMonthSpent}
        lang={lang}
        onSaveBudget={handleSaveBudget}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        debts={debts}
        lang={lang}
        onAddDebt={handleAddDebt}
        onDeleteDebt={handleDeleteDebt}
        onPayDebt={handlePaySpecificDebt}
        onCollectDebt={handleCollectSpecificDebt}
        finances={computedFinances}
      />

      <StoryZenModal
        open={isZenStoryOpen}
        onClose={() => setIsZenStoryOpen(false)}
        moments={todayMoments}
        lang={lang}
        currentUser={currentUser}
        theme={theme}
      />

      <LightboxModal
        imageSrc={lightboxImg}
        lang={lang}
        onClose={() => setLightboxImg(null)}
      />

      <MobileBottomNav
        currentTab={tab}
        onTabChange={handleTabChange}
        lang={lang}
        currentUser={currentUser}
      />

      <LoginModal
        open={authChecked && !currentUser}
        lang={lang}
        onLoginSuccess={handleLoginSuccess}
      />

      <CurrencySetupModal
        open={
          authChecked &&
          Boolean(currentUser) &&
          !currentUser?.currency &&
          currentUser?.username.toLowerCase() !== 'jeandev'
        }
        lang={lang}
        username={currentUser?.username || ''}
        onConfirm={handleConfirmCurrency}
      />

      <ToastNotification
        message={toastConfig.message}
        actionLabel={toastConfig.actionLabel}
        onAction={toastConfig.onAction}
      />

      <footer className="hidden sm:block border-t border-theme py-6 text-center text-xs text-theme-muted bg-background mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium">{t.footer_title}</span>
          <span className="font-mono text-[11px] text-zinc-400">{t.footer_backend}</span>
        </div>
      </footer>
    </div>
  )
}
