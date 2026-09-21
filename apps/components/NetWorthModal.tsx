'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TouchpadField } from './TouchpadField'
import { LanguageType, FinancialState } from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import {
  PieChart,
  Scale,
  Wallet,
  Building2,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'

interface NetWorthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  finances: FinancialState
  totalDebt: number
  lang: LanguageType
  initialBalances?: {
    cash: number
    bankAccount: number
    savings: number
  }
  onUpdateInitialBalances?: (newInit: {
    cash: number
    bankAccount: number
    savings: number
  }) => Promise<void> | void
  onReconcileBalance: (params: {
    source: 'cash' | 'account' | 'savings'
    actualAmount: number
    diff: number
    reason: string
  }) => void
  onOpenExpenseModal: (type: 'cash' | 'account' | 'debt' | 'month') => void
  onOpenSavingsModal: () => void
  onOpenDebtModal: () => void
}

export function NetWorthModal({
  open,
  onOpenChange,
  finances,
  totalDebt,
  lang,
  initialBalances,
  onUpdateInitialBalances,
  onReconcileBalance,
  onOpenExpenseModal,
  onOpenSavingsModal,
  onOpenDebtModal,
}: NetWorthModalProps) {
  const t = dictionary[lang]
  const [activeTab, setActiveTab] = useState<'overview' | 'reconcile' | 'initial'>('overview')

  // Initial balances edit state
  const [initCash, setInitCash] = useState<string>('')
  const [initBank, setInitBank] = useState<string>('')
  const [initSavings, setInitSavings] = useState<string>('')
  const [isSavingInit, setIsSavingInit] = useState(false)

  // Reconcile state
  const [reconcileSource, setReconcileSource] = useState<'cash' | 'account' | 'savings'>('cash')
  const [actualAmountStr, setActualAmountStr] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Calculations
  const totalAssets = finances.cash + finances.bankAccount + finances.currentSavings
  const netWorth = totalAssets - totalDebt

  const cashPercent = totalAssets > 0 ? (finances.cash / totalAssets) * 100 : 0
  const bankPercent = totalAssets > 0 ? (finances.bankAccount / totalAssets) * 100 : 0
  const savingsPercent = totalAssets > 0 ? (finances.currentSavings / totalAssets) * 100 : 0

  const currentBookBalance =
    reconcileSource === 'cash'
      ? finances.cash
      : reconcileSource === 'account'
      ? finances.bankAccount
      : finances.currentSavings

  useEffect(() => {
    if (open) {
      setError(null)
      setReason('')
      // Pre-fill actual amount with current book balance for easy editing
      setActualAmountStr(currentBookBalance.toString())
    }
  }, [open, reconcileSource])

  useEffect(() => {
    if (open && initialBalances) {
      setInitCash(initialBalances.cash.toString())
      setInitBank(initialBalances.bankAccount.toString())
      setInitSavings(initialBalances.savings.toString())
    }
  }, [open, initialBalances])

  const handleSaveInit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onUpdateInitialBalances) return
    setIsSavingInit(true)
    try {
      const cash = parseFloat(initCash.replace(/,/g, '.')) || 0
      const bankAccount = parseFloat(initBank.replace(/,/g, '.')) || 0
      const savings = parseFloat(initSavings.replace(/,/g, '.')) || 0
      await onUpdateInitialBalances({ cash, bankAccount, savings })
      setActiveTab('overview')
    } finally {
      setIsSavingInit(false)
    }
  }

  const handleResetInitToZero = async () => {
    setInitCash('0')
    setInitBank('0')
    setInitSavings('0')
    if (onUpdateInitialBalances) {
      setIsSavingInit(true)
      try {
        await onUpdateInitialBalances({ cash: 0, bankAccount: 0, savings: 0 })
      } finally {
        setIsSavingInit(false)
      }
    }
  }

  const actualNum = parseFloat(actualAmountStr.replace(/,/g, '.')) || 0
  const diff = actualNum - currentBookBalance
  const hasDiff = Math.abs(diff) > 0.00001

  const handleReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (actualAmountStr.trim() === '' || isNaN(actualNum) || actualNum < 0) {
      setError(lang === 'vi' ? 'Vui lòng nhập số dư thực tế hợp lệ' : 'Please enter a valid actual balance')
      return
    }
    if (!hasDiff) {
      setError(lang === 'vi' ? 'Số dư thực tế trùng khớp với sổ sách, không cần điều chỉnh' : 'Actual balance matches recorded balance')
      return
    }

    const defaultReason =
      diff > 0
        ? (lang === 'vi'
            ? `Kiểm kê ${reconcileSource === 'cash' ? 'tiền mặt' : reconcileSource === 'account' ? 'tài khoản' : 'tiết kiệm'}: thặng dư +${formatMoney(diff, lang)}`
            : `Audit ${reconcileSource}: surplus +${formatMoney(diff, lang)}`)
        : (lang === 'vi'
            ? `Kiểm kê ${reconcileSource === 'cash' ? 'tiền mặt' : reconcileSource === 'account' ? 'tài khoản' : 'tiết kiệm'}: hao hụt -${formatMoney(Math.abs(diff), lang)}`
            : `Audit ${reconcileSource}: deficit -${formatMoney(Math.abs(diff), lang)}`)

    onReconcileBalance({
      source: reconcileSource,
      actualAmount: actualNum,
      diff,
      reason: reason.trim() || defaultReason,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border-theme shadow-modal p-3.5 sm:p-6 md:p-7 rounded-2xl md:rounded-3xl max-h-[82vh] md:max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header & Responsive Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-theme pb-3.5 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-theme-surface border border-theme flex items-center justify-center text-theme-accent shrink-0 shadow-2xs">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base md:text-lg font-bold text-theme-main">
                {t.networth_modal_title}
              </DialogTitle>
              <DialogDescription className="text-[11px] md:text-xs text-theme-muted">
                {t.networth_modal_sub}
              </DialogDescription>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-3 p-1 bg-theme-surface/80 rounded-xl border border-theme shrink-0 sm:w-96">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-theme-main shadow-xs border border-theme/80 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-theme-accent shrink-0" />
              <span className="truncate">{t.networth_tab_overview}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('initial')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'initial'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{t.networth_tab_initial}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reconcile')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'reconcile'
                  ? 'bg-white text-purple-700 shadow-xs border border-purple-200 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{t.networth_tab_reconcile}</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 pt-3 expense-scroll-container">
          {activeTab === 'overview' ? (
            /* TAB 1: OVERVIEW & ALLOCATION */
            <div className="space-y-4 md:space-y-5">
              {/* Balance Sheet Cards (KPIs) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl md:rounded-2xl bg-theme-surface/70 border border-theme space-y-1.5 hover:shadow-2xs transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {t.networth_total_assets}
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 hidden sm:block" />
                  </div>
                  <span className="font-mono text-xs sm:text-base md:text-xl font-bold text-theme-main block truncate">
                    {formatMoney(totalAssets, lang)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono hidden md:block">
                    {lang === 'vi' ? 'Tiền mặt + TK + Tiết kiệm' : 'Cash + Bank + Savings'}
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl md:rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-1.5 hover:shadow-2xs transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-amber-800 uppercase tracking-wider">
                      {t.networth_total_debt}
                    </span>
                    <CreditCard className="w-3.5 h-3.5 text-amber-700 hidden sm:block" />
                  </div>
                  <span className="font-mono text-xs sm:text-base md:text-xl font-bold text-amber-900 block truncate">
                    {formatMoney(totalDebt, lang)}
                  </span>
                  <span className="text-[10px] text-amber-700/80 font-mono hidden md:block">
                    {lang === 'vi' ? 'Các khoản nợ đang theo dõi' : 'Active tracked liabilities'}
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl md:rounded-2xl bg-emerald-50/80 border border-emerald-200/90 space-y-1.5 hover:shadow-2xs transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                      {t.networth_pure_worth}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 hidden sm:block" />
                  </div>
                  <span className="font-mono text-xs sm:text-base md:text-xl font-bold text-emerald-800 block truncate">
                    {formatMoney(netWorth, lang)}
                  </span>
                  <span className="text-[10px] text-emerald-700/80 font-mono hidden md:block">
                    {lang === 'vi' ? 'Tài sản thực (Tài sản - Nợ)' : 'Net assets (Assets - Debt)'}
                  </span>
                </div>
              </div>

              {/* Asset Allocation Breakdown */}
              <div className="p-4 sm:p-5 rounded-2xl border border-theme bg-white space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900 block">
                          {lang === 'vi' ? 'Cơ cấu phân bổ tài sản' : 'Asset Allocation Structure'}
                        </span>
                        <p className="text-[11px] text-zinc-500">
                          {lang === 'vi' ? 'Tỷ trọng giá trị theo từng nguồn tiền' : 'Value weight across each asset source'}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                        100%
                      </span>
                    </div>

                    {/* Stacked Bar */}
                    <div className="h-3.5 w-full rounded-full bg-zinc-100 overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${cashPercent}%` }}
                        className="bg-emerald-500 transition-all duration-500"
                        title={`Tiền mặt: ${cashPercent.toFixed(1)}%`}
                      />
                      <div
                        style={{ width: `${bankPercent}%` }}
                        className="bg-blue-500 transition-all duration-500"
                        title={`Tài khoản: ${bankPercent.toFixed(1)}%`}
                      />
                      <div
                        style={{ width: `${savingsPercent}%` }}
                        className="bg-amber-500 transition-all duration-500"
                        title={`Tiết kiệm: ${savingsPercent.toFixed(1)}%`}
                      />
                    </div>

                    {/* Detailed Breakdown Rows */}
                    <div className="space-y-2.5 pt-1">
                      {/* Cash */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                          <div className="w-8 h-8 rounded-lg bg-emerald-100/70 flex items-center justify-center text-emerald-700 shrink-0">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-800 block truncate">
                              {lang === 'vi' ? 'Tiền mặt' : 'Cash'}
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              {lang === 'vi' ? 'Ví cầm tay & tiền tiêu hàng ngày' : 'Wallet & daily cash'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-emerald-800 block">
                            {formatMoney(finances.cash, lang)}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {cashPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Bank Account */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100 hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                          <div className="w-8 h-8 rounded-lg bg-blue-100/70 flex items-center justify-center text-blue-700 shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-800 block truncate">
                              {lang === 'vi' ? 'Tiền tài khoản ngân hàng' : 'Bank Account'}
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              {lang === 'vi' ? 'Số dư thanh toán liên kết ngân hàng' : 'Linked checking / payment accounts'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-blue-800 block">
                            {formatMoney(finances.bankAccount, lang)}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {bankPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Savings */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100 hover:border-amber-200 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                          <div className="w-8 h-8 rounded-lg bg-amber-100/70 flex items-center justify-center text-amber-700 shrink-0">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-800 block truncate">
                              {lang === 'vi' ? 'Quỹ tiết kiệm' : 'Savings Vault'}
                            </span>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              {lang === 'vi' ? 'Khoản tích lũy dự phòng tài chính' : 'Emergency & long-term savings fund'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-amber-900 block">
                            {formatMoney(finances.currentSavings, lang)}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {savingsPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Opening Balances Explainer Banner */}
                    {initialBalances && (
                      <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2">
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-950">
                                {t.networth_initial_banner_text}
                              </span>
                              <span className="font-mono text-xs font-bold text-emerald-800">
                                {formatMoney(initialBalances.cash + initialBalances.bankAccount + initialBalances.savings, lang)}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700/90 truncate">
                              {lang === 'vi' 
                                ? `Tiền mặt: ${formatMoney(initialBalances.cash, lang)} • TK: ${formatMoney(initialBalances.bankAccount, lang)} • Tiết kiệm: ${formatMoney(initialBalances.savings, lang)}`
                                : `Cash: ${formatMoney(initialBalances.cash, lang)} • Bank: ${formatMoney(initialBalances.bankAccount, lang)} • Savings: ${formatMoney(initialBalances.savings, lang)}`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('initial')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shrink-0 cursor-pointer shadow-2xs transition-all text-center"
                        >
                          {t.networth_initial_banner_btn}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
          ) : activeTab === 'initial' ? (
            /* TAB 2: INITIAL BALANCES CONFIG */
            <form onSubmit={handleSaveInit} className="space-y-4">
              {/* Description Header */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-700" />
                    {t.networth_initial_title}
                  </span>
                  <button
                    type="button"
                    onClick={handleResetInitToZero}
                    disabled={isSavingInit}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 cursor-pointer transition-all shadow-2xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t.networth_initial_reset_zero}
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  {t.networth_initial_desc}
                </p>
              </div>

              {/* 3 Input cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cash */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800">{t.networth_initial_cash}</span>
                  </div>
                  <TouchpadField
                    value={initCash}
                    onChange={setInitCash}
                    lang={lang}
                    placeholder="0"
                    title={t.networth_initial_cash}
                    presets={[0, 1000000, 5000000, 10000000]}
                  />
                </div>

                {/* Bank Account */}
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800">{t.networth_initial_bank}</span>
                  </div>
                  <TouchpadField
                    value={initBank}
                    onChange={setInitBank}
                    lang={lang}
                    placeholder="0"
                    title={t.networth_initial_bank}
                    presets={[0, 5000000, 10000000, 20000000]}
                  />
                </div>

                {/* Savings */}
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800">{t.networth_initial_savings}</span>
                  </div>
                  <TouchpadField
                    value={initSavings}
                    onChange={setInitSavings}
                    lang={lang}
                    placeholder="0"
                    title={t.networth_initial_savings}
                    presets={[0, 10000000, 20000000, 50000000]}
                  />
                </div>
              </div>

              {/* Total Opening Balance Display */}
              <div className="p-3 rounded-xl bg-theme-surface/70 border border-theme flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-600">
                  {lang === 'vi' ? 'Tổng số dư ban đầu:' : 'Total Opening Balances:'}
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-theme-main">
                  {formatMoney(
                    (parseFloat(initCash.replace(/,/g, '.')) || 0) +
                    (parseFloat(initBank.replace(/,/g, '.')) || 0) +
                    (parseFloat(initSavings.replace(/,/g, '.')) || 0),
                    lang
                  )}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-theme/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-theme text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer transition-all"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSavingInit}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{isSavingInit ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : t.networth_initial_save_btn}</span>
                </button>
              </div>
            </form>
          ) : (
            /* TAB 3: RECONCILE / BALANCE ADJUSTMENT */
            <form onSubmit={handleReconcileSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5">
                {/* Left Column: Source Selector (5 cols on md+) */}
                <div className="md:col-span-5 space-y-2.5 sm:space-y-3.5">
                  {/* 1. Choose Source: Vertical rich cards on Desktop, compact horizontal cards on Mobile */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[11px] sm:text-xs font-bold text-zinc-800 block">
                      {t.networth_reconcile_source}
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-1 gap-1.5 sm:gap-2">
                      {/* Cash Card */}
                      <button
                        type="button"
                        onClick={() => setReconcileSource('cash')}
                        className={`p-2 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-1 sm:gap-1.5 ${
                          reconcileSource === 'cash'
                            ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-400/40'
                            : 'border-theme bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            reconcileSource === 'cash' ? 'bg-emerald-200/80 text-emerald-800' : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] sm:text-xs font-semibold block truncate">
                              {lang === 'vi' ? 'Tiền mặt' : 'Cash'}
                            </span>
                            <span className="text-[10px] text-zinc-400 hidden md:block">
                              {lang === 'vi' ? 'Ví cá nhân & tiền mặt' : 'Physical wallet cash'}
                            </span>
                          </div>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                          <span className="font-mono text-[11px] sm:text-xs font-bold text-emerald-800 block">
                            {formatMoney(finances.cash, lang)}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono hidden md:block">
                            {lang === 'vi' ? 'Sổ sách' : 'Recorded'}
                          </span>
                        </div>
                      </button>

                      {/* Bank Account Card */}
                      <button
                        type="button"
                        onClick={() => setReconcileSource('account')}
                        className={`p-2 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-1 sm:gap-1.5 ${
                          reconcileSource === 'account'
                            ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-bold shadow-xs ring-1 ring-blue-400/40'
                            : 'border-theme bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            reconcileSource === 'account' ? 'bg-blue-200/80 text-blue-800' : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] sm:text-xs font-semibold block truncate">
                              {lang === 'vi' ? 'Tài khoản' : 'Bank'}
                            </span>
                            <span className="text-[10px] text-zinc-400 hidden md:block">
                              {lang === 'vi' ? 'Tài khoản ngân hàng' : 'Checking account'}
                            </span>
                          </div>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                          <span className="font-mono text-[11px] sm:text-xs font-bold text-blue-800 block">
                            {formatMoney(finances.bankAccount, lang)}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono hidden md:block">
                            {lang === 'vi' ? 'Sổ sách' : 'Recorded'}
                          </span>
                        </div>
                      </button>

                      {/* Savings Card */}
                      <button
                        type="button"
                        onClick={() => setReconcileSource('savings')}
                        className={`p-2 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-1.5 ${
                          reconcileSource === 'savings'
                            ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold shadow-xs ring-1 ring-amber-400/40'
                            : 'border-theme bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            reconcileSource === 'savings' ? 'bg-amber-200/80 text-amber-800' : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] sm:text-xs font-semibold block truncate">
                              {lang === 'vi' ? 'Tiết kiệm' : 'Savings'}
                            </span>
                            <span className="text-[10px] text-zinc-400 hidden md:block">
                              {lang === 'vi' ? 'Quỹ tích lũy' : 'Savings fund'}
                            </span>
                          </div>
                        </div>
                        <div className="text-left md:text-right shrink-0">
                          <span className="font-mono text-[11px] sm:text-xs font-bold text-amber-900 block">
                            {formatMoney(finances.currentSavings, lang)}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono hidden md:block">
                            {lang === 'vi' ? 'Sổ sách' : 'Recorded'}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Reconciliation Audit Form (7 cols on md+) */}
                <div className="md:col-span-7 space-y-2.5 sm:space-y-3.5">
                  <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-theme bg-white space-y-2.5 sm:space-y-4 shadow-2xs">
                    {/* Active Source Title & Current Recorded Balance */}
                    <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-theme-surface/70 border border-theme flex items-center justify-between">
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                          {t.networth_current_recorded}
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold text-zinc-800">
                          {reconcileSource === 'cash'
                            ? (lang === 'vi' ? 'Tiền mặt trong ví' : 'Cash in Wallet')
                            : reconcileSource === 'account'
                            ? (lang === 'vi' ? 'Số dư ngân hàng' : 'Bank Balance')
                            : (lang === 'vi' ? 'Quỹ tiết kiệm' : 'Savings Vault')}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-zinc-900 text-sm sm:text-lg">
                        {formatMoney(currentBookBalance, lang)}
                      </span>
                    </div>

                    {error && (
                      <div className="p-2 sm:p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Actual Counted Balance Input */}
                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] sm:text-xs font-bold text-zinc-800 block">
                          {t.networth_actual_counted} <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[9px] sm:text-[10px] text-zinc-400 font-mono">
                          {lang === 'vi' ? 'Số đếm thực tế' : 'Counted amount'}
                        </span>
                      </div>
                      <TouchpadField
                        value={actualAmountStr}
                        onChange={(val) => {
                          setActualAmountStr(val)
                          setError(null)
                        }}
                        lang={lang}
                        placeholder="VD: 5250000"
                        title={t.networth_actual_counted}
                        presets={[500000, 1000000, 2000000, 5000000, 10000000]}
                      />
                    </div>

                    {/* Real-time Discrepancy Indicator */}
                    <div
                      className={`p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border flex items-center justify-between text-xs transition-all ${
                        diff > 0
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                          : diff < 0
                          ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        {diff !== 0 ? (
                          <Scale className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-[11px] sm:text-xs block truncate">{t.networth_diff_label}:</span>
                          <span className="text-[10px] text-zinc-500 font-sans hidden sm:block truncate">
                            {diff > 0
                              ? (lang === 'vi' ? 'Ghi nhận khoản thặng dư vào sổ cái (+)' : 'Will record surplus into ledger (+)')
                              : diff < 0
                              ? (lang === 'vi' ? 'Ghi nhận khoản hao hụt vào sổ cái (-)' : 'Will record deficit into ledger (-)')
                              : (lang === 'vi' ? 'Số liệu hoàn toàn khớp' : 'Balances perfectly match')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold shrink-0 ml-2">
                        {diff > 0 ? (
                          <span className="text-emerald-700 text-xs sm:text-base">+{formatMoney(diff, lang)} <span className="text-[10px] sm:text-xs font-sans">({t.networth_surplus})</span></span>
                        ) : diff < 0 ? (
                          <span className="text-rose-700 text-xs sm:text-base">-{formatMoney(Math.abs(diff), lang)} <span className="text-[10px] sm:text-xs font-sans">({t.networth_deficit})</span></span>
                        ) : (
                          <span className="text-zinc-500 text-xs">{t.networth_matched}</span>
                        )}
                      </div>
                    </div>

                    {/* Reason for adjustment */}
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-[11px] sm:text-xs font-bold text-zinc-800 block">
                        {t.networth_reason_label}
                      </label>
                      <Input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t.networth_reason_placeholder}
                        className="text-xs sm:text-sm h-8 sm:h-10 border-theme bg-white"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1.5 sm:pt-2 flex justify-end gap-2 sm:gap-2.5 border-t border-theme/60">
                      <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-theme text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer transition-all"
                      >
                        {t.btn_cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={!hasDiff}
                        className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{t.networth_confirm_btn}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-theme/60 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-1.5 rounded-lg border border-theme text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 cursor-pointer shadow-2xs transition-all"
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
