'use client'

import React, { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import {
  LanguageType,
  ExpenseItem,
  ExpenseCategoryType,
  IncomeCategoryType,
  TransactionType,
  ExpenseSourceType,
  FinancialState,
  TransferDirection,
  DebtItem,
} from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import { getClientLocalDateString } from '@/lib/time'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TouchpadField } from '@/components/TouchpadField'
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
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Receipt,
  CornerDownLeft,
  Banknote,
  Gift,
  TrendingUp,
  Coins,
  AlertCircle,
  CheckCircle2,
  Zap,
  PlusCircle,
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface CategoryOption<T extends string = string> {
  value: T
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface QuickExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  targetCard?: 'cash' | 'account' | 'debt' | 'month' | 'general'
  finances: FinancialState
  debts?: DebtItem[]
  lang: LanguageType
  onAddExpense: (expense: Omit<ExpenseItem, 'id' | 'timeAgo'>, rawReceiptFile?: File) => void | Promise<void>
  onTransfer: (direction: TransferDirection, amount: number, note: string) => void
  onPayDebt?: (params: {
    debtId: string
    debtTitle: string
    amount: number
    source: 'cash' | 'account'
    note?: string
  }) => void
}

export function QuickExpenseModal({
  isOpen,
  onClose,
  targetCard = 'general',
  finances,
  debts,
  lang,
  onAddExpense,
  onTransfer,
  onPayDebt,
}: QuickExpenseModalProps) {
  const t = dictionary[lang]
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [txType, setTxType] = useState<TransactionType>('expense')
  const [source, setSource] = useState<ExpenseSourceType>('cash')
  const [transferDir, setTransferDir] = useState<TransferDirection>('bank_to_cash')
  const [amount, setAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategoryType>('food')
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategoryType>('salary')
  const [date, setDate] = useState(() => getClientLocalDateString())
  const [note, setNote] = useState('')
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [selectedDebtId, setSelectedDebtId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTxType('expense')
      setAmount('')
      setNote('')
      setReceiptImage(null)
      setReceiptFile(null)
      setSelectedDebtId('')
      setError(null)
      setDate(getClientLocalDateString())

      if (targetCard === 'cash') {
        setSource('cash')
        setExpenseCategory('food')
      } else if (targetCard === 'account') {
        setSource('account')
        setExpenseCategory('food')
      } else if (targetCard === 'debt') {
        setSource('account')
        setExpenseCategory('debt')
      } else {
        setSource('account')
        setExpenseCategory('food')
      }
    }
  }, [isOpen, targetCard])

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

  const isCashCard = targetCard === 'cash'
  const isBankCard = targetCard === 'account'
  const isDebtCard = targetCard === 'debt'
  const isGeneral = targetCard === 'general' || (!isCashCard && !isBankCard && !isDebtCard)

  const availableBalance =
    txType === 'transfer'
      ? transferDir === 'cash_to_bank'
        ? finances.cash
        : finances.bankAccount
      : source === 'cash'
      ? finances.cash
      : finances.bankAccount

  const numAmount = parseFloat(amount.replace(/,/g, '.')) || 0
  const isOverBalance = txType !== 'income' && numAmount > availableBalance

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
      backgroundColor: '#ffffff',
      borderColor: state.isFocused ? 'var(--theme-accent)' : 'var(--theme-border)',
      boxShadow: state.isFocused ? '0 0 0 2px var(--theme-surface)' : 'none',
      '&:hover': {
        borderColor: 'var(--theme-accent)',
      },
      borderRadius: '0.5rem',
      minHeight: '40px',
      fontSize: '13px',
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
    setReceiptFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setReceiptImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setReceiptImage(null)
    setReceiptFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePreset = (val: number) => {
    const nextVal = (numAmount || 0) + val
    setAmount(nextVal.toString())
    setError(null)
  }

  const handlePayAllDebt = () => {
    setAmount(finances.totalDebt.toString())
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!numAmount || numAmount <= 0) {
      setError(lang === 'vi' ? 'Vui lòng nhập số tiền hợp lệ' : 'Please enter a valid amount')
      return
    }

    if (txType === 'transfer') {
      const dir: TransferDirection = isCashCard ? 'cash_to_bank' : isBankCard ? 'bank_to_cash' : transferDir
      if (numAmount > availableBalance) {
        setError(t.quick_exp_over_balance_err)
        return
      }
      onTransfer(dir, numAmount, note.trim())
      onClose()
      return
    }

    if (isOverBalance) {
      setError(t.quick_exp_over_balance_err)
      return
    }

    const isExpense = txType === 'expense'
    const isDebtPayment = isDebtCard || (isExpense && expenseCategory === 'debt')

    // If specific debt item was selected, trigger onPayDebt
    if (isDebtPayment && selectedDebtId && onPayDebt) {
      const targetDebt = debts?.find((d) => d.id === selectedDebtId)
      if (targetDebt) {
        onPayDebt({
          debtId: targetDebt.id,
          debtTitle: targetDebt.title,
          amount: numAmount,
          source: source === 'cash' ? 'cash' : 'account',
          note: note.trim() || `Trả nợ: ${targetDebt.title}`,
        })
        onClose()
        return
      }
    }

    const defaultNote = isDebtPayment
      ? t.quick_exp_note_default_debt
      : isExpense
      ? source === 'cash'
        ? t.quick_exp_note_default_cash
        : t.quick_exp_note_default_bank
      : source === 'cash'
      ? (lang === 'vi' ? 'Thu tiền mặt' : 'Cash income')
      : (lang === 'vi' ? 'Thu vào tài khoản' : 'Bank income')

    onAddExpense(
      {
        type: isDebtPayment ? 'expense' : (txType as TransactionType),
        amount: numAmount,
        category: isDebtPayment ? 'debt' : isExpense ? expenseCategory : incomeCategory,
        date,
        note: note.trim() || defaultNote,
        source: isExpense || isDebtPayment ? source : source,
        image: receiptImage || undefined,
      },
      receiptFile || undefined
    )

    if (txType === 'income') {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#3B82F6'],
        })
      } catch {}
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="bg-white border border-theme w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme/70 bg-theme-surface/60 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
                isDebtCard || (txType === 'expense' && expenseCategory === 'debt')
                  ? 'bg-rose-100 border border-rose-300 text-rose-800'
                  : isCashCard || (isGeneral && source === 'cash')
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                  : 'bg-blue-100 border border-blue-300 text-blue-800'
              }`}
            >
              {isDebtCard || (txType === 'expense' && expenseCategory === 'debt') ? (
                <CreditCard className="w-5 h-5" />
              ) : isCashCard ? (
                <Wallet className="w-5 h-5" />
              ) : isBankCard ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <PlusCircle className="w-5 h-5 text-theme-accent" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-theme-main truncate">
                {isGeneral
                  ? (lang === 'vi' ? 'Ghi chú chi tiêu' : 'Record Expense')
                  : isDebtCard
                  ? (lang === 'vi' ? 'Thanh Toán Khoản Nợ' : 'Pay Off Debt')
                  : isCashCard
                  ? (lang === 'vi' ? 'Ví Tiền Mặt' : 'Cash Wallet')
                  : isBankCard
                  ? (lang === 'vi' ? 'Tài Khoản Ngân Hàng' : 'Bank Account')
                  : (lang === 'vi' ? 'Ghi chú chi tiêu' : 'Record Expense')}
              </h2>
              <p className="text-[11px] text-theme-muted truncate">
                {isGeneral
                  ? (lang === 'vi' ? 'Ghi chép chi tiêu, thu nhập hoặc chuyển tiền' : 'Record expenses, income, or transfers')
                  : isDebtCard
                  ? `${lang === 'vi' ? 'Dư nợ cần theo dõi: ' : 'Remaining debt: '} ${formatMoney(finances.totalDebt, lang)}`
                  : isCashCard
                  ? `${lang === 'vi' ? 'Số dư tiền mặt: ' : 'Available cash: '} ${formatMoney(finances.cash, lang)}`
                  : isBankCard
                  ? `${lang === 'vi' ? 'Số dư tài khoản: ' : 'Available bank balance: '} ${formatMoney(finances.bankAccount, lang)}`
                  : (lang === 'vi' ? 'Ghi chép chi tiêu, thu nhập hoặc chuyển tiền' : 'Record expenses, income, or transfers')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-surface border border-transparent hover:border-theme transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Tabs for General modal: Ghi chú chi tiêu */}
          {isGeneral && (
            <div className="p-1 bg-zinc-100/90 rounded-xl flex items-center gap-1 border border-zinc-200/80">
              <button
                type="button"
                onClick={() => {
                  setTxType('expense')
                  setError(null)
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'expense'
                    ? 'bg-white text-rose-600 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowDownCircle className={`w-3.5 h-3.5 shrink-0 ${txType === 'expense' ? 'text-rose-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_expense_type || 'Chi tiêu'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTxType('income')
                  setError(null)
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'income'
                    ? 'bg-white text-emerald-600 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowUpCircle className={`w-3.5 h-3.5 shrink-0 ${txType === 'income' ? 'text-emerald-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_income_type || 'Thu nhập'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTxType('transfer')
                  setError(null)
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'transfer'
                    ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowLeftRight className={`w-3.5 h-3.5 shrink-0 ${txType === 'transfer' ? 'text-blue-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_transfer_type || 'Chuyển tiền'}</span>
              </button>
            </div>
          )}

          {/* Tabs for Cash card */}
          {isCashCard && (
            <div className="p-1 bg-zinc-100/90 rounded-xl flex items-center gap-1 border border-zinc-200/80">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'expense'
                    ? 'bg-white text-emerald-700 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowDownCircle className={`w-3.5 h-3.5 shrink-0 ${txType === 'expense' ? 'text-emerald-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_cash_spend}</span>
              </button>
              <button
                type="button"
                onClick={() => setTxType('transfer')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'transfer'
                    ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowLeftRight className={`w-3.5 h-3.5 shrink-0 ${txType === 'transfer' ? 'text-blue-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_cash_deposit_to_bank}</span>
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'income'
                    ? 'bg-white text-emerald-700 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowUpCircle className={`w-3.5 h-3.5 shrink-0 ${txType === 'income' ? 'text-emerald-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_cash_income}</span>
              </button>
            </div>
          )}

          {/* Tabs for Bank card */}
          {isBankCard && (
            <div className="p-1 bg-zinc-100/90 rounded-xl flex items-center gap-1 border border-zinc-200/80">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'expense'
                    ? 'bg-white text-rose-600 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowDownCircle className={`w-3.5 h-3.5 shrink-0 ${txType === 'expense' ? 'text-rose-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_bank_spend}</span>
              </button>
              <button
                type="button"
                onClick={() => setTxType('transfer')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'transfer'
                    ? 'bg-white text-blue-600 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowLeftRight className={`w-3.5 h-3.5 shrink-0 ${txType === 'transfer' ? 'text-blue-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_bank_withdraw_cash}</span>
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  txType === 'income'
                    ? 'bg-white text-emerald-600 shadow-sm border border-zinc-200/80 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800 bg-transparent'
                }`}
              >
                <ArrowUpCircle className={`w-3.5 h-3.5 shrink-0 ${txType === 'income' ? 'text-emerald-600' : 'text-zinc-400'}`} />
                <span className="whitespace-nowrap">{t.tab_bank_income}</span>
              </button>
            </div>
          )}

          {/* Transfer Directions Selector (for General modal when in Transfer tab) */}
          {isGeneral && txType === 'transfer' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-theme-main">
                {lang === 'vi' ? 'Hướng chuyển quỹ' : 'Transfer Direction'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransferDir('bank_to_cash')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    transferDir === 'bank_to_cash'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 font-semibold'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>→</span>
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <div className="mt-1 font-semibold">{t.transfer_bank_to_cash}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTransferDir('cash_to_bank')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    transferDir === 'cash_to_bank'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 font-semibold'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>→</span>
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  </div>
                  <div className="mt-1 font-semibold">{t.transfer_cash_to_bank}</div>
                </button>
              </div>
            </div>
          )}

          {/* Transfer Info Banner (for Cash or Bank card transfer) */}
          {(isCashCard || isBankCard) && txType === 'transfer' && (
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isCashCard ? <Banknote className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-semibold text-blue-950">
                    {isCashCard ? t.transfer_cash_to_bank : t.transfer_bank_to_cash}
                  </div>
                  <div className="text-[11px] text-blue-700">
                    {isCashCard
                      ? (lang === 'vi' ? 'Chuyển tiền mặt nạp vào số dư tài khoản' : 'Deposit cash into bank account balance')
                      : (lang === 'vi' ? 'Rút tiền từ tài khoản ra tiền mặt' : 'Withdraw cash from bank account balance')}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono shrink-0 pl-2">
                <div className="text-[10px] text-blue-600 font-medium">
                  {isCashCard ? (lang === 'vi' ? 'Tiền mặt có' : 'Cash bal') : (lang === 'vi' ? 'Số dư TK' : 'Bank bal')}
                </div>
                <div className="text-xs font-bold text-blue-900">
                  {formatMoney(availableBalance, lang)}
                </div>
              </div>
            </div>
          )}


          {/* Source Selector (When isDebtCard, or when isGeneral and NOT transfer) */}
          {(isDebtCard || (isGeneral && txType !== 'transfer')) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-theme-main flex items-center justify-between">
                <span>{txType === 'income' ? (lang === 'vi' ? 'Nguồn nhận tiền' : 'Destination') : t.source_label}</span>
                <span className="text-[11px] text-zinc-500 font-normal">
                  {txType === 'income'
                    ? source === 'account'
                      ? (lang === 'vi' ? 'Cộng vào Tiền tài khoản' : 'Added to Bank')
                      : (lang === 'vi' ? 'Cộng vào Tiền mặt' : 'Added to Cash')
                    : source === 'account'
                    ? (lang === 'vi' ? 'Trừ vào Tiền tài khoản' : 'Deducted from Bank')
                    : (lang === 'vi' ? 'Trừ vào Tiền mặt' : 'Deducted from Cash')}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSource('cash')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    source === 'cash'
                      ? 'bg-emerald-50/90 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${source === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold">{t.source_cash_short}</div>
                    <div className="text-[11px] font-mono font-medium text-emerald-700 truncate">{formatMoney(finances.cash, lang)}</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSource('account')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    source === 'account'
                      ? 'bg-blue-50/90 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${source === 'account' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold">{t.source_account_short}</div>
                    <div className="text-[11px] font-mono font-medium text-blue-700 truncate">{formatMoney(finances.bankAccount, lang)}</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Amount Input with Touchpad */}
          <TouchpadField
            label={txType === 'transfer' ? t.transfer_amount_label : t.amount_label}
            badgeText={`${lang === 'vi' ? 'Khả dụng: ' : 'Available: '} ${formatMoney(availableBalance, lang)}`}
            value={amount}
            onChange={(val) => {
              setAmount(val)
              setError(null)
            }}
            lang={lang}
            placeholder={t.amount_placeholder}
            isOverBalance={isOverBalance}
            title={txType === 'transfer' ? t.transfer_amount_label : t.amount_label}
            presets={isDebtCard ? [500000, 1000000, 2000000] : [50000, 100000, 200000, 500000, 1000000]}
          />

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {isDebtCard ? (
                <>
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
                  <button
                    type="button"
                    onClick={() => handlePreset(2000000)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                  >
                    +2M
                  </button>
                  {finances.totalDebt > 0 && (
                    <button
                      type="button"
                      onClick={handlePayAllDebt}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                    >
                      {lang === 'vi' ? 'Trả hết (100%)' : 'Pay All (100%)'}
                    </button>
                  )}
                </>
              ) : isCashCard ? (
                <>
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
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

          {/* Category Select (Only when NOT transfer) */}
          {txType !== 'transfer' && !isDebtCard && (
            <div className="space-y-1 relative z-20">
              <label className="text-[11px] font-medium text-theme-main flex items-center justify-between">
                <span>{t.category_label}</span>
                {txType === 'expense' && expenseCategory === 'debt' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-normal">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{lang === 'vi' ? 'Tự động trừ vào Tiền nợ' : 'Auto-reduces tracked debt'}</span>
                  </span>
                )}
              </label>
              {!mounted ? (
                <div className="h-10 w-full bg-white border border-theme rounded-lg px-3 flex items-center text-sm text-zinc-900">
                  {txType === 'expense'
                    ? expenseCategoryOptions.find((opt) => opt.value === expenseCategory)?.label ||
                      expenseCategory
                    : incomeCategoryOptions.find((opt) => opt.value === incomeCategory)?.label ||
                      incomeCategory}
                </div>
              ) : txType === 'expense' ? (
                <Select<CategoryOption<ExpenseCategoryType>>
                  instanceId="quick-expense-category-select"
                  menuPortalTarget={mounted && typeof document !== 'undefined' ? document.body : undefined}
                  menuPosition="fixed"
                  isSearchable={false}
                  value={expenseCategoryOptions.find((opt) => opt.value === expenseCategory)}
                  onChange={(option) => {
                    if (option) {
                      setExpenseCategory(option.value)
                      if (option.value !== 'debt') {
                        setSelectedDebtId('')
                      }
                    }
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
                  instanceId="quick-income-category-select"
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
          )}

          {/* If category is debt or debt card, allow picking specific debt from list */}
          {txType === 'expense' && (isDebtCard || expenseCategory === 'debt') && debts && debts.length > 0 && (
            <div className="space-y-1 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <label className="text-[11px] font-semibold text-amber-900 block">
                {t.quick_exp_select_debt}
              </label>
              <select
                value={selectedDebtId}
                onChange={(e) => {
                  const debtId = e.target.value
                  setSelectedDebtId(debtId)
                  const item = debts.find((d) => d.id === debtId)
                  if (item) {
                    setAmount(item.amount.toString())
                    setNote(lang === 'vi' ? `Trả nợ: ${item.title}` : `Repay: ${item.title}`)
                  }
                }}
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
            <label className="text-[11px] font-medium text-theme-main">{t.date_label}</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-base sm:text-sm font-mono-nums border-theme focus-visible:ring-theme/30 h-9"
            />
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-theme-main">{t.note_label}</label>
            <Input
              type="text"
              placeholder={
                txType === 'transfer'
                  ? t.transfer_note_placeholder
                  : isDebtCard
                  ? (lang === 'vi' ? 'VD: Trả nợ thẻ tín dụng Techcombank' : 'E.g., Credit card debt payment')
                  : txType === 'expense'
                  ? (isCashCard
                      ? (lang === 'vi' ? 'VD: Cà phê sáng, ăn trưa...' : 'E.g., Morning coffee, lunch...')
                      : (lang === 'vi' ? 'VD: Quẹt thẻ siêu thị, thanh toán hóa đơn...' : 'E.g., Supermarket, bill payment...'))
                  : (lang === 'vi' ? 'VD: Tiền lương, thưởng...' : 'E.g., Salary, bonus...')
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-base sm:text-sm border-theme focus-visible:ring-theme/30 h-9"
            />
          </div>

          {/* Receipt / Image Attachment (Only for Expense/Income) */}
          {txType !== 'transfer' && (
            <div className="space-y-1 pt-0.5">
              <label className="text-[11px] font-medium text-theme-main">{t.attach_receipt}</label>
              {receiptImage ? (
                <div className="flex items-center space-x-3 p-2 bg-zinc-50 border border-theme rounded-md">
                  <img
                    src={receiptImage}
                    alt="Receipt preview"
                    className="w-12 h-12 object-cover rounded-md border border-zinc-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-700 truncate font-mono">
                      {lang === 'vi' ? 'Đã tải lên 1 hóa đơn' : '1 receipt uploaded'}
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
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!numAmount || numAmount <= 0 || isOverBalance}
            className={`w-full text-white text-xs sm:text-sm font-semibold py-2.5 h-11 shadow-xs cursor-pointer active:opacity-75 transition-opacity ${
              !numAmount || numAmount <= 0 || isOverBalance
                ? 'opacity-50 cursor-not-allowed bg-zinc-200 text-zinc-500'
                : txType === 'transfer'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                : isDebtCard || (txType === 'expense' && expenseCategory === 'debt')
                ? 'bg-rose-600 hover:bg-rose-700'
                : isCashCard
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'btn-theme-gradient'
            }`}
          >
            {txType === 'transfer' ? (
              <>
                <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                <span>{isCashCard ? t.transfer_btn : t.transfer_btn}</span>
              </>
            ) : isDebtCard || (txType === 'expense' && expenseCategory === 'debt') ? (
              <>
                <CornerDownLeft className="w-4 h-4 mr-1.5" />
                <span>{lang === 'vi' ? 'Ghi nhận trả nợ' : 'Record Debt Repayment'}</span>
              </>
            ) : txType === 'income' ? (
              <>
                <ArrowUpCircle className="w-4 h-4 mr-1.5" />
                <span>{isCashCard ? (lang === 'vi' ? 'Cộng vào tiền mặt (+)' : 'Add to Cash (+)') : t.btn_record_income}</span>
              </>
            ) : (
              <>
                <CornerDownLeft className="w-4 h-4 mr-1.5" />
                <span>{isCashCard ? (lang === 'vi' ? 'Ghi nhận chi tiền mặt' : 'Record Cash Expense') : isBankCard ? (lang === 'vi' ? 'Ghi nhận chi tài khoản' : 'Record Bank Expense') : t.btn_record}</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
