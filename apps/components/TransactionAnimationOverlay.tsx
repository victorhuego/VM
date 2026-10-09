'use client'

import React, { useState, useEffect } from 'react'
import {
  Wallet,
  Building2,
  Unlock,
  Coins,
  ArrowRight,
  ShieldCheck,
  Check,
  Scale,
  Sparkles,
} from 'lucide-react'
import { LanguageType, CurrencyType, ThemeType } from '@/lib/types'
import { formatMoney } from '@/lib/i18n'

export type EffectType =
  | 'income'
  | 'expense'
  | 'withdraw_cash'
  | 'withdraw_savings'
  | 'deposit_savings'
  | 'deposit_cash'
  | 'transfer'
  | 'debt_pay'
  | 'debt_collect'
  | 'debt_add'
  | 'reconcile'

export interface EffectPayload {
  type: EffectType
  amount?: number
  direction?: string
  diff?: number
  debtType?: string
  lang?: LanguageType
  currency?: CurrencyType
  theme?: ThemeType
}

let effectListener: ((payload: EffectPayload) => void) | null = null

export function emitTransactionAnimation(payload: EffectPayload) {
  if (effectListener) {
    effectListener(payload)
  }
}

/**
 * Hook to dynamically track active theme across the document.
 */
function useCurrentTheme(payloadTheme?: ThemeType): ThemeType {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(payloadTheme || 'classic')

  useEffect(() => {
    if (payloadTheme) {
      setCurrentTheme(payloadTheme)
      return
    }

    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme') as ThemeType
      if (themeAttr) {
        setCurrentTheme(themeAttr)
      } else {
        const saved = localStorage.getItem('app_theme') as ThemeType
        if (saved) setCurrentTheme(saved)
      }
    }
    updateTheme()

    const observer = new MutationObserver(() => {
      updateTheme()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [payloadTheme])

  return currentTheme
}

export function TransactionAnimationOverlay() {
  const [activeEffect, setActiveEffect] = useState<{
    id: number
    payload: EffectPayload
  } | null>(null)

  useEffect(() => {
    effectListener = (payload: EffectPayload) => {
      setActiveEffect({
        id: Date.now(),
        payload,
      })
    }
    return () => {
      effectListener = null
    }
  }, [])

  useEffect(() => {
    if (!activeEffect) return
    const timer = setTimeout(() => {
      setActiveEffect(null)
    }, 2200)
    return () => clearTimeout(timer)
  }, [activeEffect])

  const detectedTheme = useCurrentTheme(activeEffect?.payload.theme)

  if (!activeEffect) return null

  const { type, amount, direction, diff, debtType, lang = 'vi', currency } = activeEffect.payload
  const theme = detectedTheme

  return (
    <div
      key={activeEffect.id}
      className={`fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center overflow-hidden font-sans ${
        theme === 'retro' ? 'font-mono' : theme === 'ronin' ? 'font-sans' : ''
      }`}
      aria-hidden="true"
    >
      {type === 'expense' && <ExpenseAnimation amount={amount} lang={lang} currency={currency} theme={theme} />}
      {type === 'withdraw_cash' && <WithdrawCashAnimation amount={amount} lang={lang} currency={currency} theme={theme} />}
      {type === 'withdraw_savings' && <WithdrawSavingsAnimation amount={amount} lang={lang} currency={currency} theme={theme} />}
      {type === 'deposit_savings' && <DepositSavingsAnimation amount={amount} lang={lang} currency={currency} theme={theme} />}
      {type === 'deposit_cash' && <DepositCashAnimation amount={amount} lang={lang} currency={currency} theme={theme} />}
      {type === 'transfer' && <TransferAnimation amount={amount} direction={direction} lang={lang} currency={currency} theme={theme} />}
      {type === 'debt_pay' && <DebtPayAnimation amount={amount} lang={lang} currency={currency} theme={theme} />}
      {type === 'debt_collect' && <DebtCollectAnimation amount={amount} lang={lang} currency={currency} theme={theme} />}
      {type === 'debt_add' && <DebtAddAnimation amount={amount} debtType={debtType} lang={lang} currency={currency} theme={theme} />}
      {type === 'reconcile' && <ReconcileAnimation diff={diff ?? 0} lang={lang} currency={currency} theme={theme} />}
      {type === 'income' && <IncomeAnimation amount={amount} lang={lang} currency={currency} theme={theme} />}
    </div>
  )
}

/* =========================================================================
   1. EXPENSE ANIMATION (Gió cuốn tiền bay đi 💸 + Badge "-$ [số tiền]")
   ========================================================================= */
function ExpenseAnimation({
  amount,
  lang,
  currency,
  theme,
}: {
  amount?: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const amountStr = amount && amount > 0 ? `-${formatMoney(amount, lang, currency)}` : '-$'

  // Theme-specific styles for Badge
  const badgeClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black !shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#fff]'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-gradient-to-r !from-[#7F0910] !via-[#99111D] !to-[#E52535] !border !border-[#FF3B4E] !shadow-[0_0_24px_rgba(229,37,53,0.8)] !text-white'
      : theme === 'fantasy'
      ? '!rounded-2xl !bg-gradient-to-r !from-[#162132] !to-[#1E2533] !border-2 !border-[#D3BC8E] !shadow-[0_0_24px_rgba(211,188,142,0.5)] !text-[#FFE5A3]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-gradient-to-r !from-[#EA5C79] !to-[#F06784] !border-2 !border-[#FDE8ED] !shadow-[0_8px_24px_rgba(234,92,121,0.4)] !text-white'
      : '!rounded-2xl !bg-gradient-to-r !from-rose-600 !via-rose-500 !to-red-500 !border !border-rose-300/40 !shadow-2xl !text-white'

  // Theme-specific banknote colors
  const billColors =
    theme === 'retro'
      ? ['#008080', '#808080', '#000080', '#A0A0A0', '#555555']
      : theme === 'ronin'
      ? ['#E52535', '#FF1E38', '#99111D', '#3A080D', '#E52535']
      : theme === 'fantasy'
      ? ['#D3BC8E', '#FFE5A3', '#E5C992', '#8E9FAC', '#C9A364']
      : theme === 'cozy'
      ? ['#EA5C79', '#F06784', '#A86B4D', '#E8D9CB', '#F89EB0']
      : ['#F43F5E', '#FB7185', '#F97316', '#E11D48', '#FDA4AF']

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Trung tâm: Badge "-$ [số tiền]" */}
      <div className="animate-expense-badge flex flex-col items-center z-30">
        <div className={`px-5 py-2.5 backdrop-blur-md flex items-center gap-3 ${badgeClasses}`}>
          <span className="text-2xl animate-bounce">
            {theme === 'ronin' ? '🩸' : theme === 'retro' ? '💾' : theme === 'fantasy' ? '✨' : '💸'}
          </span>
          <div className="flex flex-col items-start leading-tight">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider ${
                theme === 'retro'
                  ? 'text-zinc-600'
                  : theme === 'fantasy'
                  ? 'text-[#D3BC8E]'
                  : theme === 'ronin'
                  ? 'text-red-300'
                  : 'text-rose-200'
              }`}
            >
              {lang === 'vi' ? 'Chi tiêu' : 'Expense'}
            </span>
            <span
              className={`text-base sm:text-lg font-extrabold tracking-tight font-mono ${
                theme === 'retro' ? 'text-red-700' : theme === 'fantasy' ? 'text-[#FFE5A3]' : 'text-white'
              }`}
            >
              {amountStr}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Tờ tiền uốn lượn bay bổng */}
      <div className="absolute animate-bill-float-1 bottom-1/3 left-1/2 -translate-x-1/2">
        <ThemedBanknoteSVG color={billColors[0]} theme={theme} />
      </div>
      <div className="absolute animate-bill-float-2 bottom-1/3 left-1/2 -translate-x-1/2">
        <ThemedBanknoteSVG color={billColors[1]} theme={theme} />
      </div>
      <div className="absolute animate-bill-float-3 bottom-1/3 left-1/2 -translate-x-1/2">
        <ThemedBanknoteSVG color={billColors[2]} theme={theme} />
      </div>
      <div className="absolute animate-bill-float-4 bottom-1/3 left-1/2 -translate-x-1/2">
        <ThemedBanknoteSVG color={billColors[3]} theme={theme} />
      </div>
      <div className="absolute animate-bill-float-5 bottom-1/3 left-1/2 -translate-x-1/2">
        <ThemedBanknoteSVG color={billColors[4]} theme={theme} />
      </div>
    </div>
  )
}

/* =========================================================================
   2. WITHDRAW CASH ANIMATION (Máy ATM nhả tiền mặt 💵 🏧)
   ========================================================================= */
function WithdrawCashAnimation({
  amount,
  lang,
  currency,
  theme,
}: {
  amount?: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const amountStr = amount && amount > 0 ? formatMoney(amount, lang, currency) : '500.000 đ'

  const atmBoxClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !shadow-none'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#0C0D0F] !border !border-[#FF3B4E] !shadow-[0_0_24px_rgba(229,37,53,0.6)]'
      : theme === 'fantasy'
      ? '!rounded-2xl !bg-[#141C2A] !border-2 !border-[#D3BC8E] !shadow-[0_0_24px_rgba(211,188,142,0.4)]'
      : theme === 'cozy'
      ? '!rounded-2xl !bg-[#FAF5ED] !border-2 !border-[#E8D9CB] !shadow-xl'
      : 'bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-xl border border-zinc-700 shadow-2xl'

  const noteColor =
    theme === 'retro'
      ? '#008080'
      : theme === 'ronin'
      ? '#99111D'
      : theme === 'fantasy'
      ? '#BFA067'
      : theme === 'cozy'
      ? '#A86B4D'
      : '#0D9488'

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end pb-20 sm:pb-28">
      <div className="animate-atm-slide flex flex-col items-center">
        {/* Xấp tiền trượt ra */}
        <div className="relative w-64 h-40 flex items-center justify-center">
          <div className="absolute animate-cash-note-1">
            <ThemedRealBanknoteSVG text={amountStr} color={noteColor} theme={theme} />
          </div>
          <div className="absolute animate-cash-note-2">
            <ThemedRealBanknoteSVG text={amountStr} color={noteColor} theme={theme} />
          </div>
          <div className="absolute animate-cash-note-3">
            <ThemedRealBanknoteSVG text={amountStr} color={noteColor} theme={theme} />
          </div>
          <div className="absolute animate-cash-note-4">
            <ThemedRealBanknoteSVG text={amountStr} color={noteColor} theme={theme} />
          </div>
        </div>

        {/* Khung máy ATM */}
        <div className={`w-72 h-10 flex items-center justify-between px-3 relative z-20 ${atmBoxClasses}`}>
          <div
            className={`w-3 h-3 rounded-full animate-ping ${
              theme === 'ronin' ? 'bg-[#FF1E38]' : theme === 'fantasy' ? 'bg-[#FFE5A3]' : 'bg-emerald-400'
            }`}
          />
          <div className="h-1.5 flex-1 mx-3 bg-zinc-950/40 rounded-full shadow-inner" />
          <span
            className={`text-[11px] font-mono font-bold tracking-wider ${
              theme === 'retro'
                ? 'text-black'
                : theme === 'ronin'
                ? 'text-[#FF3B4E]'
                : theme === 'fantasy'
                ? 'text-[#FFE5A3]'
                : 'text-emerald-400'
            }`}
          >
            {theme === 'retro' ? 'WIN95 ATM:' : 'ATM DISPENSE:'} -{amountStr}
          </span>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   3. WITHDRAW SAVINGS ANIMATION (Mở khóa két sắt 🔓)
   ========================================================================= */
function WithdrawSavingsAnimation({
  amount,
  lang,
  currency,
  theme,
}: {
  amount?: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const amountStr = amount && amount > 0 ? `+${formatMoney(amount, lang, currency)}` : 'Mở khóa quỹ'

  const boxClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black !shadow-none'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#07090C] !border !border-[#FF3B4E] !shadow-[0_0_24px_rgba(229,37,53,0.7)] !text-white'
      : theme === 'fantasy'
      ? '!rounded-3xl !bg-[#162132] !border-2 !border-[#D3BC8E] !shadow-[0_0_30px_rgba(211,188,142,0.6)] !text-[#FFE5A3]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-[#FFFDF9] !border-2 !border-[#E8D9CB] !shadow-2xl !text-[#3E271E]'
      : 'rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border-2 border-indigo-400 shadow-2xl text-indigo-100'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className={`absolute w-24 h-24 rounded-full border-4 animate-vault-shockwave ${
          theme === 'ronin'
            ? 'border-red-500/80'
            : theme === 'fantasy'
            ? 'border-[#FFE5A3]/80'
            : theme === 'cozy'
            ? 'border-[#EA5C79]/80'
            : 'border-indigo-400/80'
        }`}
      />

      <div className="animate-vault-pop flex flex-col items-center z-20">
        <div className={`relative w-28 h-28 flex items-center justify-center ${boxClasses}`}>
          <div
            className={`animate-shackle-unlock ${
              theme === 'ronin'
                ? 'text-[#FF3B4E]'
                : theme === 'fantasy'
                ? 'text-[#FFE5A3]'
                : theme === 'retro'
                ? 'text-black'
                : 'text-amber-300'
            }`}
          >
            <Unlock className="w-14 h-14" />
          </div>
        </div>
        <div className={`mt-3 px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 ${boxClasses}`}>
          <span>🔓</span>
          <span>{lang === 'vi' ? 'Rút về tài khoản:' : 'Withdrawn:'} {amountStr}</span>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   4. DEPOSIT SAVINGS ANIMATION (Đồng xu vàng rơi vào két 🪙 🏦)
   ========================================================================= */
function DepositSavingsAnimation({
  amount,
  lang,
  currency,
  theme,
}: {
  amount?: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const amountStr = amount && amount > 0 ? `+${formatMoney(amount, lang, currency)}` : 'Tích lũy'

  const safeBoxClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black !shadow-none'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#121417] !border !border-[#FF3B4E] !shadow-[0_0_24px_rgba(229,37,53,0.7)] !text-white'
      : theme === 'fantasy'
      ? '!rounded-3xl !bg-gradient-to-br !from-[#D3BC8E] !via-[#FFE5A3] !to-[#C9A364] !border-2 !border-[#FFF0C2] !text-[#1E2533] !shadow-[0_0_30px_rgba(255,229,163,0.6)]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-gradient-to-br !from-[#F5ECE2] !to-[#FAF5ED] !border-2 !border-[#E8D9CB] !text-[#3E271E] !shadow-xl'
      : 'rounded-3xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-700 border-2 border-yellow-200 shadow-2xl text-amber-950'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="animate-piggy-bounce relative flex flex-col items-center z-20">
        <div className="absolute -top-24 animate-coin-drop-1">
          <ThemedGoldCoinSVG size={36} theme={theme} />
        </div>
        <div className="absolute -top-24 animate-coin-drop-2">
          <ThemedGoldCoinSVG size={32} theme={theme} />
        </div>
        <div className="absolute -top-24 animate-coin-drop-3">
          <ThemedGoldCoinSVG size={40} theme={theme} />
        </div>

        <div className={`w-28 h-28 flex flex-col items-center justify-center ${safeBoxClasses}`}>
          <div className="w-12 h-2 bg-black/40 rounded-full mb-2 shadow-inner" />
          <Coins className="w-10 h-10 drop-shadow-md" />
        </div>
        <div className={`mt-3 px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 ${safeBoxClasses}`}>
          <span>🏦</span>
          <span>{lang === 'vi' ? 'Gửi tiết kiệm:' : 'Savings:'} {amountStr}</span>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   5. DEPOSIT CASH ANIMATION (Nạp tiền mặt vào tài khoản 💳 ⚡)
   ========================================================================= */
function DepositCashAnimation({
  amount,
  lang,
  currency,
  theme,
}: {
  amount?: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const amountStr = amount && amount > 0 ? `+${formatMoney(amount, lang, currency)}` : 'Nạp tiền'

  const cardClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#000080] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-white'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#07090C] !border !border-[#FF3B4E] !shadow-[0_0_20px_rgba(229,37,53,0.7)] !text-white'
      : theme === 'fantasy'
      ? '!rounded-2xl !bg-[#141C2A] !border-2 !border-[#D3BC8E] !text-[#FFE5A3]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-[#FAF5ED] !border-2 !border-[#EA5C79] !text-[#3E271E]'
      : 'rounded-2xl bg-gradient-to-b from-cyan-500 to-blue-600 border border-cyan-300 text-white'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="animate-deposit-beam flex flex-col items-center z-20">
        <div className={`w-24 h-32 p-2.5 flex flex-col justify-between shadow-2xl ${cardClasses}`}>
          <div className="w-7 h-5 rounded-sm bg-yellow-300/80" />
          <Building2 className="w-10 h-10 self-center" />
          <div className="text-[10px] font-mono tracking-widest text-center">BANK DEPOSIT</div>
        </div>
        <div className={`mt-3 px-4 py-2 text-xs sm:text-sm font-bold shadow-xl ${cardClasses}`}>
          {lang === 'vi' ? 'Đã nạp vào tài khoản:' : 'Deposited:'} {amountStr}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   6. TRANSFER ANIMATION (Chuyển dịch dòng tiền 💳 ➔ 👛)
   ========================================================================= */
function TransferAnimation({
  amount,
  direction,
  lang,
  currency,
  theme,
}: {
  amount?: number
  direction?: string
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const isBankToCash = direction === 'bank_to_cash'
  const amountStr = amount && amount > 0 ? formatMoney(amount, lang, currency) : 'Chuyển tiền'

  const walletClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#0C0D0F] !border !border-[#FF3B4E] !shadow-[0_0_16px_rgba(229,37,53,0.7)] !text-white'
      : theme === 'fantasy'
      ? '!rounded-2xl !bg-[#162132] !border-2 !border-[#D3BC8E] !text-[#FFE5A3]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-[#FFFDF9] !border-2 !border-[#E8D9CB] !text-[#3E271E]'
      : 'rounded-2xl bg-zinc-900 border border-zinc-700 text-white'

  return (
    <div className="relative w-full max-w-sm px-6 h-full flex items-center justify-between mx-auto">
      {/* Nguồn */}
      <div className="animate-transfer-left flex flex-col items-center">
        <div className={`w-16 h-16 flex items-center justify-center shadow-xl ${walletClasses}`}>
          {isBankToCash ? <Building2 className="w-8 h-8" /> : <Wallet className="w-8 h-8" />}
        </div>
        <span className="text-[11px] font-semibold mt-1.5 opacity-90">
          {isBankToCash ? (lang === 'vi' ? 'Ngân hàng' : 'Bank') : (lang === 'vi' ? 'Tiền mặt' : 'Cash')}
        </span>
      </div>

      {/* Dòng năng lượng ở giữa */}
      <div className="flex-1 mx-3 flex flex-col items-center relative">
        <div className={`px-2.5 py-1 text-[11px] font-mono font-bold mb-1 shadow-lg ${walletClasses}`}>
          {amountStr}
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
          <div
            className={`w-1/2 h-full animate-transfer-beam ${
              theme === 'ronin'
                ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-400'
                : theme === 'fantasy'
                ? 'bg-gradient-to-r from-[#D3BC8E] via-[#FFE5A3] to-sky-400'
                : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400'
            }`}
          />
        </div>
        <div className="animate-transfer-arrow mt-1 text-cyan-400">
          <ArrowRight className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {/* Đích */}
      <div className="animate-transfer-right flex flex-col items-center">
        <div className={`w-16 h-16 flex items-center justify-center shadow-xl ${walletClasses}`}>
          {isBankToCash ? <Wallet className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
        </div>
        <span className="text-[11px] font-semibold mt-1.5 opacity-90">
          {isBankToCash ? (lang === 'vi' ? 'Tiền mặt' : 'Cash') : (lang === 'vi' ? 'Ngân hàng' : 'Bank')}
        </span>
      </div>
    </div>
  )
}

/* =========================================================================
   7. DEBT PAY ANIMATION (Trả nợ / Cởi bỏ gánh nặng 🕊️ ✨)
   ========================================================================= */
function DebtPayAnimation({
  amount,
  lang,
  currency,
  theme,
}: {
  amount?: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const amountStr = amount && amount > 0 ? `-${formatMoney(amount, lang, currency)}` : ''

  const stampClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#0C0D0F] !border-2 !border-[#FF3B4E] !shadow-[0_0_24px_rgba(229,37,53,0.8)] !text-white'
      : theme === 'fantasy'
      ? '!rounded-3xl !bg-[#162132] !border-2 !border-[#D3BC8E] !text-[#FFE5A3] !shadow-[0_0_24px_rgba(211,188,142,0.6)]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-[#FAF5ED] !border-2 !border-[#EA5C79] !text-[#3E271E] !shadow-xl'
      : 'rounded-2xl bg-emerald-950/95 border border-emerald-400/60 shadow-2xl text-emerald-200'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="animate-debt-pay-stamp flex flex-col items-center z-20">
        <div
          className={`relative w-28 h-28 flex items-center justify-center shadow-2xl ${
            theme === 'retro'
              ? '!rounded-none !bg-[#000080] !text-white !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080]'
              : theme === 'ronin'
              ? '!rounded-none katana-cut !bg-[#99111D] !text-white !border-2 !border-[#FF3B4E]'
              : 'rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 border-4 border-white text-white'
          }`}
        >
          <ShieldCheck className="w-16 h-16 animate-bounce" />
        </div>
        <div className={`mt-4 px-5 py-2 flex items-center gap-2 shadow-2xl ${stampClasses}`}>
          <span className="text-xl">🕊️</span>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] uppercase font-bold opacity-90">
              {lang === 'vi' ? 'Đã thanh toán nợ' : 'Debt Repaid'}
            </span>
            {amountStr && <span className="text-sm font-extrabold font-mono">{amountStr}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   8. DEBT COLLECT ANIMATION (Nam châm hút tài lộc 🧲 💰)
   ========================================================================= */
function DebtCollectAnimation({
  amount,
  lang,
  currency,
  theme,
}: {
  amount?: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const amountStr = amount && amount > 0 ? `+${formatMoney(amount, lang, currency)}` : ''

  const magnetClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#0C0D0F] !border !border-[#FF3B4E] !text-[#FF3B4E] !shadow-[0_0_24px_rgba(229,37,53,0.8)]'
      : theme === 'fantasy'
      ? '!rounded-3xl !bg-[#162132] !border-2 !border-[#D3BC8E] !text-[#FFE5A3] !shadow-[0_0_24px_rgba(211,188,142,0.6)]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-[#FFFDF9] !border-2 !border-[#E8D9CB] !text-[#3E271E] !shadow-xl'
      : 'rounded-xl bg-amber-900/95 border border-amber-400/50 shadow-2xl text-amber-100'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="animate-magnet-pulse flex flex-col items-center z-10">
        <div
          className={`w-24 h-24 flex items-center justify-center shadow-2xl ${
            theme === 'retro'
              ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080]'
              : theme === 'ronin'
              ? '!rounded-none katana-cut !bg-[#7F0910] !border-2 !border-[#FF3B4E]'
              : 'rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 border-4 border-amber-200 text-amber-950'
          }`}
        >
          <span className="text-4xl">🧲</span>
        </div>
        <div className={`mt-3 px-5 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 ${magnetClasses}`}>
          <span>🎯</span>
          <span>{lang === 'vi' ? 'Thu nợ:' : 'Collected:'} {amountStr}</span>
        </div>
      </div>

      <div className="absolute animate-coin-pull-top">
        <ThemedGoldCoinSVG size={32} theme={theme} />
      </div>
      <div className="absolute animate-coin-pull-bottom">
        <ThemedGoldCoinSVG size={36} theme={theme} />
      </div>
      <div className="absolute animate-coin-pull-left">
        <ThemedGoldCoinSVG size={30} theme={theme} />
      </div>
      <div className="absolute animate-coin-pull-right">
        <ThemedGoldCoinSVG size={34} theme={theme} />
      </div>
    </div>
  )
}

/* =========================================================================
   9. DEBT ADD ANIMATION (Ghi nhận thỏa thuận 📝)
   ========================================================================= */
function DebtAddAnimation({
  amount,
  debtType,
  lang,
  currency,
  theme,
}: {
  amount?: number
  debtType?: string
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const isReceivable = debtType === 'receivable'
  const amountStr = amount && amount > 0 ? formatMoney(amount, lang, currency) : ''

  const cardClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#0C0D0F] !border !border-[#FF3B4E] !text-white'
      : theme === 'fantasy'
      ? '!rounded-2xl !bg-[#162132] !border-2 !border-[#D3BC8E] !text-[#FFE5A3]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-[#FFFDF9] !border-2 !border-[#E8D9CB] !text-[#3E271E]'
      : 'rounded-2xl bg-zinc-900/95 border border-zinc-700 text-white'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="animate-debt-add-card flex flex-col items-center z-20">
        <div className={`px-5 py-3 shadow-2xl flex items-center gap-3 backdrop-blur-md ${cardClasses}`}>
          <span className="text-2xl">{isReceivable ? '🤝' : '📋'}</span>
          <div>
            <div className="text-xs opacity-75 font-medium">
              {isReceivable ? (lang === 'vi' ? 'Cho vay / Cần thu' : 'Receivable') : (lang === 'vi' ? 'Khoản nợ mới' : 'Payable')}
            </div>
            {amountStr && <div className="text-sm font-bold font-mono text-amber-400">{amountStr}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   10. RECONCILE ANIMATION (Cán cân cân bằng ⚖️)
   ========================================================================= */
function ReconcileAnimation({
  diff,
  lang,
  currency,
  theme,
}: {
  diff: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const isSurplus = diff >= 0
  const diffStr = diff !== 0 ? `${diff > 0 ? '+' : ''}${formatMoney(diff, lang, currency)}` : ''

  const scaleClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-[#0C0D0F] !border !border-[#FF3B4E] !text-white'
      : theme === 'fantasy'
      ? '!rounded-3xl !bg-[#162132] !border-2 !border-[#D3BC8E] !text-[#FFE5A3]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-[#FFFDF9] !border-2 !border-[#E8D9CB] !text-[#3E271E]'
      : 'rounded-2xl bg-zinc-800 text-white border border-zinc-700'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="animate-scale-balance flex flex-col items-center z-20">
        <div
          className={`w-24 h-24 flex items-center justify-center shadow-2xl ${
            theme === 'retro'
              ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080]'
              : theme === 'ronin'
              ? '!rounded-none katana-cut !bg-[#121417] !border !border-[#FF3B4E]'
              : 'rounded-3xl bg-zinc-900/95 border border-zinc-700'
          }`}
        >
          <Scale className={`w-12 h-12 ${theme === 'ronin' ? 'text-[#FF3B4E]' : 'text-emerald-400'}`} />
        </div>
        <div className={`mt-3 px-4 py-2 text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2 ${scaleClasses}`}>
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{isSurplus ? (lang === 'vi' ? 'Thặng dư' : 'Surplus') : (lang === 'vi' ? 'Đã cân đối' : 'Reconciled')} {diffStr}</span>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   11. INCOME ANIMATION (Chúc mừng tài lộc 💰 ✨ + Badge "+$ [số tiền]")
   ========================================================================= */
function IncomeAnimation({
  amount,
  lang,
  currency,
  theme,
}: {
  amount?: number
  lang: LanguageType
  currency?: CurrencyType
  theme: ThemeType
}) {
  const amountStr = amount && amount > 0 ? `+${formatMoney(amount, lang, currency)}` : '+$'

  const badgeClasses =
    theme === 'retro'
      ? '!rounded-none !bg-[#C0C0C0] !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080] !text-black !shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#fff]'
      : theme === 'ronin'
      ? '!rounded-none katana-cut !bg-gradient-to-r !from-[#7F0910] !via-[#99111D] !to-[#E52535] !border !border-[#FF3B4E] !shadow-[0_0_24px_rgba(229,37,53,0.8)] !text-white'
      : theme === 'fantasy'
      ? '!rounded-2xl !bg-gradient-to-r !from-[#162132] !to-[#1E2533] !border-2 !border-[#D3BC8E] !shadow-[0_0_24px_rgba(211,188,142,0.6)] !text-[#FFE5A3]'
      : theme === 'cozy'
      ? '!rounded-3xl !bg-gradient-to-r !from-[#10B981] !to-[#34D399] !border-2 !border-[#E8D9CB] !shadow-[0_8px_24px_rgba(16,185,129,0.4)] !text-white'
      : '!rounded-2xl !bg-gradient-to-r !from-emerald-700 !via-emerald-600 !to-teal-600 !border !border-emerald-300/50 !shadow-2xl !text-white'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="animate-income-burst flex flex-col items-center z-30">
        <div
          className={`w-24 h-24 flex items-center justify-center shadow-2xl ${
            theme === 'retro'
              ? '!rounded-none !bg-[#000080] !text-white !border-2 !border-t-white !border-l-white !border-r-[#808080] !border-b-[#808080]'
              : theme === 'ronin'
              ? '!rounded-none katana-cut !bg-[#E52535] !text-white !border !border-[#FF3B4E]'
              : theme === 'fantasy'
              ? '!rounded-3xl !bg-[#FFE5A3] !text-[#1E2533] !border-2 !border-[#FFF0C2]'
              : 'rounded-full bg-gradient-to-tr from-emerald-500 to-green-300 border-4 border-white text-white'
          }`}
        >
          <Sparkles className="w-12 h-12" />
        </div>
        <div className={`mt-3 px-5 py-2.5 backdrop-blur-md flex items-center gap-3 ${badgeClasses}`}>
          <span className="text-2xl animate-bounce">
            {theme === 'ronin' ? '🔥' : theme === 'retro' ? '💰' : theme === 'fantasy' ? '⭐' : '💰'}
          </span>
          <div className="flex flex-col items-start leading-tight">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider ${
                theme === 'retro' ? 'text-zinc-600' : theme === 'fantasy' ? 'text-[#D3BC8E]' : 'text-emerald-200'
              }`}
            >
              {lang === 'vi' ? 'Thu nhập' : 'Income'}
            </span>
            <span
              className={`text-base sm:text-lg font-extrabold tracking-tight font-mono ${
                theme === 'retro' ? 'text-emerald-700' : theme === 'fantasy' ? 'text-[#FFE5A3]' : 'text-emerald-100'
              }`}
            >
              {amountStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   THEMED SVG HELPERS
   ========================================================================= */
function ThemedBanknoteSVG({ color = '#10B981', theme }: { color?: string; theme: ThemeType }) {
  if (theme === 'retro') {
    // Windows 95 8-bit Pixel Banknote
    return (
      <svg width="120" height="64" viewBox="0 0 120 64" fill="none" className="drop-shadow-none">
        <rect x="0" y="0" width="120" height="64" fill="#C0C0C0" stroke="#000000" strokeWidth="2" />
        <rect x="4" y="4" width="112" height="56" fill={color} fillOpacity="0.8" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="60" cy="32" r="14" fill="#C0C0C0" stroke="#000000" strokeWidth="2" />
        <text x="60" y="37" textAnchor="middle" fill="#000000" fontSize="13" fontWeight="bold" fontFamily="monospace">
          $
        </text>
      </svg>
    )
  }

  if (theme === 'ronin') {
    // Cyber Samurai Card
    return (
      <svg width="120" height="64" viewBox="0 0 120 64" fill="none" className="drop-shadow-[0_0_12px_rgba(229,37,53,0.8)]">
        <path d="M0 0 L110 0 L120 10 L120 64 L10 64 L0 54 Z" fill="#0C0D0F" stroke="#FF3B4E" strokeWidth="2" />
        <line x1="10" y1="20" x2="110" y2="20" stroke="#E52535" strokeWidth="1" strokeDasharray="4 2" />
        <circle cx="60" cy="36" r="12" fill="#E52535" fillOpacity="0.4" stroke="#FF1E38" strokeWidth="1.5" />
        <text x="60" y="41" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
          ¥
        </text>
      </svg>
    )
  }

  if (theme === 'fantasy') {
    // Genshin Celestial Mora Scroll
    return (
      <svg width="120" height="64" viewBox="0 0 120 64" fill="none" className="drop-shadow-[0_0_12px_rgba(211,188,142,0.6)]">
        <rect x="2" y="2" width="116" height="60" rx="10" fill="#162132" stroke="#D3BC8E" strokeWidth="2" />
        <rect x="6" y="6" width="108" height="52" rx="6" stroke="#FFE5A3" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="60" cy="32" r="14" fill="#FFE5A3" fillOpacity="0.25" stroke="#FFE5A3" strokeWidth="1.5" />
        <text x="60" y="37" textAnchor="middle" fill="#FFE5A3" fontSize="14" fontWeight="bold" fontFamily="serif">
          ✦
        </text>
      </svg>
    )
  }

  // Classic & Cozy
  return (
    <svg width="120" height="64" viewBox="0 0 120 64" fill="none" className="drop-shadow-lg">
      <rect x="2" y="2" width="116" height="60" rx={theme === 'cozy' ? '14' : '8'} fill={color} fillOpacity="0.88" stroke="#FFFFFF" strokeWidth="2" />
      <rect x="8" y="8" width="104" height="48" rx={theme === 'cozy' ? '8' : '4'} stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="60" cy="32" r="14" fill="#FFFFFF" fillOpacity="0.3" stroke="#FFFFFF" strokeWidth="1.5" />
      <text x="60" y="37" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
        $
      </text>
    </svg>
  )
}

function ThemedRealBanknoteSVG({ text = '500.000', color = '#0D9488', theme }: { text?: string; color?: string; theme: ThemeType }) {
  if (theme === 'retro') {
    return (
      <svg width="170" height="90" viewBox="0 0 170 90" fill="none" className="drop-shadow-none">
        <rect x="0" y="0" width="170" height="90" fill="#C0C0C0" stroke="#000000" strokeWidth="2" />
        <rect x="6" y="6" width="158" height="78" fill="#008080" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="85" cy="45" r="18" fill="#C0C0C0" stroke="#000000" strokeWidth="1.5" />
        <text x="85" y="49" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="bold" fontFamily="monospace">
          {text}
        </text>
        <text x="14" y="22" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
          WIN95
        </text>
      </svg>
    )
  }

  if (theme === 'ronin') {
    return (
      <svg width="170" height="90" viewBox="0 0 170 90" fill="none" className="drop-shadow-[0_0_16px_rgba(229,37,53,0.7)]">
        <path d="M0 0 L155 0 L170 15 L170 90 L15 90 L0 75 Z" fill="#07090C" stroke="#FF3B4E" strokeWidth="2" />
        <circle cx="85" cy="45" r="18" fill="#E52535" fillOpacity="0.3" stroke="#FF1E38" strokeWidth="1.5" />
        <text x="85" y="49" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="monospace">
          {text}
        </text>
        <text x="16" y="22" fill="#FF3B4E" fontSize="9" fontWeight="bold" fontFamily="monospace">
          RONIN
        </text>
      </svg>
    )
  }

  return (
    <svg width="170" height="90" viewBox="0 0 170 90" fill="none" className="drop-shadow-2xl">
      <rect x="2" y="2" width="166" height="86" rx={theme === 'cozy' ? '14' : '8'} fill={color} stroke="#FFFFFF" strokeWidth="2" />
      <rect x="8" y="8" width="154" height="74" rx={theme === 'cozy' ? '8' : '5'} stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="85" cy="45" r="18" fill="#FFFFFF" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="1.5" />
      <text x="85" y="49" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="monospace">
        {text}
      </text>
      <text x="18" y="24" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
        CASH
      </text>
      <text x="152" y="76" textAnchor="end" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
        ATM
      </text>
    </svg>
  )
}

function ThemedGoldCoinSVG({ size = 32, theme }: { size?: number; theme: ThemeType }) {
  if (theme === 'retro') {
    // 8-bit Windows 95 Pixel Coin
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="drop-shadow-none">
        <rect x="4" y="4" width="32" height="32" fill="#C0C0C0" stroke="#000000" strokeWidth="2" />
        <rect x="8" y="8" width="24" height="24" fill="#FFFF00" stroke="#808080" strokeWidth="1" />
        <text x="20" y="26" textAnchor="middle" fill="#000000" fontSize="15" fontWeight="bold" fontFamily="monospace">
          $
        </text>
      </svg>
    )
  }

  if (theme === 'fantasy') {
    // Genshin Mora Coin
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="drop-shadow-[0_0_10px_rgba(255,229,163,0.8)]">
        <circle cx="20" cy="20" r="18" fill="#FFE5A3" stroke="#D3BC8E" strokeWidth="2" />
        <circle cx="20" cy="20" r="14" stroke="#BFA067" strokeWidth="1.5" />
        <text x="20" y="26" textAnchor="middle" fill="#78350F" fontSize="16" fontWeight="bold">
          ✦
        </text>
      </svg>
    )
  }

  if (theme === 'ronin') {
    // Cyber Red Coin / Token
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="drop-shadow-[0_0_10px_rgba(229,37,53,0.8)]">
        <circle cx="20" cy="20" r="18" fill="#0C0D0F" stroke="#FF3B4E" strokeWidth="2" />
        <circle cx="20" cy="20" r="13" stroke="#E52535" strokeWidth="1" strokeDasharray="3 3" />
        <text x="20" y="25" textAnchor="middle" fill="#FF1E38" fontSize="13" fontWeight="bold">
          刃
        </text>
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="drop-shadow-lg">
      <circle cx="20" cy="20" r="18" fill="url(#goldGrad)" stroke="#FEF08A" strokeWidth="2" />
      <circle cx="20" cy="20" r="14" stroke="#B45309" strokeWidth="1" strokeDasharray="2 2" />
      <text x="20" y="25" textAnchor="middle" fill="#78350F" fontSize="15" fontWeight="bold">
        ★
      </text>
      <defs>
        <radialGradient id="goldGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
      </defs>
    </svg>
  )
}
