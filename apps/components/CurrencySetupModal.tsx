'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { LanguageType, CurrencyType } from '@/lib/types'
import { CURRENCY_METADATA } from '@/lib/i18n'
import { Coins, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface CurrencySetupModalProps {
  open: boolean
  lang: LanguageType
  username: string
  onConfirm: (currency: CurrencyType) => Promise<void> | void
}

export function CurrencySetupModal({ open, lang, username, onConfirm }: CurrencySetupModalProps) {
  // Lần đầu config sẽ phải chọn KRW mặc định
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('KRW')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!open) return null

  const currencies: CurrencyType[] = ['KRW', 'USD', 'VND']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      await onConfirm(selectedCurrency)
    } catch (err: any) {
      setErrorMsg(err?.message || (lang === 'vi' ? 'Không thể thiết lập đơn vị tiền tệ' : 'Failed to set currency'))
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-6 sm:p-7 bg-white shadow-2xl border-theme rounded-2xl space-y-5 relative">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl btn-theme-gradient flex items-center justify-center shadow-md">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-theme-main tracking-tight">
            {lang === 'vi' ? 'Thiết lập đơn vị tiền tệ' : 'Select Account Currency'}
          </h2>
          <p className="text-xs text-zinc-500">
            {lang === 'vi'
              ? `Xin chào @${username}! Vui lòng chọn đơn vị tiền tệ chính cho tài khoản của bạn.`
              : `Hello @${username}! Please choose the primary currency for your account.`}
          </p>
        </div>

        {/* Warning / Lock Notice */}
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs flex items-start space-x-2.5">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">
              {lang === 'vi' ? 'Quy định cố định: ' : 'Fixed Policy: '}
            </span>
            <span>
              {lang === 'vi'
                ? 'Đơn vị tiền tệ chỉ được chọn 1 lần duy nhất trong lần đầu thiết lập và sẽ đi theo tài khoản suốt quá trình sử dụng, không thể thay đổi sau này.'
                : 'Currency can only be chosen once during initial setup and will be permanently bound to this account. It cannot be changed later.'}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Currency Options */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            {currencies.map((code) => {
              const meta = CURRENCY_METADATA[code]
              const isSelected = selectedCurrency === code
              return (
                <div
                  key={code}
                  onClick={() => setSelectedCurrency(code)}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-theme-accent bg-theme-surface/70 shadow-xs'
                      : 'border-theme/60 bg-white hover:bg-theme-surface/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl font-bold font-mono text-base flex items-center justify-center ${
                        isSelected
                          ? 'btn-theme-gradient text-white shadow-2xs'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}
                    >
                      {meta.symbol}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-sm text-theme-main">{code}</span>
                        {code === 'KRW' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                            {lang === 'vi' ? 'Mặc định' : 'Default'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-sans mt-0.5">{meta[lang]}</p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-theme-accent" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-300" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl btn-theme-gradient text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'vi' ? 'Đang lưu thiết lập...' : 'Saving...'}</span>
              </>
            ) : (
              <span>
                {lang === 'vi'
                  ? `Xác nhận sử dụng ${selectedCurrency} (${CURRENCY_METADATA[selectedCurrency].symbol})`
                  : `Confirm & Use ${selectedCurrency} (${CURRENCY_METADATA[selectedCurrency].symbol})`}
              </span>
            )}
          </button>
        </form>
      </Card>
    </div>
  )
}
