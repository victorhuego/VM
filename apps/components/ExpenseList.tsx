'use client'

import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { LanguageType, ExpenseItem, TimeFilterPeriod, FinancialState, DebtItem, InitialBalances } from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import {
  getClientLocalDateString,
  getClientYesterdayDateString,
  normalizeDateString,
  compareExpensesDescending,
} from '@/lib/time'
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Film,
  Sparkles,
  Trash2,
  Pencil,
  Lock,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Gift,
  TrendingUp,
  Coins,
  ImageIcon,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  ArrowLeftRight,
  Scale,
  Banknote,
} from 'lucide-react'
import { EditExpenseModal } from '@/components/EditExpenseModal'
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal'
import { CategoryIcon } from '@/components/CategoryIcon'

interface ExpenseListProps {
  expenses: ExpenseItem[]
  initialBalances?: InitialBalances
  lang: LanguageType
  onDeleteExpense: (id: string, amount: number) => void
  onOpenLightbox?: (url: string) => void
  onUpdateExpense?: (updatedItem: ExpenseItem, oldItem: ExpenseItem) => void
  finances?: FinancialState
  debts?: DebtItem[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  food: <Utensils className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  transport: <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  shopping: <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  housing: <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  entertainment: <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  development: <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  debt: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />,
  salary: <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />,
  bonus: <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />,
  investment: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />,
  other: <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />,
  transfer: <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />,
  reconciliation: <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />,
}

export function ExpenseList({
  expenses,
  initialBalances,
  lang,
  onDeleteExpense,
  onOpenLightbox,
  onUpdateExpense,
  finances,
  debts = [],
}: ExpenseListProps) {
  const t = dictionary[lang]

  // Editing state for selected expense item
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)

  // Deleting state for confirmation modal
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(null)

  // Latest reconciliation date for each source (Lock cutoff date)
  const latestReconciliationDates = useMemo(() => {
    const map: Record<string, string> = {}
    for (const item of expenses) {
      if (item.type === 'reconciliation' && item.source) {
        if (!map[item.source] || item.date > map[item.source]) {
          map[item.source] = item.date
        }
      }
    }
    return map
  }, [expenses])

  // Check if a transaction is locked by a subsequent reconciliation
  const isItemReconciledLocked = (item: ExpenseItem) => {
    if (item.type === 'reconciliation') return false
    if (item.type === 'transfer') {
      const cashCutoff = latestReconciliationDates['cash']
      const bankCutoff = latestReconciliationDates['account']
      return (!!cashCutoff && item.date <= cashCutoff) || (!!bankCutoff && item.date <= bankCutoff)
    }
    const src = item.source || 'account'
    const cutoff = latestReconciliationDates[src]
    if (!cutoff) return false
    return item.date <= cutoff
  }

  // Time filter period: 'month' (DEFAULT), 'day', 'year', 'all'
  const [period, setPeriod] = useState<TimeFilterPeriod>('month')

