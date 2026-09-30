'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { FinancialState, LanguageType, ExpenseItem, ThemeType } from '@/lib/types'
import { dictionary, formatMoney, formatCompactMoney } from '@/lib/i18n'
import { normalizeDateString } from '@/lib/time'
import { ShieldCheck, Target, Wallet, Building2, TrendingUp, AlertCircle, Coins } from 'lucide-react'

// Animated odometer money rolling counter
function AnimatedMoney({
  amount,
  lang,
  className = '',
}: {
  amount: number
  lang: LanguageType
  className?: string
}) {
  const [displayValue, setDisplayValue] = useState<number>(amount)
  const prevAmountRef = useRef<number>(amount)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = prevAmountRef.current
    const targetValue = amount
    prevAmountRef.current = amount

    if (startValue === targetValue) {
      setDisplayValue(targetValue)
      return
    }

    const duration = 550 // ms
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (targetValue - startValue) * ease
      setDisplayValue(current)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        setDisplayValue(targetValue)
      }
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [amount])

  return (
    <span className={className}>
      {formatMoney(Math.round(displayValue), lang)}
    </span>
  )
}

interface MetricCardsProps {
  finances: FinancialState
  expenses?: ExpenseItem[]
  lang: LanguageType
  onOpenBalanceModal: () => void
  onOpenSavingsModal: () => void
  onOpenExpenseModal?: (type: 'cash' | 'account' | 'debt' | 'month' | 'general') => void
  onOpenBudgetModal: () => void
  onOpenDebtModal: () => void
  theme?: ThemeType
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
  theme,
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
      const [y, m] = normalizeDateString(item.date).split('-').map(Number)
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

  const cardBase = `bento-card bg-theme-card border border-theme/80 flex flex-col justify-between min-h-[114px] sm:min-h-[124px] h-full p-3.5 sm:p-4 ${
    theme === 'ronin' ? 'rounded-none katana-cut-tr relative overflow-hidden' : 'rounded-2xl'
  }`

