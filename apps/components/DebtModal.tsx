'use client'

import React, { useState, useEffect } from 'react'
import { LanguageType, DebtItem, FinancialState, DebtType } from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import { getClientLocalDateString } from '@/lib/time'
import { Input } from '@/components/ui/input'
import { TouchpadField } from './TouchpadField'
import {
  X,
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  Banknote,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Coins,
} from 'lucide-react'

interface DebtModalProps {
  isOpen: boolean
  onClose: () => void
  debts: DebtItem[]
  lang: LanguageType
  onAddDebt: (debt: Omit<DebtItem, 'id'>) => void
  onDeleteDebt: (id: string) => void
  onPayDebt?: (params: {
    debtId: string
    debtTitle: string
    amount: number
    source: 'cash' | 'account'
    note?: string
  }) => void
  onCollectDebt?: (params: {
    debtId: string
    debtTitle: string
    amount: number
    source: 'cash' | 'account'
    note?: string
  }) => void
  finances?: FinancialState
}

export function DebtModal({
  isOpen,
  onClose,
  debts,
  lang,
  onAddDebt,
  onDeleteDebt,
  onPayDebt,
  onCollectDebt,
  finances,
}: DebtModalProps) {
  const t = dictionary[lang]

  // Tab filter: 'all' | 'payable' | 'receivable'
  const [activeTab, setActiveTab] = useState<'all' | 'payable' | 'receivable'>('all')

  // Add Debt Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [addType, setAddType] = useState<DebtType>('payable')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [creditor, setCreditor] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => getClientLocalDateString())
  const [error, setError] = useState<string | null>(null)

  // Pay Debt Form State (Tôi nợ người khác -> Chi trả)
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null)
  const [payAmountStr, setPayAmountStr] = useState('')
  const [paySource, setPaySource] = useState<'cash' | 'account'>('account')
  const [payNote, setPayNote] = useState('')
  const [payError, setPayError] = useState<string | null>(null)

  // Collect Debt Form State (Người khác nợ tôi -> Thu nợ / Tất toán)
  const [collectingDebt, setCollectingDebt] = useState<DebtItem | null>(null)
  const [collectAmountStr, setCollectAmountStr] = useState('')
  const [collectSource, setCollectSource] = useState<'cash' | 'account'>('account')
  const [collectNote, setCollectNote] = useState('')
  const [collectError, setCollectError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (payingDebt) {
          setPayingDebt(null)
        } else if (collectingDebt) {
          setCollectingDebt(null)
        } else if (showAddForm) {
          setShowAddForm(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, payingDebt, collectingDebt, showAddForm])

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setDate(getClientLocalDateString())
      setPayingDebt(null)
      setPayError(null)
      setCollectingDebt(null)
      setCollectError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Computations
  const payableDebts = debts.filter((d) => !d.type || d.type === 'payable')
  const receivableDebts = debts.filter((d) => d.type === 'receivable')
  const totalPayable = payableDebts.reduce((sum, d) => sum + d.amount, 0)
  const totalReceivable = receivableDebts.reduce((sum, d) => sum + d.amount, 0)

  const displayedDebts = debts.filter((d) => {
    if (activeTab === 'payable') return !d.type || d.type === 'payable'
    if (activeTab === 'receivable') return d.type === 'receivable'
    return true
  })

  const numAmount = parseFloat(amount.replace(/,/g, '.')) || 0

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError(lang === 'vi' ? 'Vui lòng nhập mô tả khoản nợ' : 'Please enter a debt description')
      return
    }
    if (!numAmount || numAmount <= 0) {
      setError(lang === 'vi' ? 'Vui lòng nhập số tiền nợ hợp lệ' : 'Please enter a valid debt amount')
      return
    }

    onAddDebt({
      title: title.trim(),
      amount: numAmount,
      date: date || getClientLocalDateString(),
      creditor: creditor.trim() || undefined,
      note: note.trim() || undefined,
      type: addType,
    })

    // Reset form
    setTitle('')
    setAmount('')
    setCreditor('')
    setNote('')
    setError(null)
    setShowAddForm(false)
  }

  // Pay Debt handlers (Tôi nợ -> Trả)
  const handleOpenPay = (item: DebtItem) => {
    setPayingDebt(item)
    setCollectingDebt(null)
    setPayAmountStr(item.amount.toString())
    setPaySource('account')
    setPayNote(lang === 'vi' ? `Trả nợ: ${item.title}` : `Repay: ${item.title}`)
    setPayError(null)
    setShowAddForm(false)
  }

  const numPayAmount = parseFloat(payAmountStr.replace(/,/g, '.')) || 0
  const availablePayBalance = finances
    ? paySource === 'cash'
      ? finances.cash
      : finances.bankAccount
    : Infinity

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingDebt) return

    if (!numPayAmount || numPayAmount <= 0) {
      setPayError(lang === 'vi' ? 'Vui lòng nhập số tiền thanh toán hợp lệ' : 'Please enter a valid payment amount')
      return
    }

    if (numPayAmount > payingDebt.amount) {
      setPayError(
        lang === 'vi'
          ? `Số tiền trả (${formatMoney(numPayAmount, lang)}) vượt quá số nợ còn lại (${formatMoney(payingDebt.amount, lang)})`
          : 'Payment amount exceeds debt balance'
      )
      return
    }

    if (finances && numPayAmount > availablePayBalance) {
      setPayError(
        lang === 'vi'
          ? `Số dư ${paySource === 'cash' ? 'tiền mặt' : 'tài khoản'} không đủ (${formatMoney(availablePayBalance, lang)})`
          : 'Insufficient account balance'
      )
      return
    }

    if (onPayDebt) {
      onPayDebt({
        debtId: payingDebt.id,
        debtTitle: payingDebt.title,
        amount: numPayAmount,
        source: paySource,
        note: payNote.trim(),
      })
    }

    setPayingDebt(null)
  }

  // Collect Debt handlers (Người khác nợ -> Thu nợ / Tất toán)
  const handleOpenCollect = (item: DebtItem) => {
    setCollectingDebt(item)
    setPayingDebt(null)
    setCollectAmountStr(item.amount.toString())
    setCollectSource('account')
    setCollectNote(lang === 'vi' ? `Thu nợ: ${item.title}` : `Collect: ${item.title}`)
    setCollectError(null)
    setShowAddForm(false)
  }

  const numCollectAmount = parseFloat(collectAmountStr.replace(/,/g, '.')) || 0

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!collectingDebt) return

    if (!numCollectAmount || numCollectAmount <= 0) {
      setCollectError(lang === 'vi' ? 'Vui lòng nhập số tiền thu nợ hợp lệ' : 'Please enter a valid collection amount')
      return
    }

    if (numCollectAmount > collectingDebt.amount) {
      setCollectError(
        lang === 'vi'
          ? `Số tiền thu (${formatMoney(numCollectAmount, lang)}) vượt quá số nợ cần thu (${formatMoney(collectingDebt.amount, lang)})`
          : 'Collection amount exceeds receivable balance'
      )
      return
    }

    if (onCollectDebt) {
      onCollectDebt({
        debtId: collectingDebt.id,
        debtTitle: collectingDebt.title,
        amount: numCollectAmount,
        source: collectSource,
        note: collectNote.trim(),
      })
    }

    setCollectingDebt(null)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-theme-card border border-theme w-full max-w-lg sm:max-w-xl md:max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-theme/70 bg-theme-surface/60 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-xs shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-theme-main truncate">
                {t.debt_modal_title}
              </h2>
              <p className="text-[10px] text-theme-muted truncate">{t.debt_modal_sub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-surface border border-transparent hover:border-theme transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Total Debt Summary Banner */}
        <div className="p-2.5 sm:p-4 bg-theme-surface/50 border-b border-theme/70 grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
          {/* Box 1: Tôi nợ người khác */}
          <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-300/60 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-900 truncate">
                {t.debt_total_payable_label}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300 shrink-0">
                {payableDebts.length}
              </span>
            </div>
            <span className="font-mono text-base sm:text-lg font-bold text-amber-900 block truncate">
              {formatMoney(totalPayable, lang)}
            </span>
          </div>

          {/* Box 2: Người khác nợ tôi */}
          <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-300/60 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 truncate">
                {t.debt_total_receivable_label}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 border border-emerald-300 shrink-0">
                {receivableDebts.length}
              </span>
            </div>
            <span className="font-mono text-base sm:text-lg font-bold text-emerald-700 block truncate">
              {formatMoney(totalReceivable, lang)}
            </span>
          </div>
        </div>

        {/* Content Body: Scrollable Debt List + Add Section + Pay/Collect Drawer */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-3.5 overflow-y-auto overflow-x-hidden flex-1 expense-scroll-container">
          {/* Filter Tabs & Add Button Row */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            {/* Filter Tabs */}
            <div className="p-1 bg-theme-surface rounded-xl flex items-center gap-1 border border-theme shrink-0 text-xs">
              <button
                type="button"
                data-active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                className={`debt-tab-btn px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'debt-tab-active bg-theme-card text-theme-main font-bold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {t.debt_tab_all} ({debts.length})
              </button>
              <button
                type="button"
                data-active={activeTab === 'payable'}
                onClick={() => setActiveTab('payable')}
                className={`debt-tab-btn px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'payable'
                    ? 'debt-tab-active bg-theme-card text-amber-500 font-bold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {t.debt_tab_payable} ({payableDebts.length})
              </button>
              <button
                type="button"
                data-active={activeTab === 'receivable'}
                onClick={() => setActiveTab('receivable')}
                className={`debt-tab-btn px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'receivable'
                    ? 'debt-tab-active bg-theme-card text-emerald-500 font-bold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {t.debt_tab_receivable} ({receivableDebts.length})
              </button>
            </div>

            {/* Toggle Add Form Button */}
            <button
              type="button"
              onClick={() => {
                setShowAddForm((prev) => !prev)
                setPayingDebt(null)
                setCollectingDebt(null)
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap ${
                showAddForm
                  ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                  : 'btn-theme-gradient text-white hover:opacity-95'
              }`}
            >
              {showAddForm ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Đóng form' : 'Close form'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.debt_add_title}</span>
                </>
              )}
            </button>
          </div>

          {/* Inline Add Debt Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddSubmit}
              className="p-3.5 rounded-xl bg-theme-surface/80 border border-theme space-y-3 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-theme/60 pb-2">
                <span className="text-xs font-bold text-theme-main flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-theme-accent" />
                  {t.debt_add_title}
                </span>
              </div>

              {error && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Debt Type Switcher: Tôi nợ vs Người khác nợ */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-theme-main block">
                  {t.debt_type_label} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                    type="button"
                    data-active={addType === 'payable'}
                    onClick={() => setAddType('payable')}
                    className={`debt-type-btn p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      addType === 'payable'
                        ? 'debt-type-active border-amber-500 bg-amber-500/10 text-amber-500 font-bold shadow-xs ring-1 ring-amber-400'
                        : 'border-theme bg-theme-surface text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs block leading-tight">{t.debt_type_payable}</span>
                      <span className="text-[10px] text-zinc-500 block truncate">{t.debt_type_payable_desc}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-active={addType === 'receivable'}
                    onClick={() => setAddType('receivable')}
                    className={`debt-type-btn p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      addType === 'receivable'
                        ? 'debt-type-active border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-400'
                        : 'border-theme bg-theme-surface text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs block leading-tight">{t.debt_type_receivable}</span>
                      <span className="text-[10px] text-zinc-500 block truncate">{t.debt_type_receivable_desc}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Debt Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-theme-main block">
                  {t.debt_input_desc} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder={
                    addType === 'payable'
                      ? t.debt_input_desc_ph
                      : lang === 'vi'
                      ? 'VD: Cho bạn vay tiền, Tiền đặt cọc, Ứng tiền công việc...'
                      : 'E.g., Lent to friend, Rental deposit, Work advance...'
                  }
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setError(null)
                  }}
                  className="text-xs h-9 bg-theme-surface border-theme"
                />
              </div>

              {/* Debt Amount (Touchpad) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-theme-main block">
                  {t.debt_input_amount} <span className="text-rose-500">*</span>
                </label>
                <TouchpadField
                  value={amount}
                  onChange={(val) => {
                    setAmount(val)
                    setError(null)
                  }}
                  lang={lang}
                  placeholder={t.debt_input_amount_ph}
                  title={t.debt_input_amount}
                  presets={[500000, 1000000, 2000000, 5000000, 10000000]}
                />
              </div>

              {/* Creditor / Debtor & Date (2 columns) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-theme-main block">
                    {addType === 'payable' ? t.debt_input_creditor : t.debt_input_debtor}
                  </label>
                  <Input
                    type="text"
                    placeholder={addType === 'payable' ? t.debt_input_creditor_ph : t.debt_input_debtor_ph}
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    className="text-xs h-9 bg-theme-surface border-theme"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-theme-main block">
                    {lang === 'vi' ? 'Ngày ghi nhận' : 'Date recorded'}
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-xs h-9 bg-theme-surface border-theme cursor-pointer w-full max-w-full min-w-0"
                  />
                </div>
              </div>

              {/* Optional Note */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-theme-main block">
                  {t.debt_input_note}
                </label>
                <Input
                  type="text"
                  placeholder={lang === 'vi' ? 'VD: Kỳ hạn trả, ghi chú thỏa thuận...' : 'E.g., Due date, terms...'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="text-xs h-9 bg-theme-surface border-theme"
                />
              </div>

              {/* Submit Add Debt Button */}
              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-theme text-xs font-medium text-theme-muted bg-theme-surface hover:bg-theme-surface/80 cursor-pointer"
                >
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg btn-theme-gradient text-white text-xs font-semibold shadow-xs hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.debt_add_btn}</span>
                </button>
              </div>
            </form>
          )}

          {/* Inline Pay Debt Form (Trả nợ khoản mình nợ) */}
          {payingDebt && (
            <form
              onSubmit={handlePaySubmit}
              className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300/80 space-y-3 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-amber-700" />
                  {t.debt_pay_title}: <span className="underline">{payingDebt.title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {payError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Payment Source */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-amber-900 block">
                  {t.debt_pay_source_label}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-active={paySource === 'account'}
                    onClick={() => setPaySource('account')}
                    className={`debt-source-card p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      paySource === 'account'
                        ? 'debt-source-active border-blue-500 bg-blue-500/10 text-blue-400 font-bold shadow-xs'
                        : 'border-amber-500/30 bg-theme-surface text-zinc-400'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs block leading-tight">{lang === 'vi' ? 'Tài khoản' : 'Bank'}</span>
                      {finances && (
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          {formatMoney(finances.bankAccount, lang)}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    data-active={paySource === 'cash'}
                    onClick={() => setPaySource('cash')}
                    className={`debt-source-card p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      paySource === 'cash'
                        ? 'debt-source-active border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow-xs'
                        : 'border-amber-500/30 bg-theme-surface text-zinc-400'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs block leading-tight">{lang === 'vi' ? 'Tiền mặt' : 'Cash'}</span>
                      {finances && (
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          {formatMoney(finances.cash, lang)}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-500 block">
                    {t.debt_pay_amount_label} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {lang === 'vi' ? 'Nợ hiện tại: ' : 'Current debt: '}
                    <span className="font-bold text-amber-400">{formatMoney(payingDebt.amount, lang)}</span>
                  </span>
                </div>
                <TouchpadField
                  value={payAmountStr}
                  onChange={(val) => {
                    setPayAmountStr(val)
                    setPayError(null)
                  }}
                  lang={lang}
                  placeholder="VD: 500000"
                  title={t.debt_pay_amount_label}
                  max={payingDebt.amount}
                  presets={[500000, 1000000, 2000000]}
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {[500000, 1000000, 2000000].map((preset) => {
                    if (preset > payingDebt.amount) return null
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setPayAmountStr(preset.toString())
                          setPayError(null)
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/40 bg-theme-surface text-amber-400 hover:bg-theme-surface/80 cursor-pointer"
                      >
                        +{preset >= 1000000 ? `${preset / 1000000}M` : preset.toLocaleString()}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmountStr(payingDebt.amount.toString())
                      setPayError(null)
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/60 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                  >
                    {lang === 'vi' ? 'Trả hết (100%)' : 'Pay All (100%)'}
                  </button>
                </div>
              </div>

              {/* Real-time Remaining Debt Preview */}
              {numPayAmount > 0 && numPayAmount <= payingDebt.amount && (
                <div className="p-2.5 rounded-lg bg-theme-surface border border-amber-500/40 text-xs font-mono flex items-center justify-between">
                  <span className="text-zinc-400">{t.debt_pay_remaining_after}:</span>
                  <span className="font-bold text-amber-400">
                    {formatMoney(Math.max(0, payingDebt.amount - numPayAmount), lang)}
                  </span>
                </div>
              )}

              {/* Note Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-amber-500 block">
                  {t.note_label}
                </label>
                <Input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="text-xs h-8 bg-theme-surface border-amber-500/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex justify-end gap-2 border-t border-amber-500/30">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="px-3 py-1.5 rounded-lg border border-amber-500/40 text-xs font-medium text-zinc-300 bg-theme-surface hover:bg-theme-surface/80 cursor-pointer"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.debt_pay_confirm_btn}</span>
                </button>
              </div>
            </form>
          )}

          {/* Inline Collect Debt Form (Người khác nợ -> Thu nợ / Tất toán cộng vào Thu nhập) */}
          {collectingDebt && (
            <form
              onSubmit={handleCollectSubmit}
              className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-300/80 space-y-3 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-700" />
                  {t.debt_collect_title}: <span className="underline">{collectingDebt.title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCollectingDebt(null)}
                  className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {collectError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{collectError}</span>
                </div>
              )}

              {/* Destination Wallet */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-emerald-950 block">
                  {t.debt_collect_source_label} ({lang === 'vi' ? 'Cộng vào số dư' : 'Added to balance'})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-active={collectSource === 'account'}
                    onClick={() => setCollectSource('account')}
                    className={`debt-source-card p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      collectSource === 'account'
                        ? 'debt-source-active border-blue-500 bg-blue-500/10 text-blue-400 font-bold shadow-xs ring-1 ring-blue-400'
                        : 'border-emerald-500/30 bg-theme-surface text-zinc-400'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs block leading-tight">{lang === 'vi' ? 'Tài khoản' : 'Bank'}</span>
                      {finances && (
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          {formatMoney(finances.bankAccount, lang)}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    data-active={collectSource === 'cash'}
                    onClick={() => setCollectSource('cash')}
                    className={`debt-source-card p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      collectSource === 'cash'
                        ? 'debt-source-active border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow-xs ring-1 ring-emerald-400'
                        : 'border-emerald-500/30 bg-theme-surface text-zinc-400'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs block leading-tight">{lang === 'vi' ? 'Tiền mặt' : 'Cash'}</span>
                      {finances && (
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          {formatMoney(finances.cash, lang)}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Collection Amount Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-emerald-500 block">
                    {t.debt_collect_amount_label} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {lang === 'vi' ? 'Cần thu: ' : 'Receivable: '}
                    <span className="font-bold text-emerald-400">{formatMoney(collectingDebt.amount, lang)}</span>
                  </span>
                </div>
                <TouchpadField
                  value={collectAmountStr}
                  onChange={(val) => {
                    setCollectAmountStr(val)
                    setCollectError(null)
                  }}
                  lang={lang}
                  placeholder="VD: 500000"
                  title={t.debt_collect_amount_label}
                  max={collectingDebt.amount}
                  presets={[500000, 1000000, 2000000]}
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {[500000, 1000000, 2000000].map((preset) => {
                    if (preset > collectingDebt.amount) return null
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setCollectAmountStr(preset.toString())
                          setCollectError(null)
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40 bg-theme-surface text-emerald-400 hover:bg-theme-surface/80 cursor-pointer"
                      >
                        +{preset >= 1000000 ? `${preset / 1000000}M` : preset.toLocaleString()}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setCollectAmountStr(collectingDebt.amount.toString())
                      setCollectError(null)
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/60 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                  >
                    {lang === 'vi' ? 'Thu hết (100%)' : 'Collect All (100%)'}
                  </button>
                </div>
              </div>

              {/* Real-time Remaining Receivable Preview */}
              {numCollectAmount > 0 && numCollectAmount <= collectingDebt.amount && (
                <div className="p-2.5 rounded-lg bg-theme-surface border border-emerald-500/40 text-xs font-mono flex items-center justify-between">
                  <span className="text-zinc-400">{t.debt_collect_remaining_after}:</span>
                  <span className="font-bold text-emerald-400">
                    {formatMoney(Math.max(0, collectingDebt.amount - numCollectAmount), lang)}
                  </span>
                </div>
              )}

              {/* Note Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-emerald-500 block">
                  {t.note_label}
                </label>
                <Input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="text-xs h-8 bg-theme-surface border-emerald-500/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex justify-end gap-2 border-t border-emerald-500/30">
                <button
                  type="button"
                  onClick={() => setCollectingDebt(null)}
                  className="px-3 py-1.5 rounded-lg border border-emerald-500/40 text-xs font-medium text-zinc-300 bg-theme-surface hover:bg-theme-surface/80 cursor-pointer"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.debt_collect_confirm_btn}</span>
                </button>
              </div>
            </form>
          )}

          {/* Scrollable Debt List Container - shown when not adding or paying/collecting */}
          {!showAddForm && !payingDebt && !collectingDebt && (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto overscroll-contain pr-1 sm:pr-1.5 expense-scroll-container">
              {displayedDebts.length === 0 ? (
                <div className="p-8 text-center bg-theme-surface/40 rounded-xl border border-theme border-dashed space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs text-zinc-600 font-medium">
                    {activeTab === 'all'
                      ? t.debt_empty
                      : activeTab === 'payable'
                      ? (lang === 'vi' ? 'Bạn không có khoản nợ nào cần trả.' : 'No payable debts.')
                      : (lang === 'vi' ? 'Bạn không có khoản nợ nào cần thu hồi.' : 'No receivable debts.')}
                  </p>
                </div>
              ) : (
                displayedDebts.map((item) => {
                  const isReceivable = item.type === 'receivable'
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border bg-theme-card transition-all flex items-start justify-between gap-3 group ${
                        isReceivable
                          ? 'border-emerald-200/60 hover:border-emerald-400 hover:shadow-2xs'
                          : 'border-theme hover:border-amber-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                      {/* Title, Badge & Creditor/Debtor */}
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                            isReceivable
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isReceivable ? (
                            <>
                              <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{t.debt_type_receivable_short}</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-2.5 h-2.5 text-amber-600" />
                              <span>{t.debt_type_payable_short}</span>
                            </>
                          )}
                        </span>

                        <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                          {item.title}
                        </span>

                        {item.creditor && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200 inline-flex items-center gap-1">
                            {isReceivable ? <User className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                            <span>{item.creditor}</span>
                          </span>
                        )}
                      </div>

                      {/* Date and Note */}
                      <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] text-zinc-400 font-mono flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-theme-accent" />
                          <span>{item.date}</span>
                        </span>
                        {item.note && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-600 font-sans italic">{item.note}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side: Amount, Pay/Collect Action and Delete Action */}
                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      <span
                        className={`font-mono text-xs sm:text-sm font-bold ${
                          isReceivable ? 'text-emerald-700' : 'text-amber-900'
                        }`}
                      >
                        {formatMoney(item.amount, lang)}
                      </span>

                      {/* Pay or Collect Button */}
                      {isReceivable ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCollect(item)}
                          title={lang === 'vi' ? 'Thu nợ / Tất toán khoản này' : 'Collect / Settle this debt'}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer active:opacity-60"
                        >
                          <Coins className="w-3 h-3 text-emerald-700" />
                          <span>{t.debt_btn_collect}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenPay(item)}
                          title={lang === 'vi' ? 'Thanh toán khoản nợ này' : 'Pay off this debt'}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer active:opacity-60"
                        >
                          <Banknote className="w-3 h-3 text-amber-700" />
                          <span>{t.debt_btn_pay}</span>
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => onDeleteDebt(item.id)}
                        title={t.debt_delete_tooltip}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer touch-target active:opacity-60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-theme-surface/50 border-t border-theme/60 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-theme-muted font-mono truncate mr-2">
            {lang === 'vi' ? 'Đồng bộ tự động cùng Sổ cái & Chi tiêu' : 'Synchronized with Ledger & Expenses'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-theme text-xs font-semibold text-theme-main bg-theme-surface hover:bg-theme-surface/80 transition-colors cursor-pointer shrink-0"
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
