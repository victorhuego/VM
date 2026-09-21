'use client'

import React, { useMemo } from 'react'
import { LanguageType, FinancialState, ExpenseItem } from '@/lib/types'
import { formatMoney } from '@/lib/i18n'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface BudgetAlertProps {
  lang: LanguageType
  finances: FinancialState
  expenses?: ExpenseItem[]
}

export function BudgetAlert({ lang, finances, expenses }: BudgetAlertProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const monthlySpent = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return finances.totalMonthlySpent
    }
    return expenses
      .filter((item) => {
        if (item.type !== 'expense') return false
        const [y, m] = item.date.split('-').map(Number)
        return y === currentYear && m === currentMonth
      })
      .reduce((sum, item) => sum + item.amount, 0)
  }, [expenses, currentYear, currentMonth, finances.totalMonthlySpent])

  const percent = Math.round(
    (monthlySpent / (finances.monthlyBudget || 1)) * 100
  )
  const isWarning = percent >= 80
  const remaining = Math.max(0, finances.monthlyBudget - monthlySpent)

  if (isWarning) {
    return (
      <section className="bg-rose-50/90 border border-rose-200/90 rounded-xl p-3.5 sm:p-4 flex items-start space-x-3 transition-all">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-rose-900">
          <h4 className="font-semibold">
            {lang === 'vi'
              ? `Cảnh báo: Bạn đã chi ${percent}% ngân sách tháng`
              : `Warning: You have used ${percent}% of monthly budget`}
          </h4>
          <p className="text-rose-800 leading-relaxed text-[11px] sm:text-xs">
            {lang === 'vi'
              ? `Hạn mức chi tiêu an toàn còn lại trong tháng là ${formatMoney(remaining, lang)}.`
              : `Remaining safe budget for this month is ${formatMoney(remaining, lang)}.`}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-2 text-xs text-emerald-900 transition-all">
      <div className="flex items-center space-x-2.5 min-w-0">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="truncate text-[11px] sm:text-xs">
          <span className="hidden sm:inline">
            {lang === 'vi'
              ? `Ngân sách tháng đang được kiểm soát an toàn (${percent}% đã dùng)`
              : `Monthly budget is in healthy standing (${percent}% utilized)`}
          </span>
          <span className="sm:hidden">
            {lang === 'vi'
              ? `Ngân sách an toàn (${percent}% dùng)`
              : `Budget safe (${percent}% used)`}
          </span>
        </span>
      </div>
      <span className="font-mono font-semibold text-emerald-800 text-[11px] sm:text-xs shrink-0">
        {lang === 'vi' ? 'Còn' : 'Rem'}: {formatMoney(remaining, lang)}
      </span>
    </section>
  )
}

