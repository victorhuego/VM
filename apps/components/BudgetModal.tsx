'use client'

import React, { useState, useEffect } from 'react'
import { LanguageType, FinancialState } from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import { Input } from '@/components/ui/input'
import { TouchpadField } from '@/components/TouchpadField'
import { X, Target, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react'

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  monthlyBudget: number
  monthlySpent: number
  lang: LanguageType
  onSaveBudget: (newBudget: number) => void
}

export function BudgetModal({
  isOpen,
  onClose,
  monthlyBudget,
  monthlySpent,
  lang,
  onSaveBudget,
}: BudgetModalProps) {
  const t = dictionary[lang]
  const [budgetStr, setBudgetStr] = useState('')
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const monthStr = (now.getMonth() + 1).toString().padStart(2, '0')
  const currentMonthLabel = `${t.month_name_prefix} ${monthStr}/${now.getFullYear()}`

  useEffect(() => {
    if (isOpen) {
      setBudgetStr(monthlyBudget.toString())
      setError(null)
    }
  }, [isOpen, monthlyBudget])

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

  const newBudgetNum = parseFloat(budgetStr) || 0
  const remainingCurrent = Math.max(0, monthlyBudget - monthlySpent)
  const remainingNew = Math.max(0, newBudgetNum - monthlySpent)
  const percentNew = newBudgetNum > 0 ? Math.min(100, Math.round((monthlySpent / newBudgetNum) * 100)) : 100
  const isOverBudget = newBudgetNum > 0 && monthlySpent > newBudgetNum

  const handlePresetAdd = (amount: number) => {
    const current = parseFloat(budgetStr) || 0
    setBudgetStr((current + amount).toString())
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newBudgetNum < 0) {
      setError(lang === 'vi' ? 'Vui lòng nhập ngân sách hợp lệ' : 'Please enter a valid budget')
      return
    }
    onSaveBudget(newBudgetNum)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white border border-theme w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme/70 bg-theme-surface/60 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shadow-xs shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-theme-main truncate">
                {t.budget_modal_title} • {currentMonthLabel}
              </h2>
              <p className="text-[10px] text-theme-muted truncate">{t.budget_modal_sub}</p>
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

        {/* Current Standing Overview */}
        <div className="p-4 bg-theme-surface/40 border-b border-theme/50 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-theme shadow-2xs">
              <span className="text-[10px] text-theme-muted block">{t.budget_current_label}</span>
              <span className="font-mono text-sm sm:text-base font-bold text-theme-main">
                {formatMoney(monthlyBudget, lang)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-theme shadow-2xs">
              <span className="text-[10px] text-theme-muted block">{t.budget_spent_label}</span>
              <span className="font-mono text-sm sm:text-base font-bold text-amber-700">
                {formatMoney(monthlySpent, lang)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-theme-muted">{t.budget_remaining_label}:</span>
            <span className={`font-mono font-bold ${remainingCurrent > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(remainingCurrent, lang)}
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Budget Amount Input with Touchpad */}
          <TouchpadField
            label={t.budget_input_label}
            value={budgetStr}
            onChange={(val) => {
              setBudgetStr(val)
              setError(null)
            }}
            lang={lang}
            placeholder="VD: 25000000"
            title={t.budget_modal_title}
            presets={[1000000, 2000000, 5000000, 10000000]}
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[1000000, 2000000, 5000000, 10000000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetAdd(preset)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
              >
                +{preset >= 1000000 ? `${preset / 1000000}M` : preset.toLocaleString()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBudgetStr(monthlySpent.toString())}
              className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-colors cursor-pointer"
              title={lang === 'vi' ? 'Đặt bằng đúng số tiền đã chi' : 'Set equal to current spent'}
            >
              {lang === 'vi' ? '= Đã chi' : '= Spent'}
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 rounded-xl bg-theme-surface/70 border border-theme space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
              {t.budget_preview_title}
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600">
                {lang === 'vi' ? 'Hạn mức sau điều chỉnh:' : 'Remaining after change:'}
              </span>
              <span className={`font-mono font-bold ${isOverBudget ? 'text-rose-600' : 'text-emerald-700'}`}>
                {isOverBudget ? '-' : ''}
                {formatMoney(Math.abs(newBudgetNum - monthlySpent), lang)}
              </span>
            </div>

            {/* Progress bar preview */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-theme-muted font-mono">
                <span>{percentNew}% {lang === 'vi' ? 'đã sử dụng' : 'used'}</span>
                <span className="inline-flex items-center gap-1">
                  {isOverBudget ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      <span className="text-rose-600">{lang === 'vi' ? 'Vượt hạn mức' : 'Over budget'}</span>
                    </>
                  ) : (
                    <span>{lang === 'vi' ? 'An toàn' : 'Safe'}</span>
                  )}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverBudget ? 'bg-rose-500' : percentNew >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, percentNew)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-3 rounded-xl border border-theme text-xs font-semibold text-theme-main bg-white hover:bg-theme-surface transition-colors cursor-pointer"
            >
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-xl btn-theme-gradient text-white text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.budget_save_btn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
