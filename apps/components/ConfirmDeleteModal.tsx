'use client'

import React, { useEffect, useMemo } from 'react'
import {
  ExpenseItem,
  LanguageType,
  InitialBalances,
  DebtItem,
} from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import { previewDeleteTransactionImpact } from '@/lib/accounting'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  Building2,
  Calendar,
  X,
  Trash2,
  Lock,
  Coins,
  Receipt,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { CategoryIcon } from './CategoryIcon'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  item: ExpenseItem | null
  expenses: ExpenseItem[]
  initialBalances: InitialBalances
  debts?: DebtItem[]
  latestReconciliationDates?: Record<string, string>
  lang: LanguageType
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  expenses,
  initialBalances,
  debts = [],
  latestReconciliationDates = {},
  lang,
}: ConfirmDeleteModalProps) {
  const t = dictionary[lang]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const impact = useMemo(() => {
    if (!item) return null
    return previewDeleteTransactionImpact({
      expenses,
      initialBalances,
      deleteItem: item,
      debts,
      latestReconciliationDates,
    })
  }, [item, expenses, initialBalances, debts, latestReconciliationDates])

  if (!isOpen || !item || !impact) return null

  const isIncome = item.type === 'income'
  const isExpense = item.type === 'expense' || !item.type
  const isTransfer = item.type === 'transfer'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-theme-card rounded-2xl shadow-2xl border border-theme max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Cozy Drag Handle */}
        <div className="hidden [html[data-theme='cozy']_&]:block pt-2 pb-0.5 text-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-[#D4C3B3] mx-auto" />
        </div>

        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-theme/60 flex items-center justify-between bg-theme-surface/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
              impact.hasNegative ? 'bg-rose-600 text-white' : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
            }`}>
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-theme-main leading-tight">
                {t.confirm_delete_title}
              </h3>
              <p className="text-[11px] sm:text-xs text-theme-muted mt-0.5">
                {t.confirm_delete_sub}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-theme-muted hover:text-theme-main p-1.5 rounded-lg hover:bg-theme-surface transition-colors cursor-pointer"
            title={t.btn_cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Target Transaction Card */}
          <div className="p-3.5 rounded-xl border border-theme/60 bg-theme-surface/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-theme-card border border-theme/60 flex items-center justify-center text-theme-main">
                  <CategoryIcon categoryId={item.category} className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-theme-main line-clamp-1">
                    {item.note || item.category}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-theme-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                    <span>•</span>
                    <span>
                      {item.source === 'cash'
                        ? t.source_cash_short
                        : item.source === 'savings'
                        ? (lang === 'vi' ? 'Tiết kiệm' : 'Savings')
                        : t.source_account_short}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold text-sm ${
                  isIncome ? 'text-emerald-400' : isExpense ? 'text-theme-main' : 'text-blue-400'
                }`}>
                  {isIncome ? '+ ' : isExpense ? '- ' : ''}
                  {formatMoney(item.amount, lang)}
                </div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-theme-muted">
                  {isIncome ? t.tab_income_type : isExpense ? t.tab_expense_type : t.tab_transfer_type}
                </div>
              </div>
            </div>
          </div>

          {/* Reconciled Warning Banner if locked */}
          {impact.isReconciledLocked && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold text-amber-300">
                  {t.delete_warning_reconciled_title}
                </div>
                <div className="text-[11px] text-amber-400/90 leading-relaxed">
                  {t.delete_warning_reconciled_desc}
                </div>
              </div>
            </div>
          )}

          {/* Negative Balance Danger Alert */}
          {impact.hasNegative && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2.5 shadow-xs animate-in shake duration-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-200 text-[13px]">
                  {t.delete_warning_negative_title}
                </div>
                <div className="text-[11px] text-rose-300/90 leading-relaxed">
                  {t.delete_warning_negative_desc}
                </div>
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {impact.negativeWallets.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 bg-rose-900/60 text-rose-200 rounded-md font-mono text-[11px] font-bold border border-rose-500/60"
                    >
                      {w === 'cash'
                        ? t.source_cash_short
                        : w === 'savings'
                        ? (lang === 'vi' ? 'Tiết kiệm' : 'Savings')
                        : t.source_account_short}
                      : {formatMoney(impact.nextBalances[w], lang)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Balance Impact Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-theme-main">
                {t.delete_impact_title}
              </span>
              <span className="text-[10px] text-theme-muted font-mono">SSOT Ledger</span>
            </div>

            <div className="p-3 rounded-xl bg-theme-surface/80 border border-theme/60 space-y-2.5 text-xs">
              {/* Cash Wallet Change */}
              {impact.deltas.cash !== 0 && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-theme-main font-medium text-xs">{t.source_cash_short}</span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs">
                      <span className="text-theme-muted">{formatMoney(impact.currentBalances.cash, lang)}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-theme-muted shrink-0" />
                      <span className={`font-bold ${
                        impact.nextBalances.cash < 0
                          ? 'text-rose-400'
                          : impact.deltas.cash > 0
                          ? 'text-emerald-400'
                          : 'text-theme-main'
                      }`}>
                        {formatMoney(impact.nextBalances.cash, lang)}
                      </span>
                    </div>
                    <div className={`text-[10px] font-semibold ${
                      impact.deltas.cash > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {impact.deltas.cash > 0 ? `+${formatMoney(impact.deltas.cash, lang)} (${t.delete_impact_refund})` : `${formatMoney(impact.deltas.cash, lang)} (${t.delete_impact_deduct})`}
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Wallet Change */}
              {impact.deltas.bankAccount !== 0 && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-theme-main font-medium text-xs">{t.source_account_short}</span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs">
                      <span className="text-theme-muted">{formatMoney(impact.currentBalances.bankAccount, lang)}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-theme-muted shrink-0" />
                      <span className={`font-bold ${
                        impact.nextBalances.bankAccount < 0
                          ? 'text-rose-400'
                          : impact.deltas.bankAccount > 0
                          ? 'text-emerald-400'
                          : 'text-theme-main'
                      }`}>
                        {formatMoney(impact.nextBalances.bankAccount, lang)}
                      </span>
                    </div>
                    <div className={`text-[10px] font-semibold ${
                      impact.deltas.bankAccount > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {impact.deltas.bankAccount > 0 ? `+${formatMoney(impact.deltas.bankAccount, lang)} (${t.delete_impact_refund})` : `${formatMoney(impact.deltas.bankAccount, lang)} (${t.delete_impact_deduct})`}
                    </div>
                  </div>
                </div>
              )}

              {/* Savings Wallet Change */}
              {impact.deltas.savings !== 0 && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-theme-main font-medium text-xs">{lang === 'vi' ? 'Tiết kiệm' : 'Savings'}</span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs">
                      <span className="text-theme-muted">{formatMoney(impact.currentBalances.savings, lang)}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-theme-muted shrink-0" />
                      <span className={`font-bold ${
                        impact.nextBalances.savings < 0
                          ? 'text-rose-400'
                          : impact.deltas.savings > 0
                          ? 'text-emerald-400'
                          : 'text-theme-main'
                      }`}>
                        {formatMoney(impact.nextBalances.savings, lang)}
                      </span>
                    </div>
                    <div className={`text-[10px] font-semibold ${
                      impact.deltas.savings > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {impact.deltas.savings > 0 ? `+${formatMoney(impact.deltas.savings, lang)} (${t.delete_impact_refund})` : `${formatMoney(impact.deltas.savings, lang)} (${t.delete_impact_deduct})`}
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Spent Delta */}
              {impact.monthlySpentDelta !== 0 && (
                <div className="pt-2 border-t border-theme/60 flex items-center justify-between text-theme-muted">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.delete_impact_monthly_spent}</span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-blue-400">
                    {formatMoney(impact.monthlySpentBefore, lang)} → {formatMoney(impact.monthlySpentAfter, lang)} ({formatMoney(impact.monthlySpentDelta, lang)})
                  </div>
                </div>
              )}

              {/* Debt Restore Notice */}
              {impact.restoredDebt && (
                <div className="pt-2 border-t border-theme/60 flex items-center justify-between text-amber-300 bg-amber-950/40 p-2 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-medium">{t.delete_impact_debt_restore}</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-amber-300">
                    +{formatMoney(impact.restoredDebt.amount, lang)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-theme/60 bg-theme-surface/60 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-3.5 text-theme-muted hover:text-theme-main hover:bg-theme-card border-theme/60 bg-theme-surface/40 cursor-pointer"
          >
            {t.confirm_delete_cancel}
          </Button>

          <Button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`text-xs h-9 px-4 font-semibold text-white cursor-pointer shadow-xs active:scale-95 transition-all ${
              impact.hasNegative
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {impact.hasNegative ? t.confirm_delete_btn_override : t.confirm_delete_btn}
          </Button>
        </div>
      </div>
    </div>
  )
}
