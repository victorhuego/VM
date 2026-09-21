import { ExpenseItem, InitialBalances, DebtItem, ExpenseSourceType } from '@/lib/types'
import { normalizeDateString } from './time'

export interface WalletBalances {
  cash: number
  bankAccount: number
  savings: number
}

export interface DeleteImpactPreview {
  currentBalances: WalletBalances
  nextBalances: WalletBalances
  deltas: WalletBalances
  hasNegative: boolean
  negativeWallets: ('cash' | 'bankAccount' | 'savings')[]
  monthlySpentBefore: number
  monthlySpentAfter: number
  monthlySpentDelta: number
  restoredDebt: {
    id: string
    title: string
    amount: number
  } | null
  isTransfer: boolean
  isReconciledLocked: boolean
}

export interface EditImpactPreview {
  currentBalances: WalletBalances
  nextBalances: WalletBalances
  deltas: WalletBalances
  hasNegative: boolean
  negativeWallets: ('cash' | 'bankAccount' | 'savings')[]
  monthlySpentBefore: number
  monthlySpentAfter: number
  monthlySpentDelta: number
  isSourceSwitched: boolean
  oldSource: ExpenseSourceType
  newSource: ExpenseSourceType
  debtImpact: {
    debtId: string
    debtTitle?: string
    deltaAmount: number
  } | null
}

/**
 * Replays transaction ledger from initial seeds to derive exact balances (SSOT)
 */
export function computeLedgerBalances(
  expenses: ExpenseItem[],
  initialBalances: InitialBalances
): WalletBalances {
  let cash = initialBalances.cash
  let bankAccount = initialBalances.bankAccount
  let savings = initialBalances.savings

  for (const item of expenses) {
    if (item.type === 'expense') {
      if (item.source === 'cash') cash -= item.amount
      else if (item.source === 'account') bankAccount -= item.amount
    } else if (item.type === 'income') {
      if (item.source === 'cash') cash += item.amount
      else if (item.source === 'account') bankAccount += item.amount
      else if (item.source === 'savings') savings += item.amount
    } else if (item.type === 'transfer') {
      if (item.transferDirection === 'cash_to_bank') {
        cash -= item.amount
        bankAccount += item.amount
      } else if (item.transferDirection === 'bank_to_cash') {
        bankAccount -= item.amount
        cash += item.amount
      } else if (item.transferDirection === 'savings_to_bank') {
        savings -= item.amount
        bankAccount += item.amount
      } else if (item.transferDirection === 'bank_to_savings') {
        bankAccount -= item.amount
        savings += item.amount
      }
    } else if (item.type === 'reconciliation') {
      const diff = item.reconcileDiff ?? 0
      if (item.source === 'cash') cash += diff
      else if (item.source === 'account') bankAccount += diff
      else if (item.source === 'savings') savings += diff
    }
  }

  return { cash, bankAccount, savings }
}

/**
 * Total expense spent in current month
 */
export function computeMonthlySpent(expenses: ExpenseItem[], targetDate: Date = new Date()): number {
  const currentYear = targetDate.getFullYear()
  const currentMonth = targetDate.getMonth() + 1

  return expenses
    .filter((item) => {
      if (item.type !== 'expense') return false
      const [y, m] = normalizeDateString(item.date).split('-').map(Number)
      return y === currentYear && m === currentMonth
    })
    .reduce((sum, item) => sum + item.amount, 0)
}

/**
 * Total expense spent on a specific date (YYYY-MM-DD)
 */
export function computeDaySpent(expenses: ExpenseItem[], targetDateStr: string): number {
  const targetNorm = normalizeDateString(targetDateStr)
  return expenses
    .filter((item) => item.type === 'expense' && normalizeDateString(item.date) === targetNorm)
    .reduce((sum, item) => sum + item.amount, 0)
}

/**
 * Dry-run preview of deleting a transaction and its impact across wallets and budgets
 */