  // Selected date pointers
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1) // 1-12
  const [selectedDay, setSelectedDay] = useState(() => getClientLocalDateString())

  // Category filter: 'all' or specific
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const todayStr = useMemo(() => getClientLocalDateString(), [])
  const yesterdayStr = useMemo(() => getClientYesterdayDateString(), [])

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear((y) => y - 1)
    } else {
      setSelectedMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear((y) => y + 1)
    } else {
      setSelectedMonth((m) => m + 1)
    }
  }

  // Filter expenses by selected time period (sorted descending)
  const periodExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        // Check category first
        if (categoryFilter !== 'all' && item.category !== categoryFilter) {
          return false
        }

        if (period === 'all') return true

        const normalizedDate = normalizeDateString(item.date)
        const [yStr, mStr] = normalizedDate.split('-')
        const itemYear = Number(yStr)
        const itemMonth = Number(mStr)

        if (period === 'month') {
          return itemYear === selectedYear && itemMonth === selectedMonth
        }
        if (period === 'year') {
          return itemYear === selectedYear
        }
        if (period === 'day') {
          return normalizedDate === selectedDay
        }
        return true
      })
      .sort(compareExpensesDescending)
  }, [expenses, categoryFilter, period, selectedYear, selectedMonth, selectedDay])

  // Total expense spent in selected period (excluding income and transfers)
  const totalPeriodSpent = useMemo(() => {
    return periodExpenses
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0)
  }, [periodExpenses])

  // Total income in selected period
  const totalPeriodIncome = useMemo(() => {
    return periodExpenses
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0)
  }, [periodExpenses])

  // Grouped expenses based on view period (always descending order)
  const groupedData = useMemo(() => {
    if (period === 'year') {
      // Group by month
      const groups: Record<string, ExpenseItem[]> = {}
      for (const item of periodExpenses) {
        const normalized = normalizeDateString(item.date)
        const [y, m] = normalized.split('-')
        const key = `${m}/${y}`
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      }
      return Object.entries(groups)
        .sort(([aKey], [bKey]) => {
          const [mA, yA] = aKey.split('/').map(Number)
          const [mB, yB] = bKey.split('/').map(Number)
          if (yA !== yB) return yB - yA
          return mB - mA
        })
        .map(([monthKey, items]) => ({
          key: monthKey,
          label: `${t.month_name_prefix} ${monthKey}`,
          totalSpent: items
            .filter((i) => i.type === 'expense')
            .reduce((sum, i) => sum + i.amount, 0),
          totalIncome: items
            .filter((i) => i.type === 'income')
            .reduce((sum, i) => sum + i.amount, 0),
          items: items.sort(compareExpensesDescending),
        }))
    }

    if (period === 'month' || period === 'all') {
      // Group by date (descending)
      const groups: Record<string, ExpenseItem[]> = {}
      for (const item of periodExpenses) {
        const dateKey = normalizeDateString(item.date)
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(item)
      }
      // Sort dates descending
      return Object.keys(groups)
        .sort((a, b) => b.localeCompare(a))
        .map((dateKey) => {
          let label = dateKey
          if (dateKey === todayStr) {
            label = `${t.period_today} - ${dateKey.split('-').reverse().join('/')}`
          } else if (dateKey === yesterdayStr) {
            label = `${t.period_yesterday} - ${dateKey.split('-').reverse().join('/')}`
          } else {
            label = dateKey.split('-').reverse().join('/')
          }

          const items = groups[dateKey].sort(compareExpensesDescending)
          return {
            key: dateKey,
            label,
            totalSpent: items
              .filter((i) => i.type === 'expense')
              .reduce((sum, i) => sum + i.amount, 0),
            totalIncome: items
              .filter((i) => i.type === 'income')
              .reduce((sum, i) => sum + i.amount, 0),
            items,
          }
        })
    }

    // Single day
    return [
      {
        key: selectedDay,
        label:
          selectedDay === todayStr
            ? `${t.period_today} (${selectedDay})`
            : selectedDay === yesterdayStr
            ? `${t.period_yesterday} (${selectedDay})`
            : selectedDay,
        totalSpent: totalPeriodSpent,
        totalIncome: totalPeriodIncome,
        items: periodExpenses.slice().sort(compareExpensesDescending),
      },
    ]
  }, [period, periodExpenses, selectedDay, todayStr, yesterdayStr, t, totalPeriodSpent, totalPeriodIncome])

  const isCurrentMonth =
    selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth() + 1

  return (
    <Card className="border-theme rounded-xl p-4 sm:p-5 bg-white shadow-xs space-y-4">
      {/* 1. Header & Time Period Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-3.5">
        <div className="flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-theme-accent shrink-0" />
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-theme-main">
            {t.history_title}
          </h2>
        </div>

        {/* Period Switcher: Theo Tháng (Mặc định) | Theo Ngày | Theo Năm */}
        <div className="flex items-center bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/70 gap-1 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === 'month'
                ? 'bg-white text-theme-main shadow-xs ring-1 ring-black/5 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
            }`}
          >
            {t.filter_by_month}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('day')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === 'day'
                ? 'bg-white text-theme-main shadow-xs ring-1 ring-black/5 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
            }`}
          >
            {t.filter_by_day}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('year')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              period === 'year'
                ? 'bg-white text-theme-main shadow-xs ring-1 ring-black/5 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60'
            }`}
          >
            {t.filter_by_year}
          </button>
        </div>
      </div>

      {/* 2. Interactive Period Navigator & Summary KPI Banner */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-theme-surface/75 border border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Period Navigator Controls */}
        <div className="flex items-center space-x-2">
          {period === 'month' && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-md bg-white border border-theme flex items-center justify-center text-theme-main hover:bg-theme-surface cursor-pointer shadow-2xs"
                title={t.period_prev_month}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white rounded-md border border-theme font-mono text-xs font-bold text-theme-main shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-theme-accent" />
                <span>
                  {t.month_name_prefix} {selectedMonth.toString().padStart(2, '0')}/{selectedYear}
                </span>
                {isCurrentMonth && (
                  <span className="ml-1 text-[9px] font-sans font-medium px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                    {t.period_this_month}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-md bg-white border border-theme flex items-center justify-center text-theme-main hover:bg-theme-surface cursor-pointer shadow-2xs"
                title={t.period_next_month}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {period === 'day' && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setSelectedDay(todayStr)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  selectedDay === todayStr
                    ? 'bg-white border-theme font-semibold text-theme-main shadow-2xs'
                    : 'bg-transparent border-transparent text-theme-muted hover:text-theme-main'
                }`}
              >
                {t.period_today}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDay(yesterdayStr)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                  selectedDay === yesterdayStr
                    ? 'bg-white border-theme font-semibold text-theme-main shadow-2xs'
                    : 'bg-transparent border-transparent text-theme-muted hover:text-theme-main'
                }`}
              >
                {t.period_yesterday}
              </button>
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="h-7 px-2 bg-white rounded-md border border-theme text-xs font-mono font-medium text-theme-main cursor-pointer"
              />
            </div>
          )}

          {period === 'year' && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                className="w-7 h-7 rounded-md bg-white border border-theme flex items-center justify-center text-theme-main hover:bg-theme-surface cursor-pointer shadow-2xs"
                title={lang === 'vi' ? 'Năm trước' : 'Previous year'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-white rounded-md border border-theme font-mono text-xs font-bold text-theme-main shadow-2xs">
                <span>
                  {t.year_name_prefix} {selectedYear}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                className="w-7 h-7 rounded-md bg-white border border-theme flex items-center justify-center text-theme-main hover:bg-theme-surface cursor-pointer shadow-2xs"
                title={lang === 'vi' ? 'Năm sau' : 'Next year'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Period KPI Summary */}
        <div className="flex items-center space-x-3 text-xs">
          {totalPeriodIncome > 0 && (
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-emerald-600 font-medium block">
                {lang === 'vi' ? 'Tổng thu kỳ này' : 'Income'}
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600">
                +{formatMoney(totalPeriodIncome, lang)}
              </span>
            </div>
          )}
          <div className="space-y-0.5 text-right sm:text-right">
            <span className="text-[10px] text-theme-muted block">{t.period_summary_label}</span>
            <span className="font-mono text-sm sm:text-base font-bold text-theme-gradient">
              {formatMoney(totalPeriodSpent, lang)}
            </span>
          </div>
          <div className="h-7 w-px bg-theme-border/80 hidden sm:block" />
          <div className="hidden sm:block space-y-0.5 text-right">
            <span className="text-[10px] text-theme-muted block">
              {periodExpenses.length} {t.transactions_count}
            </span>
            <span className="font-mono text-xs font-semibold text-theme-main">
              {t.daily_avg_label}:{' '}
              {formatMoney(
                period === 'day'
                  ? totalPeriodSpent
                  : Math.round(totalPeriodSpent / (period === 'year' ? 365 : 30)),
                lang
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1 flex-nowrap">
        {(
          [
            'all',
            'food',
            'transport',
            'shopping',
            'housing',
            'entertainment',
            'development',
            'debt',
            'salary',
            'reconciliation',
          ] as const
        ).map((key) => {
          const isSelected = categoryFilter === key
          const labelKey = `filter_${key}` as keyof typeof t
          const labelText =
            key === 'salary'
              ? t.cat_salary
              : key === 'reconciliation'
              ? t.filter_reconciliation
              : t[labelKey] || key

          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategoryFilter(key)}
              className={`px-2.5 py-1 min-h-[30px] rounded-md text-xs font-medium transition-all shrink-0 cursor-pointer active:opacity-60 whitespace-nowrap flex items-center justify-center ${
                isSelected
                  ? 'btn-theme-gradient text-white shadow-xs font-semibold'
                  : 'bg-theme-surface text-theme-muted hover:text-theme-main border border-theme'
              }`}
            >
              <span className="pointer-events-none">{labelText}</span>
            </button>
          )
        })}
      </div>

      {/* 4. Grouped Transactions List with Mobile-Optimized Scrolling (iPhone 12 Pro Max / 14 Plus) */}
      <div className="space-y-3 pt-1 max-h-[480px] sm:max-h-[520px] lg:max-h-[600px] overflow-y-auto overscroll-contain pr-1 sm:pr-1.5 expense-scroll-container">
        {groupedData.length === 0 || periodExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-theme-muted bg-theme-surface/40 rounded-lg border border-theme border-dashed">
            {lang === 'vi'
              ? 'Không tìm thấy giao dịch nào trong khoảng thời gian đã chọn.'
              : 'No transactions found for the selected time period.'}
          </div>
        ) : (
          groupedData.map((group) => {
            if (group.items.length === 0) return null
            return (
              <div key={group.key} className="space-y-1.5">
                {/* Group Sub-Header */}
                <div className="flex items-center justify-between text-xs font-semibold text-theme-main bg-theme-surface px-3 py-1.5 rounded-lg border border-theme/70">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3 h-3 text-theme-accent" />
                    <span>{group.label}</span>
                  </span>
                  <div className="flex items-center space-x-2 font-mono text-zinc-600 font-normal">
                    {group.totalIncome > 0 && (
                      <span className="text-emerald-600 font-semibold">
                        +{formatMoney(group.totalIncome, lang)}
                      </span>
                    )}
                    <span>
                      {t.total_label} {formatMoney(group.totalSpent, lang)}
                    </span>
                  </div>
                </div>

                {/* Group Item Cards */}
                <div className="divide-y divide-zinc-100 border border-theme rounded-lg overflow-hidden bg-white">
                  {group.items.map((item) => {
                    const isIncome = item.type === 'income'
                    const isTransfer = item.type === 'transfer'
                    const isReconciliation = item.type === 'reconciliation'
                    const isCashSource = item.source === 'cash'
                    const isLocked = isItemReconciledLocked(item)

                    return (
                      <div
                        key={item.id}
                        className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-theme-surface/50 transition-colors group"
                      >
                        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                          {/* Category / Type Icon */}
                          <CategoryIcon
                            categoryId={isTransfer ? 'transfer' : isReconciliation ? 'reconciliation' : item.category}
                            size="md"
                            showBackground
                          />

                          <div className="space-y-1 min-w-0">
                            {/* Note & Badges Row */}
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span className="text-xs sm:text-sm font-medium text-zinc-900 truncate">
                                {item.note}
                              </span>

                              {/* Transfer Badge */}
                              {isTransfer && (
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                                    item.transferDirection === 'savings_to_bank' || item.transferDirection === 'bank_to_savings'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  <ArrowLeftRight className="w-2.5 h-2.5" />
                                  <span>
                                    {item.transferDirection === 'cash_to_bank'
                                      ? (lang === 'vi' ? 'Nạp TK' : 'Deposit')
                                      : item.transferDirection === 'bank_to_cash'
                                      ? (lang === 'vi' ? 'Rút mặt' : 'Withdraw')
                                      : item.transferDirection === 'savings_to_bank'
                                      ? (lang === 'vi' ? 'Rút tiết kiệm' : 'From Savings')
                                      : (lang === 'vi' ? 'Gửi tiết kiệm' : 'To Savings')}
                                  </span>
                                </span>
                              )}

                              {/* Reconciliation Badge */}
                              {isReconciliation && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 bg-purple-50 text-purple-800 border-purple-200">
                                  <Scale className="w-2.5 h-2.5 text-purple-600" />
                                  <span>{t.badge_reconciliation}</span>
                                </span>
                              )}

                              {/* Source Badge: Tiền mặt vs Tài khoản */}
                              {!isIncome && !isTransfer && !isReconciliation && (
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                                    isCashSource
                                      ? 'bg-emerald-100/70 text-emerald-800 border-emerald-300 font-semibold'
                                      : 'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  {isCashSource ? (
                                    <Banknote className="w-2.5 h-2.5 text-emerald-700" />
                                  ) : (
                                    <CreditCard className="w-2.5 h-2.5 text-blue-700" />
                                  )}
                                  <span>
                                    {isCashSource ? t.source_cash_short : t.source_account_short}
                                  </span>
                                </span>
                              )}

                              {/* Income Badge */}
                              {isIncome && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-0.5">
                                  <span>+ {t.tab_income_type}</span>
                                </span>
                              )}

                              {/* Reconciled Lock Badge */}
                              {isLocked && (
                                <span
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center space-x-1"
                                  title={t.reconciled_lock_tooltip}
                                >
                                  <Lock className="w-2.5 h-2.5 text-amber-600" />
                                  <span>{t.reconciled_lock_badge}</span>
                                </span>
                              )}

                              {/* Attached Receipt Thumbnail / Badge */}
                              {item.image && (
                                <button
                                  type="button"
                                  onClick={() => onOpenLightbox?.(item.image!)}
                                  className="inline-flex items-center space-x-1 text-[10px] font-medium text-theme-main bg-theme-surface border border-theme rounded px-1.5 py-0.5 hover:bg-theme-main hover:text-white transition-colors cursor-pointer"
                                  title={lang === 'vi' ? 'Xem hóa đơn đính kèm' : 'View receipt image'}
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>{t.has_receipt_badge}</span>
                                </button>
                              )}
                            </div>

                            {/* Subtext info */}
                            <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-zinc-400 font-mono flex-wrap">
                              <span className="text-theme-accent font-sans whitespace-nowrap">
                                {t[`cat_${item.category}` as keyof typeof t] || item.category}
                              </span>
                              <span className="whitespace-nowrap">• {item.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 ml-2">
                          {/* Receipt image mini thumbnail click-to-zoom if present */}
                          {item.image && (
                            <button
                              type="button"
                              onClick={() => onOpenLightbox?.(item.image!)}
                              className="hidden sm:block w-8 h-8 rounded border border-theme overflow-hidden hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                              title={lang === 'vi' ? 'Xem ảnh hóa đơn' : 'View receipt'}
                            >
                              <img
                                src={item.image}
                                alt="Receipt"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          )}

                          <span
                            className={`font-mono-nums text-xs sm:text-sm font-bold ${
                              isIncome
                                ? 'text-emerald-600'
                                : isTransfer
                                ? 'text-blue-600'
                                : isReconciliation
                                ? 'text-purple-700'
                                : 'text-zinc-900'
                            }`}
                          >
                            {isIncome
                              ? '+ '
                              : isTransfer
                              ? ''
                              : isReconciliation
                              ? (item.reconcileDiff && item.reconcileDiff > 0 ? '+ ' : item.reconcileDiff && item.reconcileDiff < 0 ? '- ' : '')
                              : '- '}
                            {formatMoney(item.amount, lang)}
                          </span>

                          {/* Edit Button (Expense & Income items) */}
                          {(!isTransfer && !isReconciliation) && (
                            <button
                              type="button"
                              onClick={() => setEditingExpense(item)}
                              title={t.btn_edit_expense || 'Chỉnh sửa'}
                              className="text-zinc-400 hover:text-amber-600 hover:bg-amber-50 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 touch-target cursor-pointer active:opacity-75"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {isLocked ? (
                            <button
                              type="button"
                              disabled
                              title={t.reconciled_lock_tooltip}
                              className="text-zinc-300 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded cursor-not-allowed opacity-40 transition-all touch-target"
                            >
                              <Lock className="w-3.5 h-3.5 text-zinc-400" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingExpense(item)}
                              title={t.delete_btn}
                              className="text-zinc-400 hover:text-rose-600 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 touch-target cursor-pointer active:opacity-75"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Confirm Delete Modal with Real-time Impact Preview */}
      {deletingExpense && (
        <ConfirmDeleteModal
          isOpen={!!deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onConfirm={() => {
            if (deletingExpense) {
              onDeleteExpense(deletingExpense.id, deletingExpense.amount)
              setDeletingExpense(null)
            }
          }}
          item={deletingExpense}
          expenses={expenses}
          initialBalances={initialBalances || { cash: 0, bankAccount: 0, savings: 0 }}
          debts={debts}
          latestReconciliationDates={latestReconciliationDates}
          lang={lang}
        />
      )}

      {/* Edit Expense Modal with Real-time Impact Preview */}
      {editingExpense && finances && onUpdateExpense && (
        <EditExpenseModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expense={editingExpense}
          expenses={expenses}
          initialBalances={initialBalances || { cash: 0, bankAccount: 0, savings: 0 }}
          finances={finances}
          debts={debts}
          lang={lang}
          isLocked={isItemReconciledLocked(editingExpense)}
          onSave={(updated, old) => {
            onUpdateExpense(updated, old)
            setEditingExpense(null)
          }}
        />
      )}
    </Card>
  )
}

