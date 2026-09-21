'use client'

import React, { useState, useEffect } from 'react'
import { LanguageType, DebtItem, FinancialState } from '@/lib/types'
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
  finances,
}: DebtModalProps) {
  const t = dictionary[lang]

  // Add Debt Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [creditor, setCreditor] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => getClientLocalDateString())
  const [error, setError] = useState<string | null>(null)

  // Pay Debt Form State
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null)
  const [payAmountStr, setPayAmountStr] = useState('')
  const [paySource, setPaySource] = useState<'cash' | 'account'>('account')
  const [payNote, setPayNote] = useState('')
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (payingDebt) {
          setPayingDebt(null)
        } else if (showAddForm) {
          setShowAddForm(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, payingDebt, showAddForm])

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setDate(getClientLocalDateString())
      setPayingDebt(null)
      setPayError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const totalDebt = debts.reduce((sum, d) => sum + d.amount, 0)
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
    })

    // Reset form
    setTitle('')
    setAmount('')
    setCreditor('')
    setNote('')
    setError(null)
    setShowAddForm(false)
  }

  // Pay Debt handlers
  const handleOpenPay = (item: DebtItem) => {
    setPayingDebt(item)
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white border border-theme w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme/70 bg-theme-surface/60 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-xs shrink-0">
              <CreditCard className="w-5 h-5" />
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

        {/* Total Debt Summary Banner */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-200/80 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/70 block">
              {t.debt_total_label}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-amber-900">
              {formatMoney(totalDebt, lang)}
            </span>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200/80 text-amber-900 border border-amber-300">
              {debts.length} {t.debt_count_label}
            </span>
          </div>
        </div>

        {/* Content Body: Scrollable Debt List + Add Section + Pay Drawer */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 expense-scroll-container">
          {/* Action Row: Toggle Add Form */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              {lang === 'vi' ? 'Các khoản nợ hiện tại' : 'Active Debt Records'}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowAddForm((prev) => !prev)
                setPayingDebt(null)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
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

              {/* Debt Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-theme-main block">
                  {t.debt_input_desc} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder={t.debt_input_desc_ph}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setError(null)
                  }}
                  className="text-xs h-9 bg-white border-theme"
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

              {/* Creditor & Date (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-theme-main block">
                    {t.debt_input_creditor}
                  </label>
                  <Input
                    type="text"
                    placeholder={t.debt_input_creditor_ph}
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    className="text-xs h-9 bg-white border-theme"
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
                    className="text-xs h-9 bg-white border-theme cursor-pointer"
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
                  className="text-xs h-9 bg-white border-theme"
                />
              </div>

              {/* Submit Add Debt Button */}
              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-theme text-xs font-medium text-zinc-600 bg-white hover:bg-zinc-50 cursor-pointer"
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

          {/* Inline Pay Debt Form */}
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

              {/* 1. Payment Source */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-amber-900 block">
                  {t.debt_pay_source_label}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaySource('account')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      paySource === 'account'
                        ? 'border-blue-500 bg-white text-blue-900 font-bold shadow-xs'
                        : 'border-amber-200 bg-amber-100/40 text-zinc-600'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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
                    onClick={() => setPaySource('cash')}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      paySource === 'cash'
                        ? 'border-emerald-500 bg-white text-emerald-900 font-bold shadow-xs'
                        : 'border-amber-200 bg-amber-100/40 text-zinc-600'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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

              {/* 2. Payment Amount Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-900 block">
                    {t.debt_pay_amount_label} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {lang === 'vi' ? 'Nợ hiện tại: ' : 'Current debt: '}
                    <span className="font-bold text-amber-900">{formatMoney(payingDebt.amount, lang)}</span>
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
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 cursor-pointer"
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
                    className="text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-400 bg-amber-200 text-amber-950 hover:bg-amber-300 cursor-pointer"
                  >
                    {lang === 'vi' ? 'Trả hết (100%)' : 'Pay All (100%)'}
                  </button>
                </div>
              </div>

              {/* 3. Real-time Remaining Debt Preview */}
              {numPayAmount > 0 && numPayAmount <= payingDebt.amount && (
                <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200 text-xs font-mono flex items-center justify-between">
                  <span className="text-zinc-600">{t.debt_pay_remaining_after}:</span>
                  <span className="font-bold text-amber-900">
                    {formatMoney(Math.max(0, payingDebt.amount - numPayAmount), lang)}
                  </span>
                </div>
              )}

              {/* 4. Note Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-amber-900 block">
                  {t.note_label}
                </label>
                <Input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="text-xs h-8 bg-white border-amber-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex justify-end gap-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 cursor-pointer"
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

          {/* Scrollable Debt List Container */}
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto overscroll-contain pr-1 sm:pr-1.5 expense-scroll-container">
            {debts.length === 0 ? (
              <div className="p-8 text-center bg-theme-surface/40 rounded-xl border border-theme border-dashed space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs text-zinc-600 font-medium">{t.debt_empty}</p>
              </div>
            ) : (
              debts.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-theme bg-white hover:border-amber-300 hover:shadow-2xs transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Title & Creditor */}
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs sm:text-sm font-semibold text-zinc-900">
                        {item.title}
                      </span>
                      {item.creditor && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" />
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

                  {/* Right side: Amount, Pay Action and Delete Action */}
                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-amber-900">
                      {formatMoney(item.amount, lang)}
                    </span>

                    {/* Pay button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPay(item)}
                      title={lang === 'vi' ? 'Thanh toán khoản nợ này' : 'Pay off this debt'}
                      className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer active:opacity-60"
                    >
                      <Banknote className="w-3 h-3 text-amber-700" />
                      <span>{t.debt_btn_pay}</span>
                    </button>

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
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-theme-surface/50 border-t border-theme/60 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-theme-muted font-mono">
            {lang === 'vi' ? 'Đồng bộ tự động cùng Sổ cái & Chi tiêu' : 'Synchronized with Ledger & Expenses'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-theme text-xs font-semibold text-theme-main bg-white hover:bg-theme-surface transition-colors cursor-pointer"
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
