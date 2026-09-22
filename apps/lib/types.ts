export type ThemeType = 'matcha' | 'sakura' | 'mint' | 'lavender' | 'mocha' | 'slate'
export type LanguageType = 'vi' | 'en'
export type TabType = 'expenses' | 'moments' | 'users'
export type MoodType = 'focus' | 'serene' | 'spark' | 'cozy' | 'wander' | 'flow'

export interface UserProfile {
  username: string
  displayName: string
  avatar?: string
}

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'reconciliation'

export type ExpenseSourceType = 'cash' | 'account' | 'savings'
export type WalletType = 'cash' | 'bank_account' | 'e_wallet' | 'savings' | 'credit_card' | 'investment'

export type ExpenseCategoryType =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'housing'
  | 'entertainment'
  | 'development'
  | 'debt'
  | 'reconciliation'
  | 'health'
  | 'education'
  | 'beauty'
  | 'pets'
  | 'children'
  | 'gifts'
  | 'bills'
  | 'repairs'
  | 'other'

export type IncomeCategoryType = 'salary' | 'bonus' | 'investment' | 'rental' | 'debt_collection' | 'other'
export type TransferDirection = 'cash_to_bank' | 'bank_to_cash' | 'savings_to_bank' | 'bank_to_savings'

export interface Category {
  id: string
  name: string
  nameEn: string
  iconName: string
  color: string
  type: 'expense' | 'income' | 'system'
  isDefault?: boolean
}

export interface Budget {
  id: string
  categoryId?: string
  amount: number
  period: 'monthly'
}

export interface ExpenseItem {
  id: string
  type?: TransactionType
  category: string
  amount: number
  note: string
  date: string
  timeAgo: string
  source?: ExpenseSourceType
  transferDirection?: TransferDirection
  image?: string
  reconcileDiff?: number
  debtId?: string
  user?: string
}

export interface MomentItem {
  id: string
  time: string
  date: string
  caption: string
  mood: MoodType
  image?: string
  driveName?: string
  user?: string
}

export type TimeFilterPeriod = 'month' | 'day' | 'year' | 'all'

export interface InitialBalances {
  cash: number
  bankAccount: number
  savings: number
}

export interface FinancialState {
  cash: number
  bankAccount: number
  currentSavings: number
  totalDebt: number
  savingsGoal: number
  monthlyBudget: number
  totalMonthlySpent: number
  todaySpent: number
  yesterdaySpent: number
}

export interface DebtItem {
  id: string
  title: string
  amount: number
  date: string
  creditor?: string
  note?: string
  user?: string
}
