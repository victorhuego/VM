'use client'

import React, { useState, useMemo } from 'react'
import { LanguageType, MomentItem } from '@/lib/types'
import { dictionary } from '@/lib/i18n'
import { Sparkles, X } from 'lucide-react'

interface TimeCapsuleProps {
  lang: LanguageType
  moments?: MomentItem[]
}

export function TimeCapsule({ lang, moments = [] }: TimeCapsuleProps) {
  const t = dictionary[lang]
  const [dismissed, setDismissed] = useState(false)

  // Pick a real past memory from the user's moments
  const memory = useMemo(() => {
    if (!moments || moments.length === 0) return null
    // Select the oldest moment or a moment from a previous date
    return moments[moments.length - 1]
  }, [moments])

  if (dismissed || !memory) return null

  // Format date display (e.g., "19/09 • 15:30")
  const dateFormatted = memory.date
    ? memory.date.split(' ')[0].split(/[-.]/).slice(1).reverse().join('/')
    : ''
  const timeFormatted = memory.time || ''
  const stamp = [dateFormatted, timeFormatted].filter(Boolean).join(' • ')

  return (
    <section className="border border-theme rounded-lg p-3 sm:p-3.5 bg-theme-surface/70 flex items-start justify-between gap-3 text-xs transition-all animate-in fade-in duration-300">
      <div className="flex items-start space-x-2.5 min-w-0">
        <div className="w-7 h-7 rounded-md btn-theme-gradient text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-theme-main">{t.time_capsule_title}</span>
            {stamp && <span className="font-mono text-[10px] text-theme-muted">{stamp}</span>}
          </div>
          <p className="text-zinc-600 italic text-[11px] sm:text-xs truncate max-w-xl">
            &ldquo;{memory.caption}&rdquo;
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-zinc-400 hover:text-zinc-700 p-1 rounded shrink-0 touch-target cursor-pointer"
        title={lang === 'vi' ? 'Đóng lời nhắc' : 'Dismiss'}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </section>
  )
}