export function previewDeleteTransactionImpact({
  expenses,
  initialBalances,
  deleteItem,
  debts = [],
  latestReconciliationDates = {},
}: {
  expenses: ExpenseItem[]
  initialBalances: InitialBalances
  deleteItem: ExpenseItem
  debts?: DebtItem[]
  latestReconciliationDates?: Record<string, string>
}): DeleteImpactPreview {
  const currentBalances = computeLedgerBalances(expenses, initialBalances)
  const remainingExpenses = expenses.filter((e) => e.id !== deleteItem.id)
  const nextBalances = computeLedgerBalances(remainingExpenses, initialBalances)

  const deltas: WalletBalances = {
    cash: nextBalances.cash - currentBalances.cash,
    bankAccount: nextBalances.bankAccount - currentBalances.bankAccount,
    savings: nextBalances.savings - currentBalances.savings,
  }

  const negativeWallets: ('cash' | 'bankAccount' | 'savings')[] = []
  if (nextBalances.cash < 0) negativeWallets.push('cash')
  if (nextBalances.bankAccount < 0) negativeWallets.push('bankAccount')
  if (nextBalances.savings < 0) negativeWallets.push('savings')

  const monthlySpentBefore = computeMonthlySpent(expenses)
  const monthlySpentAfter = computeMonthlySpent(remainingExpenses)

  let restoredDebt: { id: string; title: string; amount: number } | null = null
  if (deleteItem.debtId) {
    const matchedDebt = debts.find((d) => d.id === deleteItem.debtId)
    restoredDebt = {
      id: deleteItem.debtId,
      title: matchedDebt?.title || deleteItem.note.replace(/^Trả nợ:\s*/i, '').replace(/^Repay:\s*/i, '') || 'Khoản nợ',
      amount: deleteItem.amount,
    }
  }

  let isReconciledLocked = false
  if (deleteItem.type === 'transfer') {
    const cashCutoff = latestReconciliationDates['cash']
    const bankCutoff = latestReconciliationDates['account']
    isReconciledLocked = (!!cashCutoff && deleteItem.date <= cashCutoff) || (!!bankCutoff && deleteItem.date <= bankCutoff)
  } else if (deleteItem.type !== 'reconciliation') {
    const src = deleteItem.source || 'account'
    const cutoff = latestReconciliationDates[src]
    isReconciledLocked = !!cutoff && deleteItem.date <= cutoff
  }

  return {
    currentBalances,
    nextBalances,
    deltas,
    hasNegative: negativeWallets.length > 0,
    negativeWallets,
    monthlySpentBefore,
    monthlySpentAfter,
    monthlySpentDelta: monthlySpentAfter - monthlySpentBefore,
    restoredDebt,
    isTransfer: deleteItem.type === 'transfer',
    isReconciledLocked,
  }
}

/**
 * Dry-run preview of editing a transaction and its impact across wallets, budgets, and debts
 */
export function previewEditTransactionImpact({
  expenses,
  initialBalances,
  oldItem,
  updatedItem,
  debts = [],
}: {
  expenses: ExpenseItem[]
  initialBalances: InitialBalances
  oldItem: ExpenseItem
  updatedItem: ExpenseItem
  debts?: DebtItem[]
}): EditImpactPreview {
  const currentBalances = computeLedgerBalances(expenses, initialBalances)
  const updatedExpenses = expenses.map((e) => (e.id === oldItem.id ? updatedItem : e))
  const nextBalances = computeLedgerBalances(updatedExpenses, initialBalances)

  const deltas: WalletBalances = {
    cash: nextBalances.cash - currentBalances.cash,
    bankAccount: nextBalances.bankAccount - currentBalances.bankAccount,
    savings: nextBalances.savings - currentBalances.savings,
  }

  const negativeWallets: ('cash' | 'bankAccount' | 'savings')[] = []
  if (nextBalances.cash < 0) negativeWallets.push('cash')
  if (nextBalances.bankAccount < 0) negativeWallets.push('bankAccount')
  if (nextBalances.savings < 0) negativeWallets.push('savings')

  const monthlySpentBefore = computeMonthlySpent(expenses)
  const monthlySpentAfter = computeMonthlySpent(updatedExpenses)

  const oldSource = oldItem.source || 'account'
  const newSource = updatedItem.source || 'account'
  const isSourceSwitched = oldSource !== newSource

  let debtImpact: { debtId: string; debtTitle?: string; deltaAmount: number } | null = null
  const debtId = updatedItem.debtId || oldItem.debtId
  if (debtId) {
    const matchedDebt = debts.find((d) => d.id === debtId)
    const oldAmt = oldItem.debtId ? oldItem.amount : 0
    const newAmt = updatedItem.debtId ? updatedItem.amount : 0
    debtImpact = {
      debtId,
      debtTitle: matchedDebt?.title,
      deltaAmount: newAmt - oldAmt,
    }
  }

  return {
    currentBalances,
    nextBalances,
    deltas,
    hasNegative: negativeWallets.length > 0,
    negativeWallets,
    monthlySpentBefore,
    monthlySpentAfter,
    monthlySpentDelta: monthlySpentAfter - monthlySpentBefore,
    isSourceSwitched,
    oldSource,
    newSource,
    debtImpact,
  }
}
