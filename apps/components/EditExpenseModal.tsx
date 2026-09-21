'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Select from 'react-select'
import {
  LanguageType,
  ExpenseItem,
  ExpenseCategoryType,
  IncomeCategoryType,
  TransactionType,
  ExpenseSourceType,
  FinancialState,
  DebtItem,
  InitialBalances,
} from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import { previewEditTransactionImpact } from '@/lib/accounting'
import { Input } from '@/components/ui/input'
import { TouchpadField } from './TouchpadField'
import { Button } from '@/components/ui/button'
import {
  X,
  Wallet,
  Building2,
  CreditCard,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Film,
  Sparkles,
  Receipt,
  Banknote,
  Gift,
  TrendingUp,
  TrendingDown,
  Coins,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Save,
  ArrowRight,
  ArrowRightLeft,
  Lock,
  Zap,
} from 'lucide-react'

interface CategoryOption<T extends string = string> {
  value: T
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface EditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  expense: ExpenseItem | null
  expenses?: ExpenseItem[]
  initialBalances?: InitialBalances
  finances: FinancialState
  debts?: DebtItem[]
  lang: LanguageType
  isLocked?: boolean
  onSave: (updatedItem: ExpenseItem, oldItem: ExpenseItem) => void
}

export function EditExpenseModal({
  isOpen,
  onClose,
  expense,
  expenses = [],
  initialBalances,
  finances,
  debts = [],
  lang,
  isLocked = false,
  onSave,
}: EditExpenseModalProps) {
  const t = dictionary[lang]
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [txType, setTxType] = useState<TransactionType>('expense')
  const [source, setSource] = useState<ExpenseSourceType>('account')
  const [amount, setAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategoryType>('food')
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategoryType>('salary')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [selectedDebtId, setSelectedDebtId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state whenever expense changes or modal opens
  useEffect(() => {
    if (isOpen && expense) {
      setTxType(expense.type || 'expense')
      setSource(expense.source || 'account')
      setAmount(expense.amount ? expense.amount.toString() : '')
      setDate(expense.date || '')
      setNote(expense.note || '')
      setReceiptImage(expense.image || null)
      setSelectedDebtId(expense.debtId || '')
      setError(null)

      if (expense.type === 'income') {
        setIncomeCategory(
          (['salary', 'bonus', 'investment', 'other'].includes(expense.category)
            ? expense.category
            : 'salary') as IncomeCategoryType
        )
      } else {
        setExpenseCategory(
          (['food', 'transport', 'shopping', 'housing', 'entertainment', 'development', 'debt'].includes(expense.category)
            ? expense.category
            : 'food') as ExpenseCategoryType
        )
      }
    }
  }, [isOpen, expense])

  // Handle ESC keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !expense) return null

  // Accounting calculations for available balances
  const oldSource = expense.source || 'account'
  const oldAmount = expense.amount || 0
  const isOldExpense = (expense.type || 'expense') === 'expense'

  // If old transaction was an expense, reverting it adds back oldAmount to oldSource
  const effectiveCashBalance =
    finances.cash + (isOldExpense && oldSource === 'cash' ? oldAmount : 0)
  const effectiveBankBalance =
    finances.bankAccount + (isOldExpense && oldSource === 'account' ? oldAmount : 0)

  const availableBalance = source === 'cash' ? effectiveCashBalance : effectiveBankBalance
  const numAmount = parseFloat(amount.replace(/,/g, '.')) || 0
  const isOverBalance = txType === 'expense' && numAmount > availableBalance

  const expenseCategoryOptions: CategoryOption<ExpenseCategoryType>[] = [
    { value: 'food', label: t.cat_food, icon: Utensils },
    { value: 'transport', label: t.cat_transport, icon: Car },
    { value: 'shopping', label: t.cat_shopping, icon: ShoppingBag },
    { value: 'housing', label: t.cat_housing, icon: Home },
    { value: 'entertainment', label: t.cat_entertainment, icon: Film },
    { value: 'development', label: t.cat_development, icon: Sparkles },
    { value: 'debt', label: t.cat_debt, icon: CreditCard },
  ]

  const incomeCategoryOptions: CategoryOption<IncomeCategoryType>[] = [
    { value: 'salary', label: t.cat_salary, icon: Wallet },
    { value: 'bonus', label: t.cat_bonus, icon: Gift },
    { value: 'investment', label: t.cat_investment, icon: TrendingUp },
    { value: 'other', label: t.cat_other_income, icon: Coins },
  ]

  const selectCustomStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '38px',
      fontSize: '13px',
      backgroundColor: '#ffffff',
      borderColor: state.isFocused ? 'var(--theme-accent)' : 'var(--theme-border)',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(63, 97, 65, 0.1)' : 'none',
      '&:hover': {
        borderColor: 'var(--theme-border)',
      },
      borderRadius: '0.5rem',
      cursor: 'pointer',
      touchAction: 'manipulation',
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: '0 10px',
      height: '38px',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#18181b',
      margin: 0,
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: '38px',
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      padding: '6px',
      color: 'var(--theme-muted)',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
      pointerEvents: 'auto',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#ffffff',
      border: '1px solid var(--theme-border)',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
      zIndex: 9999,
      touchAction: 'manipulation',
    }),
    menuList: (base: any) => ({
      ...base,
      padding: '4px',
    }),
    option: (base: any, state: any) => ({
      ...base,
      fontSize: '13px',
      borderRadius: '0.375rem',
      padding: '9px 12px',
      minHeight: '38px',
      display: 'flex',
      alignItems: 'center',
      backgroundColor: state.isSelected
        ? 'var(--theme-surface)'
        : state.isFocused
        ? '#f4f4f5'
        : 'transparent',
      color: state.isSelected ? 'var(--theme-main)' : '#27272a',
      fontWeight: state.isSelected ? 600 : 400,
      cursor: 'pointer',
      touchAction: 'manipulation',
    }),
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setReceiptImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setReceiptImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePreset = (val: number) => {
    const nextVal = (numAmount || 0) + val
    setAmount(nextVal.toString())
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!numAmount || numAmount <= 0) {
      setError(lang === 'vi' ? 'Vui lòng nhập số tiền hợp lệ (> 0)' : 'Please enter a valid amount (> 0)')
      return
    }

    if (isOverBalance) {
      setError(t.quick_exp_over_balance_err)
      return
    }

    if (isLocked && (numAmount !== expense.amount || source !== expense.source || txType !== expense.type)) {
      setError(t.reconciled_lock_modal_notice)
      return
    }

    const updatedCategory = txType === 'income' ? incomeCategory : expenseCategory

    const updatedItem: ExpenseItem = {
      ...expense,
      type: txType,
      category: updatedCategory,
      amount: numAmount,
      source: source,
      date: date || expense.date,
      note: note.trim(),
      image: receiptImage || undefined,
      debtId: txType === 'expense' && updatedCategory === 'debt' ? selectedDebtId || undefined : undefined,
    }

    onSave(updatedItem, expense)
    onClose()
  }

  const candidateUpdatedItem: ExpenseItem = useMemo(() => {
    const updatedCategory = txType === 'income' ? incomeCategory : expenseCategory
    return {
      ...(expense || {}),
      type: txType,
      category: updatedCategory,
      amount: numAmount,
      source: source,
      date: date || expense?.date || '',
      note: note.trim(),
      image: receiptImage || undefined,
      debtId: txType === 'expense' && updatedCategory === 'debt' ? selectedDebtId || undefined : undefined,
    } as ExpenseItem
  }, [expense, txType, incomeCategory, expenseCategory, numAmount, source, date, note, receiptImage, selectedDebtId])

  const editImpact = useMemo(() => {
    if (!expense || !expenses.length || !initialBalances) return null
    return previewEditTransactionImpact({
      expenses,
      initialBalances,
      oldItem: expense,
      updatedItem: candidateUpdatedItem,
      debts,
    })
  }, [expense, expenses, initialBalances, candidateUpdatedItem, debts])

  // Calculate balance preview delta (fallback)
  const isSameSource = oldSource === source
  const delta = numAmount - oldAmount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-theme max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-zinc-50/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
              txType === 'income' ? 'bg-emerald-600 text-white' : 'bg-theme-main text-white'
            }`}>
              {txType === 'income' ? <Wallet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-theme-main leading-tight">
                {txType === 'income' ? t.edit_income_title : t.edit_expense_title}
              </h3>
              <p className="text-[11px] sm:text-xs text-theme-muted mt-0.5">
                {t.edit_expense_sub}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            title={t.btn_cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Reconciled Lock Notice Banner */}
          {isLocked && (
            <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold">
                  {lang === 'vi' ? 'Giao dịch thuộc kỳ đã chốt kiểm kê' : 'Reconciled Period Transaction'}
                </div>
                <div className="text-[11px] text-amber-800 leading-relaxed">
                  {t.reconciled_lock_modal_notice}
                </div>
              </div>
            </div>
          )}

          {/* Source Selector (Cash vs Bank Account with live balances) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-main flex items-center justify-between">
              <span>{t.source_label}</span>
              <span className="text-[11px] text-zinc-500 font-normal">
                {source === 'cash' ? t.source_cash_short : t.source_account_short} {isLocked && (lang === 'vi' ? '(Đã khóa)' : '(Locked)')}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setSource('cash')}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  source === 'cash'
                    ? 'bg-emerald-50/90 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  source === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{t.source_cash_short}</div>
                  <div className="text-[11px] font-mono font-medium text-emerald-700 truncate">
                    {formatMoney(effectiveCashBalance, lang)}
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLocked}
                onClick={() => setSource('account')}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  source === 'account'
                    ? 'bg-blue-50/90 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  source === 'account' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">{t.source_account_short}</div>
                  <div className="text-[11px] font-mono font-medium text-blue-700 truncate">
                    {formatMoney(effectiveBankBalance, lang)}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-theme-main">
                {t.amount_label}
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                {lang === 'vi' ? 'Khả dụng: ' : 'Available: '}
                <strong className={source === 'cash' ? 'text-emerald-700' : 'text-blue-700'}>
                  {formatMoney(availableBalance, lang)}
                </strong>
              </span>
            </div>
            <TouchpadField
              value={amount}
              onChange={(val) => {
                if (isLocked) return
                setAmount(val)
                setError(null)
              }}
              lang={lang}
              disabled={isLocked}
              placeholder={t.amount_placeholder}
              title={t.amount_label}
              isOverBalance={isOverBalance}
              presets={[20000, 50000, 100000, 200000, 500000]}
            />

            {/* Quick Presets (Only when not locked) */}
            {!isLocked && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handlePreset(20000)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                >
                  +20k
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(50000)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                >
                  +50k
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(100000)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                >
                  +100k
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(200000)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                >
                  +200k
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(500000)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                >
                  +500k
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(1000000)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                >
                  +1M
                </button>
              </div>
            )}
          </div>

          {/* Balance Impact Preview Banner */}
          {isLocked ? (
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between text-zinc-500">
              <div className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t.balance_impact_preview}</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-400 italic">
                {lang === 'vi' ? '0 đ (Đã khóa số tiền & nguồn)' : '0 VND (Amount & source locked)'}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="font-semibold text-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{t.balance_impact_preview}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">SSOT Ledger</span>
              </div>

              {/* Negative Balance Danger Warning */}
              {editImpact?.hasNegative && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{t.edit_warning_negative}</span>
                </div>
              )}

              {/* Detailed Wallet Balance Impacts */}
              {editImpact ? (
                <div className="space-y-1.5 pt-0.5">
                  {editImpact.deltas.cash !== 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600 font-medium flex items-center gap-1.5 shrink-0 whitespace-nowrap text-xs">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {t.source_cash_short}:
                      </span>
                      <div className="text-right font-mono">
                        <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs">
                          <span className="text-zinc-400">{formatMoney(editImpact.currentBalances.cash, lang)}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                          <span className={`font-bold ${editImpact.nextBalances.cash < 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
                            {formatMoney(editImpact.nextBalances.cash, lang)}
                          </span>
                        </div>
                        <div className={`text-[10px] font-semibold ${
                          editImpact.deltas.cash > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {editImpact.deltas.cash > 0 ? `+${formatMoney(editImpact.deltas.cash, lang)}` : formatMoney(editImpact.deltas.cash, lang)}
                        </div>
                      </div>
                    </div>
                  )}

                  {editImpact.deltas.bankAccount !== 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-600 font-medium flex items-center gap-1.5 shrink-0 whitespace-nowrap text-xs">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {t.source_account_short}:
                      </span>
                      <div className="text-right font-mono">
                        <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs">
                          <span className="text-zinc-400">{formatMoney(editImpact.currentBalances.bankAccount, lang)}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                          <span className={`font-bold ${editImpact.nextBalances.bankAccount < 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
                            {formatMoney(editImpact.nextBalances.bankAccount, lang)}
                          </span>
                        </div>
                        <div className={`text-[10px] font-semibold ${
                          editImpact.deltas.bankAccount > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {editImpact.deltas.bankAccount > 0 ? `+${formatMoney(editImpact.deltas.bankAccount, lang)}` : formatMoney(editImpact.deltas.bankAccount, lang)}
                        </div>
                      </div>
                    </div>
                  )}

                  {editImpact.monthlySpentDelta !== 0 && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-200/60 text-zinc-600">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-blue-600" />
                        {t.edit_impact_current_spent}:
                      </span>
                      <span className="font-mono font-medium text-blue-700">
                        {formatMoney(editImpact.monthlySpentBefore, lang)} → {formatMoney(editImpact.monthlySpentAfter, lang)} ({editImpact.monthlySpentDelta > 0 ? `+${formatMoney(editImpact.monthlySpentDelta, lang)}` : formatMoney(editImpact.monthlySpentDelta, lang)})
                      </span>
                    </div>
                  )}

                  {editImpact.debtImpact && (
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-200/60 text-amber-800">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-amber-600" />
                        {editImpact.debtImpact.debtTitle || t.cat_debt}:
                      </span>
                      <span className="font-mono font-bold">
                        {editImpact.debtImpact.deltaAmount > 0
                          ? `Giảm thêm -${formatMoney(editImpact.debtImpact.deltaAmount, lang)}`
                          : `Tăng lại +${formatMoney(Math.abs(editImpact.debtImpact.deltaAmount), lang)}`}
                      </span>
                    </div>
                  )}
                </div>
              ) : isSameSource ? (
                <div className="text-[11px] text-zinc-600 flex items-center justify-between">
                  <span>
                    {source === 'cash' ? t.source_cash_short : t.source_account_short} ({formatMoney(oldAmount, lang)} → {formatMoney(numAmount, lang)})
                  </span>
                  <span className={`font-mono font-bold ${
                    delta > 0 ? 'text-rose-600' : delta < 0 ? 'text-emerald-600' : 'text-zinc-500'
                  }`}>
                    {delta > 0 ? `- ${formatMoney(delta, lang)}` : delta < 0 ? `+ ${formatMoney(Math.abs(delta), lang)} (hoàn)` : '0 đ'}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-600 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span>{t.balance_refund_label} ({oldSource === 'cash' ? t.source_cash_short : t.source_account_short}):</span>
                    <span className="font-mono font-bold text-emerald-600">+ {formatMoney(oldAmount, lang)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t.balance_deduct_label} ({source === 'cash' ? t.source_cash_short : t.source_account_short}):</span>
                    <span className="font-mono font-bold text-rose-600">- {formatMoney(numAmount, lang)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Category Select */}
          <div className="space-y-1 relative z-20">
            <label className="text-[11px] font-semibold text-theme-main flex items-center justify-between">
              <span>{t.category_label}</span>
              {txType === 'expense' && expenseCategory === 'debt' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-normal">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>{lang === 'vi' ? 'Tự động điều chỉnh Tiền nợ' : 'Auto-adjusts tracked debt'}</span>
                </span>
              )}
            </label>
            {!mounted ? (
              <div className="h-10 w-full bg-white border border-theme rounded-lg px-3 flex items-center text-sm text-zinc-900">
                {txType === 'expense'
                  ? expenseCategoryOptions.find((opt) => opt.value === expenseCategory)?.label || expenseCategory
                  : incomeCategoryOptions.find((opt) => opt.value === incomeCategory)?.label || incomeCategory}
              </div>
            ) : txType === 'expense' ? (
              <Select<CategoryOption<ExpenseCategoryType>>
                instanceId="edit-expense-category-select"
                menuPortalTarget={mounted && typeof document !== 'undefined' ? document.body : undefined}
                menuPosition="fixed"
                isSearchable={false}
                value={expenseCategoryOptions.find((opt) => opt.value === expenseCategory)}
                onChange={(option) => {
                  if (option) setExpenseCategory(option.value)
                }}
                options={expenseCategoryOptions}
                formatOptionLabel={(option) => {
                  const Icon = option.icon
                  return (
                    <div className="flex items-center space-x-2">
                      <Icon className="w-3.5 h-3.5 text-theme-accent shrink-0" />
                      <span className="text-xs sm:text-sm">{option.label}</span>
                    </div>
                  )
                }}
                styles={selectCustomStyles}
              />
            ) : (
              <Select<CategoryOption<IncomeCategoryType>>
                instanceId="edit-income-category-select"
                menuPortalTarget={mounted && typeof document !== 'undefined' ? document.body : undefined}
                menuPosition="fixed"
                isSearchable={false}
                value={incomeCategoryOptions.find((opt) => opt.value === incomeCategory)}
                onChange={(option) => {
                  if (option) setIncomeCategory(option.value)
                }}
                options={incomeCategoryOptions}
                formatOptionLabel={(option) => {
                  const Icon = option.icon
                  return (
                    <div className="flex items-center space-x-2">
                      <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs sm:text-sm">{option.label}</span>
                    </div>
                  )
                }}
                styles={selectCustomStyles}
              />
            )}
          </div>

          {/* Linked Debt Select (If category is debt) */}
          {txType === 'expense' && expenseCategory === 'debt' && debts.length > 0 && (
            <div className="space-y-1 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <label className="text-[11px] font-semibold text-amber-900 block">
                {t.quick_exp_select_debt}
              </label>
              <select
                value={selectedDebtId}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                className="w-full h-9 px-2.5 text-xs bg-white border border-amber-300 rounded-lg text-zinc-800 font-medium focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                <option value="">{t.quick_exp_debt_other}</option>
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({formatMoney(d.amount, lang)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-theme-main flex items-center gap-1">
              <Calendar className="w-3 h-3 text-theme-accent" />
              <span>{t.date_label}</span>
            </label>
            <Input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-base sm:text-sm font-mono-nums border-theme focus-visible:ring-theme/30 h-9"
            />
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-theme-main">
              {t.note_label}
            </label>
            <Input
              type="text"
              placeholder={lang === 'vi' ? 'Nhập mô tả / ghi chú giao dịch...' : 'Enter note or description...'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-base sm:text-sm border-theme focus-visible:ring-theme/30 h-9"
            />
          </div>

          {/* Receipt / Image Attachment */}
          <div className="space-y-1 pt-0.5">
            <label className="text-[11px] font-semibold text-theme-main">
              {t.attach_receipt}
            </label>
            {receiptImage ? (
              <div className="flex items-center space-x-3 p-2 bg-zinc-50 border border-theme rounded-md">
                <img
                  src={receiptImage}
                  alt="Receipt preview"
                  className="w-12 h-12 object-cover rounded-md border border-zinc-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-700 truncate font-mono">
                    {lang === 'vi' ? 'Hóa đơn đính kèm' : 'Attached receipt'}
                  </p>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    {t.has_receipt_badge}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  title={t.btn_remove_image}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-300 rounded-lg p-2.5 text-center cursor-pointer hover:border-theme-accent hover:bg-theme-surface/30 transition-all flex items-center justify-center space-x-2 group"
              >
                <Receipt className="w-4 h-4 text-zinc-400 group-hover:text-theme-accent transition-colors" />
                <span className="text-xs text-zinc-500 group-hover:text-theme-main transition-colors">
                  {t.attach_receipt_hint}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 text-xs font-semibold text-zinc-700 border-zinc-200 hover:bg-zinc-100 cursor-pointer"
            >
              {t.btn_cancel}
            </Button>
            <Button
              type="submit"
              disabled={!numAmount || numAmount <= 0 || isOverBalance}
              className={`flex-1 h-10 text-white text-xs font-semibold shadow-xs cursor-pointer active:opacity-75 transition-opacity ${
                !numAmount || numAmount <= 0 || isOverBalance
                  ? 'opacity-50 cursor-not-allowed bg-zinc-200 text-zinc-500'
                  : 'btn-theme-gradient'
              }`}
            >
              <Save className="w-4 h-4 mr-1.5" />
              <span>{t.btn_save_changes}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
