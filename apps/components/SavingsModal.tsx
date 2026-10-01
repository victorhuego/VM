'use client'

import React, { useState, useEffect } from 'react'
import { LanguageType } from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import {
  X,
  TrendingUp,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Target,
  Edit2,
  Check,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TouchpadField } from '@/components/TouchpadField'
import confetti from 'canvas-confetti'

interface SavingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentSavings: number
  bankAccount: number
  savingsGoal: number
  lang: LanguageType
  onWithdrawToBank: (amount: number, note: string) => void
  onDepositToSavings: (amount: number, note: string) => void
  onSaveSavingsGoal?: (goal: number) => void
}

export function SavingsModal({
  isOpen,
  onClose,
  currentSavings,
  bankAccount,
  savingsGoal,
  lang,
  onWithdrawToBank,
  onDepositToSavings,
  onSaveSavingsGoal,
}: SavingsModalProps) {
  const t = dictionary[lang]
  const [activeTab, setActiveTab] = useState<'withdraw' | 'deposit'>('withdraw')
  const [amountStr, setAmountStr] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Goal edit state
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(savingsGoal.toString())

  useEffect(() => {
    if (isOpen) {
      setAmountStr('')
      setNote('')
      setError(null)
      setIsEditingGoal(false)
      setGoalInput(savingsGoal.toString())
    }
  }, [isOpen, activeTab, savingsGoal])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const numAmount = parseFloat(amountStr.replace(/,/g, '.').replace(/[^\d.]/g, '') || '0')
  const savingsPercent = Math.min(100, (currentSavings / (savingsGoal || 1)) * 100)

  // Validation
  const isWithdraw = activeTab === 'withdraw'
  const maxAvailable = isWithdraw ? currentSavings : bankAccount
  const isOverMax = numAmount > maxAvailable
  const isValidAmount = numAmount > 0 && !isOverMax

  const savingsAfter = isWithdraw
    ? Math.max(0, currentSavings - numAmount)
    : currentSavings + numAmount

  const bankAfter = isWithdraw
    ? bankAccount + numAmount
    : Math.max(0, bankAccount - numAmount)

  const handlePreset = (val: number) => {
    setAmountStr(val.toString())
    setError(null)
  }

  const handleMax = () => {
    setAmountStr(maxAvailable.toString())
    setError(null)
  }

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newGoal = parseFloat(goalInput.replace(/,/g, '.'))
    if (!isNaN(newGoal) && newGoal >= 0 && onSaveSavingsGoal) {
      onSaveSavingsGoal(newGoal)
      setIsEditingGoal(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!numAmount || numAmount <= 0) {
      setError(lang === 'vi' ? 'Vui lòng nhập số tiền hợp lệ' : 'Please enter a valid amount')
      return
    }
    if (isOverMax) {
      setError(
        isWithdraw
          ? (lang === 'vi' ? 'Số tiền rút vượt quá số dư tiết kiệm hiện có' : 'Amount exceeds available savings balance')
          : (lang === 'vi' ? 'Số tiền gửi vượt quá số dư tài khoản ngân hàng' : 'Amount exceeds bank account balance')
      )
      return
    }

    if (isWithdraw) {
      onWithdrawToBank(numAmount, note.trim() || t.savings_note_withdraw_default)
    } else {
      onDepositToSavings(numAmount, note.trim() || t.savings_note_deposit_default)
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#F59E0B', '#FBBF24', '#10B981', '#3B82F6', '#EC4899'],
        })
      } catch {}
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-theme-card border border-theme w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-theme/60 bg-theme-surface/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-theme-main">
                {t.savings_modal_title}
              </h2>
              <p className="text-[10px] text-theme-muted">{t.savings_modal_sub}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-surface border border-transparent hover:border-theme transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overview Balance Card */}
        <div className="p-3.5 sm:p-4 bg-theme-surface/30 border-b border-theme/40 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {/* Savings Box */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-300/40">
              <span className="text-[10px] text-amber-400 font-medium block">
                {t.savings_current_balance}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono-nums text-amber-300 block mt-0.5">
                {formatMoney(currentSavings, lang)}
              </span>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-amber-950/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${savingsPercent}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-amber-400 font-medium">
                  {savingsPercent.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Bank Box */}
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-300/40">
              <span className="text-[10px] text-blue-400 font-medium block">
                {t.savings_bank_balance}
              </span>
              <span className="text-base sm:text-lg font-bold font-mono-nums text-blue-300 block mt-0.5">
                {formatMoney(bankAccount, lang)}
              </span>
              <span className="text-[9px] text-blue-400/80 block mt-1.5 font-medium">
                {lang === 'vi' ? 'Sẵn sàng nhận / chuyển' : 'Ready for transfer'}
              </span>
            </div>
          </div>

          {/* Goal Progress Banner & Inline Edit */}
          <div className="p-2.5 rounded-xl bg-theme-surface border border-theme/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-theme-main font-medium">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {t.savings_target}: <strong className="font-mono text-amber-400">{formatMoney(savingsGoal, lang)}</strong>
                </span>
              </div>
              {onSaveSavingsGoal && (
                <button
                  type="button"
                  onClick={() => setIsEditingGoal((prev) => !prev)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>{isEditingGoal ? t.btn_cancel : t.savings_goal_edit_btn}</span>
                </button>
              )}
            </div>

            {isEditingGoal && (
              <form onSubmit={handleGoalSubmit} className="flex items-center gap-1.5 pt-1 animate-in fade-in duration-150">
                <div className="flex-1">
                  <TouchpadField
                    value={goalInput}
                    onChange={(val) => setGoalInput(val)}
                    lang={lang}
                    placeholder="VD: 60000000"
                    title={t.savings_goal_label}
                    presets={[10000000, 20000000, 50000000, 100000000]}
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.savings_goal_save_btn}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Action Tabs: Withdraw vs Deposit */}
        <div className="px-3.5 sm:px-4 pt-3">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-theme-surface border border-theme/80 gap-1">
            <button
              type="button"
              data-active={activeTab === 'withdraw'}
              onClick={() => setActiveTab('withdraw')}
              className={`savings-tab-btn py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'withdraw'
                  ? 'savings-tab-active bg-amber-600 text-white shadow-xs'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{t.savings_tab_withdraw}</span>
            </button>
            <button
              type="button"
              data-active={activeTab === 'deposit'}
              onClick={() => setActiveTab('deposit')}
              className={`savings-tab-btn py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'deposit'
                  ? 'savings-tab-active bg-blue-600 text-white shadow-xs'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{t.savings_tab_deposit}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3.5 sm:p-4 space-y-3 sm:space-y-3.5 overflow-y-auto flex-1">
            {/* Amount input with Touchpad */}
            <TouchpadField
              label={isWithdraw ? t.savings_withdraw_amount_label : t.savings_deposit_amount_label}
              badgeText={`${lang === 'vi' ? 'Tối đa: ' : 'Max: '} ${formatMoney(maxAvailable, lang)}`}
              value={amountStr}
              onChange={(val) => {
                setAmountStr(val)
                setError(null)
              }}
              lang={lang}
              placeholder="VD: 5000000"
              max={maxAvailable}
              isOverBalance={isOverMax}
              title={isWithdraw ? t.savings_withdraw_amount_label : t.savings_deposit_amount_label}
              presets={[1000000, 2000000, 5000000, 10000000]}
            />

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {[1000000, 2000000, 5000000, 10000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  disabled={preset > maxAvailable}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                    preset > maxAvailable
                      ? 'opacity-40 cursor-not-allowed bg-theme-surface/40 text-theme-muted border-theme/40'
                      : 'bg-theme-surface text-theme-accent hover:bg-theme-card hover:text-white border-theme/60'
                  }`}
                >
                  +{preset >= 1000000 ? `${preset / 1000000}M` : preset.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={handleMax}
                disabled={maxAvailable <= 0}
                className="text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-500/50 bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 transition-all cursor-pointer"
              >
                {t.quick_preset_all} (100%)
              </button>
            </div>

            {/* Live Preview Box */}
            {numAmount > 0 && !isOverMax && (
              <div className="p-3 rounded-xl bg-theme-surface/80 border border-theme/60 space-y-1.5 text-xs font-mono animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-theme-main">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.savings_after_withdraw}:</span>
                  </span>
                  <span className="font-bold text-amber-400">{formatMoney(savingsAfter, lang)}</span>
                </div>
                <div className="flex items-center justify-between text-theme-main">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.bank_after_receive}:</span>
                  </span>
                  <span className="font-bold text-blue-400">{formatMoney(bankAfter, lang)}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {isOverMax && (
              <div className="text-xs text-rose-300 flex items-center gap-1.5 bg-rose-950/40 p-2 rounded-lg border border-rose-500/50">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  {isWithdraw
                    ? (lang === 'vi' ? 'Số tiền rút không thể lớn hơn số dư tiết kiệm' : 'Withdrawal amount cannot exceed savings balance')
                    : (lang === 'vi' ? 'Số tiền gửi không thể lớn hơn số dư tài khoản ngân hàng' : 'Deposit amount cannot exceed bank balance')}
                </span>
              </div>
            )}

            {error && (
              <div className="text-xs text-rose-300 flex items-center gap-1.5 bg-rose-950/40 p-2 rounded-lg border border-rose-500/50">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Note Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-theme-main">{t.note_label}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isWithdraw ? t.savings_note_withdraw_default : t.savings_note_deposit_default}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-theme-surface border border-theme/60 text-theme-main placeholder:text-theme-muted focus:outline-hidden focus:ring-1 focus:ring-theme-accent transition-all"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-2 p-3 sm:p-4 border-t border-theme/60 bg-theme-surface/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-card border border-theme/60 bg-theme-surface/40 transition-colors cursor-pointer"
            >
              {t.btn_cancel}
            </button>
            <button
              type="submit"
              disabled={!isValidAmount}
              className={`px-4 py-2 text-xs font-bold rounded-lg text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isWithdraw
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isWithdraw ? t.savings_btn_withdraw_confirm : t.savings_btn_deposit_confirm}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
