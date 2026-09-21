'use client'

import React, { useState } from 'react'
import { LanguageType } from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import { NumericTouchpad } from '@/components/NumericTouchpad'
import { Calculator } from 'lucide-react'

export interface TouchpadFieldProps {
  label?: string
  value: string | number
  onChange: (value: string) => void
  lang?: LanguageType
  placeholder?: string
  max?: number
  presets?: number[]
  title?: string
  error?: string | null
  isOverBalance?: boolean
  className?: string
  badgeText?: string
  disabled?: boolean
}

export function TouchpadField({
  label,
  value,
  onChange,
  lang = 'vi',
  placeholder,
  max,
  presets,
  title,
  error,
  isOverBalance,
  className = '',
  badgeText,
  disabled = false,
}: TouchpadFieldProps) {
  const t = dictionary[lang]
  const [isOpen, setIsOpen] = useState(false)

  const strValue = value === null || value === undefined ? '' : value.toString()
  const numValue = parseFloat(strValue.replace(/,/g, '.')) || 0

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-[11px] font-medium text-theme-main">
          <span>{label}</span>
          {badgeText && (
            <span className="text-[10px] text-theme-muted font-normal">{badgeText}</span>
          )}
        </div>
      )}

      {/* Clickable Display Field that acts as button without invoking OS keyboard */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(true)}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
        className={`w-full h-11 px-3.5 rounded-xl border flex items-center justify-between transition-all select-none ${
          disabled
            ? 'bg-zinc-100/90 text-zinc-500 border-zinc-200 cursor-not-allowed opacity-80'
            : 'bg-white cursor-pointer active:scale-[0.99] ' + (
              error || isOverBalance
                ? 'border-rose-500 ring-2 ring-rose-200/60'
                : isOpen
                ? 'border-theme-accent ring-2 ring-theme-accent/20'
                : 'border-theme hover:border-theme-accent/80 hover:bg-zinc-50/50 shadow-2xs'
            )
        }`}
        title={disabled ? undefined : t.touchpad_open_hint || (lang === 'vi' ? 'Chạm để mở bàn phím số' : 'Tap to enter amount')}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <Calculator className={`w-4 h-4 shrink-0 transition-colors ${isOpen ? 'text-theme-accent' : 'text-zinc-400'}`} />
          <div className="min-w-0 truncate">
            {numValue > 0 ? (
              <span className={`text-base sm:text-lg font-bold font-mono-nums tracking-tight ${
                error || isOverBalance ? 'text-rose-600' : 'text-zinc-900'
              }`}>
                {formatMoney(numValue, lang)}
              </span>
            ) : (
              <span className="text-sm font-mono text-zinc-400">
                {placeholder || `0 ${t.currency_unit}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0 pl-2">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
            {t.currency_unit}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 font-medium">{error}</p>
      )}

      {/* Sheet Touchpad when opened */}
      {isOpen && (
        <NumericTouchpad
          mode="sheet"
          value={value}
          onChange={onChange}
          onDone={() => setIsOpen(false)}
          onClose={() => setIsOpen(false)}
          title={title || label || t.touchpad_title}
          lang={lang}
          max={max}
          presets={presets}
        />
      )}
    </div>
  )
}
