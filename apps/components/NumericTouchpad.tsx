'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { LanguageType } from '@/lib/types'
import { dictionary, formatMoney } from '@/lib/i18n'
import { Delete, Check, RotateCcw, X, Calculator } from 'lucide-react'

export interface NumericTouchpadProps {
  value: string | number
  onChange: (value: string) => void
  onDone?: () => void
  onClose?: () => void
  title?: string
  lang?: LanguageType
  max?: number
  presets?: number[]
  showPresets?: boolean
  allowDecimal?: boolean
  mode?: 'inline' | 'sheet'
  className?: string
}

export function NumericTouchpad({
  value,
  onChange,
  onDone,
  onClose,
  title,
  lang = 'vi',
  max,
  presets = [50000, 100000, 200000, 500000, 1000000],
  showPresets = true,
  allowDecimal = false,
  mode = 'inline',
  className = '',
}: NumericTouchpadProps) {
  const t = dictionary[lang]
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const strValue = value === null || value === undefined ? '' : value.toString()
  const numValue = parseFloat(strValue.replace(/,/g, '.')) || 0

  // Keypad Actions
  const handleDigit = useCallback(
    (digit: string) => {
      if (digit === '000') {
        if (!strValue || strValue === '0') return
        const next = strValue + '000'
        if (max && parseFloat(next) > max) {
          onChange(max.toString())
        } else {
          onChange(next)
        }
        return
      }

      if (digit === '.') {
        if (!allowDecimal) return
        if (strValue.includes('.')) return
        onChange(strValue ? `${strValue}.` : '0.')
        return
      }

      // Normal digit 0-9
      if (strValue === '0') {
        onChange(digit)
      } else {
        const next = strValue + digit
        if (max && parseFloat(next) > max) {
          onChange(max.toString())
        } else {
          onChange(next)
        }
      }
    },
    [strValue, max, allowDecimal, onChange]
  )

  const handleBackspace = useCallback(() => {
    if (!strValue || strValue.length <= 1) {
      onChange('')
    } else {
      onChange(strValue.slice(0, -1))
    }
  }, [strValue, onChange])

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  const handleAddPreset = useCallback(
    (amountToAdd: number) => {
      const next = numValue + amountToAdd
      if (max && next > max) {
        onChange(max.toString())
      } else {
        onChange(next.toString())
      }
    },
    [numValue, max, onChange]
  )

  const handleSetMax = useCallback(() => {
    if (max !== undefined) {
      onChange(max.toString())
    }
  }, [max, onChange])

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an actual text input (like note, title)
      const target = e.target as HTMLElement
      if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text') {
        return
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleDigit(e.key)
      } else if (e.key === '.' || e.key === ',') {
        if (allowDecimal) {
          e.preventDefault()
          handleDigit('.')
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === 'Escape') {
        if (onClose) {
          e.preventDefault()
          onClose()
        }
      } else if (e.key === 'Enter') {
        if (onDone) {
          e.preventDefault()
          onDone()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDigit, handleBackspace, onClose, onDone, allowDecimal])

  const content = (
    <div className={`flex flex-col select-none ${className}`}>
      {/* Optional Header for Sheet Mode */}
      {mode === 'sheet' && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme/60 bg-theme-surface/50">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-semibold text-theme-main">
              {title || t.touchpad_title || (lang === 'vi' ? 'Bàn phím số' : 'Numeric Keypad')}
            </span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Large Display in Sheet Mode */}
      {mode === 'sheet' && (
        <div className="px-4 py-3 bg-zinc-50/80 border-b border-theme/40 flex items-center justify-between">
          <div className="text-[11px] text-theme-muted font-medium">
            {lang === 'vi' ? 'Số tiền nhập' : 'Amount'}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono-nums text-theme-main tracking-tight">
            {numValue > 0 ? formatMoney(numValue, lang) : `0 ${t.currency_unit}`}
          </div>
        </div>
      )}

      {/* Presets Row */}
      {showPresets && (
        <div className="p-2 sm:p-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-theme/40 bg-white">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-theme-surface hover:bg-theme-border/50 text-theme-main border border-theme transition-all shrink-0 active:scale-95 cursor-pointer shadow-2xs"
            >
              +{preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}k`}
            </button>
          ))}
          {max !== undefined && max > 0 && (
            <button
              type="button"
              onClick={handleSetMax}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              {t.touchpad_max || (lang === 'vi' ? 'Tối đa' : 'Max')}
            </button>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all shrink-0 active:scale-95 cursor-pointer ml-auto flex items-center gap-1"
            title={t.touchpad_clear || (lang === 'vi' ? 'Xoá' : 'Clear')}
          >
            <RotateCcw className="w-3 h-3" />
            <span>C</span>
          </button>
        </div>
      )}

      {/* 3x4 Touchpad Keypad Grid */}
      <div className="p-2 sm:p-3 bg-zinc-50/70">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* Row 1 */}
          {['1', '2', '3'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 sm:h-13 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 shadow-2xs text-lg sm:text-xl font-mono font-semibold text-zinc-800 flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}

          {/* Row 2 */}
          {['4', '5', '6'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 sm:h-13 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 shadow-2xs text-lg sm:text-xl font-mono font-semibold text-zinc-800 flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}

          {/* Row 3 */}
          {['7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 sm:h-13 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 shadow-2xs text-lg sm:text-xl font-mono font-semibold text-zinc-800 flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
            >
              {digit}
            </button>
          ))}

          {/* Row 4: 000, 0, Backspace */}
          <button
            type="button"
            onClick={() => handleDigit('000')}
            className="h-12 sm:h-13 rounded-xl bg-zinc-100/90 hover:bg-zinc-200/80 border border-zinc-300/80 shadow-2xs text-sm sm:text-base font-mono font-bold text-zinc-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
          >
            000
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 sm:h-13 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 shadow-2xs text-lg sm:text-xl font-mono font-semibold text-zinc-800 flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 sm:h-13 rounded-xl bg-zinc-100/90 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 border border-zinc-300/80 shadow-2xs text-zinc-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer select-none"
            title="Backspace"
          >
            <Delete className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Done / Confirm Button (if onDone provided) */}
        {onDone && (
          <div className="mt-2 sm:mt-2.5">
            <button
              type="button"
              onClick={onDone}
              className="w-full h-11 sm:h-12 rounded-xl btn-theme-gradient text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer select-none"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{t.touchpad_done || (lang === 'vi' ? 'Xong' : 'Done')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (mode === 'sheet') {
    const sheetContent = (
      <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="absolute inset-0"
          onClick={onClose || onDone}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-md mx-auto bg-white rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200 border-t border-theme z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {content}
        </div>
      </div>
    )

    if (mounted && typeof document !== 'undefined') {
      return createPortal(sheetContent, document.body)
    }
    return sheetContent
  }

  return content
}