  return (
    <section className="space-y-3 sm:space-y-4">
      {/* ROW 1: 4 main cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* CARD 1: Tổng tài sản (Cash + Bank + Savings) */}
        <Card
          onClick={onOpenBalanceModal}
          className={`${cardBase} net-worth-card cursor-pointer hover:border-theme-accent/70 hover:shadow-md transition-all active:scale-[0.97] group`}
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
            <Coins className={`w-4 h-4 shrink-0 mt-0.5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200 ${theme === 'ronin' ? 'text-[#FF3B4E]' : 'text-theme-accent'}`} />
          </div>

          <div className="pt-2">
            <div className={`text-lg sm:text-xl font-bold font-mono-nums tracking-tight whitespace-nowrap truncate ${theme === 'ronin' ? 'text-white' : 'text-theme-gradient'}`}>
              <AnimatedMoney amount={totalAssets} lang={lang} />
            </div>
          </div>
        </Card>

        {/* CARD 2: Tiền mặt */}
        <Card className={`${cardBase} shadow-xs`}>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-theme-main leading-tight">
                {lang === 'vi' ? 'Tiền mặt' : 'Cash'}
              </h3>
              <p className="text-[10px] text-theme-muted mt-0.5">{lang === 'vi' ? 'Ví / tiền túi' : 'Wallet / pocket'}</p>
            </div>
            <Wallet className={`w-4 h-4 shrink-0 mt-0.5 ${theme === 'ronin' ? 'text-[#FF3B4E]' : 'text-emerald-600'}`} />
          </div>

          <div className="pt-2">
            <div className={`text-lg sm:text-xl font-bold font-mono-nums tracking-tight whitespace-nowrap truncate ${theme === 'ronin' ? 'text-white' : 'text-emerald-700'}`}>
              <AnimatedMoney amount={finances.cash} lang={lang} />
            </div>
          </div>
        </Card>

        {/* CARD 3: Tiền tài khoản ngân hàng */}
        <Card className={`${cardBase} shadow-xs`}>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-theme-main leading-tight">
                {lang === 'vi' ? 'Tiền tài khoản' : 'Bank Account'}
              </h3>
              <p className="text-[10px] text-theme-muted mt-0.5">{lang === 'vi' ? 'Số dư ngân hàng' : 'Bank balance'}</p>
            </div>
            <Building2 className={`w-4 h-4 shrink-0 mt-0.5 ${theme === 'ronin' ? 'text-[#FF3B4E]' : 'text-blue-600'}`} />
          </div>

          <div className="pt-2">
            <div className={`text-lg sm:text-xl font-bold font-mono-nums tracking-tight whitespace-nowrap truncate ${theme === 'ronin' ? 'text-white' : 'text-blue-700'}`}>
              <AnimatedMoney amount={finances.bankAccount} lang={lang} />
            </div>
          </div>
        </Card>

        {/* CARD 4: Chi tiêu & Ngân sách tháng này */}
        <Card
          onClick={onOpenBudgetModal}
          className={`${cardBase} cursor-pointer hover:border-amber-400/80 hover:shadow-md transition-all active:scale-[0.97] group`}
          title={lang === 'vi' ? 'Bấm để chỉnh sửa ngân sách tháng này' : 'Click to edit monthly budget'}
        >
          <div className="flex items-center justify-between gap-1">
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
            <div className={`text-lg sm:text-xl font-bold font-mono-nums tracking-tight whitespace-nowrap truncate ${
              theme === 'ronin' ? (isOverBudget ? 'text-[#FF2E44]' : 'text-white') : (isOverBudget ? 'text-rose-600' : 'text-amber-700')
            }`}>
              <AnimatedMoney amount={monthlySpent} lang={lang} />
            </div>
            <div className={`w-full h-2.5 overflow-hidden border mt-1.5 relative ${
              theme === 'ronin' ? 'bg-[#06080B] border-[#1E232E] rounded-none' : 'bg-theme-surface rounded-full border-theme/70'
            }`}>
              <div
                className={`h-full transition-all duration-700 ease-out relative ${
                  theme === 'ronin'
                    ? 'bg-gradient-to-r from-[#7F0910] via-[#E52535] to-[#FF2E44] shadow-[0_0_10px_#E52535]'
                    : isOverBudget ? 'bg-rose-500' : 'bg-theme-progress progress-shimmer'
                }`}
                style={{ width: `${budgetPercent}%` }}
              >
                {budgetPercent > 4 && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white progress-tip-glow" />
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ROW 2: Tiết kiệm + Nợ (compact secondary row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Tiết kiệm */}
        <Card
          onClick={onOpenSavingsModal}
          className={`bento-card bg-theme-card border border-theme/80 hover:border-amber-400/80 shadow-xs hover:shadow-md p-3.5 sm:p-4 !flex-row flex-row items-center gap-3.5 sm:gap-4 transition-all cursor-pointer group active:scale-[0.97] ${
            theme === 'ronin' ? 'rounded-none katana-cut-tr' : 'rounded-2xl'
          }`}
          title={lang === 'vi' ? 'Bấm để quản lý tiết kiệm (rút / nạp)' : 'Click to manage savings'}
        >
          <div className={`w-10 h-10 flex items-center justify-center shrink-0 transition-colors ${
            theme === 'ronin' ? 'bg-[#151922] border border-[#E52535]/40 rounded-none' : 'rounded-xl bg-amber-50 border border-amber-200 group-hover:bg-amber-100'
          }`}>
            <TrendingUp className={`w-5 h-5 group-hover:scale-110 transition-transform duration-200 ${theme === 'ronin' ? 'text-[#FF3B4E]' : 'text-amber-700'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-theme-main uppercase tracking-wide">
                {t.current_savings}
              </span>
              <span className={`text-base sm:text-lg font-bold font-mono-nums whitespace-nowrap ${theme === 'ronin' ? 'text-white' : 'text-amber-800'}`}>
                <AnimatedMoney amount={finances.currentSavings} lang={lang} />
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className={`flex-1 h-2.5 overflow-hidden border relative ${
                theme === 'ronin' ? 'bg-[#06080B] border-[#1E232E] rounded-none' : 'bg-theme-surface rounded-full border-theme/70'
              }`}>
                <div
                  className={`h-full transition-all duration-700 relative ${
                    theme === 'ronin'
                      ? 'bg-gradient-to-r from-[#7F0910] via-[#E52535] to-[#FF2E44] shadow-[0_0_10px_#E52535]'
                      : 'bg-theme-progress progress-shimmer'
                  }`}
                  style={{ width: `${savingsPercent}%` }}
                >
                  {savingsPercent > 4 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white progress-tip-glow" />
                  )}
                </div>
              </div>
              <span className="text-[10px] font-mono text-theme-accent shrink-0 flex items-center gap-0.5">
                <Target className="w-3 h-3" />
                {savingsPercent.toFixed(1)}% / {formatMoney(finances.savingsGoal, lang)}
              </span>
            </div>
          </div>
        </Card>

        {/* CARD 6: Khoản nợ còn lại */}
        <Card
          onClick={onOpenDebtModal}
          className={`bento-card border p-3.5 sm:p-4 !flex-row flex-row items-center gap-3.5 sm:gap-4 cursor-pointer transition-all active:scale-[0.97] hover:shadow-md group ${
            theme === 'ronin' ? 'rounded-none katana-cut-tr' : 'rounded-2xl'
          } ${
            finances.totalDebt > 0
              ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
              : (finances.totalReceivable ?? 0) > 0
              ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400'
              : 'bg-theme-card border-theme/80 hover:border-emerald-400'
          }`}
          title={lang === 'vi' ? 'Bấm để xem danh sách & quản lý khoản nợ' : 'Click to manage debts'}
        >
          <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${
            theme === 'ronin' ? 'bg-[#151922] border border-[#E52535]/40 rounded-none' : 'rounded-xl'
          } ${
            finances.totalDebt > 0
              ? 'bg-amber-100 border border-amber-300'
              : (finances.totalReceivable ?? 0) > 0
              ? 'bg-emerald-100 border border-emerald-300'
              : 'bg-emerald-50 border border-emerald-200'
          }`}>
            {finances.totalDebt > 0 ? (
              <AlertCircle className={`w-5 h-5 group-hover:scale-110 transition-transform duration-200 ${theme === 'ronin' ? 'text-[#FF3B4E]' : 'text-amber-700'}`} />
            ) : (finances.totalReceivable ?? 0) > 0 ? (
              <Coins className={`w-5 h-5 group-hover:scale-110 transition-transform duration-200 ${theme === 'ronin' ? 'text-[#FF3B4E]' : 'text-emerald-700'}`} />
            ) : (
              <ShieldCheck className={`w-5 h-5 group-hover:scale-110 transition-transform duration-200 ${theme === 'ronin' ? 'text-[#FF3B4E]' : 'text-emerald-600'}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wide ${
                finances.totalDebt > 0
                  ? 'text-amber-800'
                  : (finances.totalReceivable ?? 0) > 0
                  ? 'text-emerald-800'
                  : 'text-theme-main'
              }`}>
                {finances.totalDebt > 0
                  ? (lang === 'vi' ? 'Nợ còn lại' : 'Remaining Debt')
                  : (finances.totalReceivable ?? 0) > 0
                  ? (lang === 'vi' ? 'Người khác nợ' : 'Receivables')
                  : (lang === 'vi' ? 'Nợ còn lại' : 'Remaining Debt')}
              </span>
              <span className={`text-base sm:text-lg font-bold font-mono-nums whitespace-nowrap ${
                theme === 'ronin'
                  ? (finances.totalDebt > 0 ? 'text-[#FF3B4E]' : 'text-white')
                  : finances.totalDebt > 0
                  ? 'text-amber-700'
                  : (finances.totalReceivable ?? 0) > 0
                  ? 'text-emerald-700'
                  : 'text-emerald-700'
              }`}>
                {finances.totalDebt > 0 ? (
                  <AnimatedMoney amount={finances.totalDebt} lang={lang} />
                ) : (finances.totalReceivable ?? 0) > 0 ? (
                  <AnimatedMoney amount={finances.totalReceivable!} lang={lang} />
                ) : (
                  t.no_debt_label
                )}
              </span>
            </div>
            {finances.totalDebt > 0 && (finances.totalReceivable ?? 0) > 0 && (
              <div className="text-[10px] text-emerald-700 font-mono mt-0.5 text-right truncate">
                {lang === 'vi' ? 'Cần thu: ' : 'Receivable: '}+{formatMoney(finances.totalReceivable!, lang)}
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}

