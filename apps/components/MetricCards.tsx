'use client'

import React, { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { FinancialState, LanguageType, ExpenseItem } from '@/lib/types'
import { dictionary, formatMoney, formatCompactMoney } from '@/lib/i18n'
import { ShieldCheck, Target, Wallet, Building2, TrendingUp, AlertCircle, Coins } from 'lucide-react'

interface MetricCardsProps {
  finances: FinancialState
  expenses?: ExpenseItem[]
  lang: LanguageType
  onOpenBalanceModal: () => void
  onOpenSavingsModal: () => void
  onOpenExpenseModal?: (type: 'cash' | 'account' | 'debt' | 'month' | 'general') => void
  onOpenBudgetModal: () => void
  onOpenDebtModal: () => void
}

export function MetricCards({
  finances,
  expenses,
  lang,
  onOpenBalanceModal,
  onOpenSavingsModal,
  onOpenExpenseModal,
  onOpenBudgetModal,
  onOpenDebtModal,
}: MetricCardsProps) {
  const t = dictionary[lang]

  // Dynamic monthly computation from real records
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const monthStr = currentMonth.toString().padStart(2, '0')
  const currentMonthLabel = `${monthStr}/${currentYear}`

  const { monthlySpent } = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { monthlySpent: finances.totalMonthlySpent }
    }
    let spent = 0
    for (const item of expenses) {
      const [y, m] = item.date.split('-').map(Number)
      if (y === currentYear && m === currentMonth && item.type === 'expense') {
        spent += item.amount
      }
    }
    return { monthlySpent: spent }
  }, [expenses, currentYear, currentMonth, finances.totalMonthlySpent])

  // Total Assets = Cash + BankAccount + Savings (Debt tracked separately, NOT deducted)
  const totalAssets = finances.cash + finances.bankAccount + finances.currentSavings
  const savingsPercent = Math.min(100, (finances.currentSavings / (finances.savingsGoal || 1)) * 100)
  const budgetPercent = Math.min(100, (monthlySpent / (finances.monthlyBudget || 1)) * 100)
  const remainingBudget = Math.max(0, finances.monthlyBudget - monthlySpent)
  const isOverBudget = budgetPercent >= 90

  const cardBase = 'bg-theme-card border-theme shadow-xs flex flex-col justify-between min-h-[110px] sm:min-h-[120px] h-full p-3.5 sm:p-4'

  return (
    <section className="space-y-3 sm:space-y-4">
      {/* ROW 1: 4 main cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* CARD 1: Tổng tài sản (Cash + Bank + Savings) */}
        <Card
          onClick={onOpenBalanceModal}
          className={`${cardBase} cursor-pointer hover:border-theme-accent/70 hover:shadow-md transition-all active:scale-[0.99] group`}
          title={lang === 'vi' ? 'Bấm để cập nhật số dư' : 'Click to update balance'}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-theme-main leading-tight">
                {t.actual_net_worth}
              </h3>
              <p className="text-[10px] text-theme-muted mt-0.5 truncate" title={t.net_worth_formula}>
                {t.net_worth_formula}
              </p>
            </div>
            <Coins className="w-4 h-4 text-theme-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
          </div>

          <div className="pt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums tracking-tight text-theme-gradient whitespace-nowrap truncate">
              {formatMoney(totalAssets, lang)}
            </div>
          </div>
        </Card>

        {/* CARD 2: Tiền mặt (Chỉ hiển thị chỉ số, không click thêm chi tiêu) */}
        <Card className={`${cardBase} border-theme shadow-xs`}>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-theme-main leading-tight">
                {lang === 'vi' ? 'Tiền mặt' : 'Cash'}
              </h3>
              <p className="text-[10px] text-theme-muted mt-0.5">{lang === 'vi' ? 'Ví / tiền túi' : 'Wallet / pocket'}</p>
            </div>
            <Wallet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          </div>

          <div className="pt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums tracking-tight text-emerald-700 whitespace-nowrap truncate">
              {formatMoney(finances.cash, lang)}
            </div>
          </div>
        </Card>

        {/* CARD 3: Tiền tài khoản ngân hàng (Chỉ hiển thị chỉ số, không click thêm chi tiêu) */}
        <Card className={`${cardBase} border-theme shadow-xs`}>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-theme-main leading-tight">
                {lang === 'vi' ? 'Tiền tài khoản' : 'Bank Account'}
              </h3>
              <p className="text-[10px] text-theme-muted mt-0.5">{lang === 'vi' ? 'Số dư ngân hàng' : 'Bank balance'}</p>
            </div>
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          </div>

          <div className="pt-2">
            <div className="text-xl sm:text-2xl font-bold font-mono-nums tracking-tight text-blue-700 whitespace-nowrap truncate">
              {formatMoney(finances.bankAccount, lang)}
            </div>
          </div>
        </Card>

        {/* CARD 4: Chi tiêu & Ngân sách tháng này (Bấm vào chỉ cho edit ngân sách) */}
        <Card
          onClick={onOpenBudgetModal}
          className={`${cardBase} cursor-pointer hover:border-amber-400/80 hover:shadow-md transition-all active:scale-[0.99] group`}
          title={lang === 'vi' ? 'Bấm để chỉnh sửa ngân sách tháng này' : 'Click to edit monthly budget'}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-theme-main whitespace-nowrap leading-tight">
                {currentMonthLabel}
              </h3>
              <p className="text-[10px] text-theme-muted mt-0.5 truncate">
                {lang === 'vi' ? 'Ngân sách' : 'Budget'}: {formatMoney(finances.monthlyBudget, lang)}
              </p>
            </div>
            <span className="text-[8px] font-mono font-medium px-1.5 py-0.5 bg-theme-surface text-theme-accent rounded border border-theme shrink-0">
              {lang === 'vi' ? 'Hiện tại' : 'Current'}
            </span>
          </div>

          <div className="pt-1.5">
            <div className={`text-xl sm:text-2xl font-bold font-mono-nums tracking-tight whitespace-nowrap truncate ${isOverBudget ? 'text-rose-600' : 'text-amber-700'}`}>
              {formatMoney(monthlySpent, lang)}
            </div>
            <div className="w-full bg-theme-surface h-1.5 rounded-full overflow-hidden border border-theme mt-1.5">
              <div
                className={`h-full transition-all duration-700 ease-out ${isOverBudget ? 'bg-rose-500' : 'bg-theme-progress'}`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ROW 2: Tiết kiệm + Nợ (compact secondary row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Tiết kiệm */}
        <Card
          onClick={onOpenSavingsModal}
          className="bg-theme-card border-theme hover:border-amber-400/80 shadow-xs hover:shadow-md p-3.5 sm:p-4 !flex-row flex-row items-center gap-3.5 sm:gap-4 transition-all cursor-pointer group active:scale-[0.99]"
          title={lang === 'vi' ? 'Bấm để quản lý tiết kiệm (rút / nạp)' : 'Click to manage savings'}
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 group-hover:bg-amber-100 flex items-center justify-center shrink-0 transition-colors">
            <TrendingUp className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-theme-main uppercase tracking-wide">
                {t.current_savings}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono-nums text-amber-800 whitespace-nowrap">
                {formatMoney(finances.currentSavings, lang)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-theme-surface rounded-full overflow-hidden border border-theme">
                <div
                  className="h-full bg-theme-progress transition-all duration-700"
                  style={{ width: `${savingsPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-theme-accent shrink-0 flex items-center gap-0.5">
                <Target className="w-3 h-3" />
                {savingsPercent.toFixed(1)}% / {formatMoney(finances.savingsGoal, lang)}
              </span>
            </div>
          </div>
        </Card>

        {/* CARD 6: Khoản nợ còn lại (Bấm vào xem list scrollable, thêm/xoá nợ) */}
        <Card
          onClick={onOpenDebtModal}
          className={`border shadow-xs p-3.5 sm:p-4 !flex-row flex-row items-center gap-3.5 sm:gap-4 cursor-pointer transition-all active:scale-[0.99] hover:shadow-md group ${
            finances.totalDebt > 0
              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
              : 'bg-theme-card border-theme hover:border-emerald-400'
          }`}
          title={lang === 'vi' ? 'Bấm để xem danh sách & quản lý khoản nợ' : 'Click to manage debts'}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${finances.totalDebt > 0 ? 'bg-amber-100 border border-amber-300' : 'bg-emerald-50 border border-emerald-200'}`}>
            {finances.totalDebt > 0
              ? <AlertCircle className="w-5 h-5 text-amber-700" />
              : <ShieldCheck className="w-5 h-5 text-emerald-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wide ${finances.totalDebt > 0 ? 'text-amber-800' : 'text-theme-main'}`}>
                {lang === 'vi' ? 'Nợ còn lại' : 'Remaining Debt'}
              </span>
              <span className={`text-base sm:text-lg font-bold font-mono-nums whitespace-nowrap ${finances.totalDebt > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {finances.totalDebt > 0 ? formatMoney(finances.totalDebt, lang) : t.no_debt_label}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

