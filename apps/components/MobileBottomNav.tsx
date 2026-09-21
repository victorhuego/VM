'use client'

import React from 'react'
import { TabType, LanguageType } from '@/lib/types'
import { dictionary } from '@/lib/i18n'
import { Wallet, Clock } from 'lucide-react'

interface MobileBottomNavProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  lang: LanguageType
  onOpenBalanceModal?: () => void
}

export function MobileBottomNav({
  currentTab,
  onTabChange,
  lang,
}: MobileBottomNavProps) {
  const t = dictionary[lang]

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-theme px-3 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around pointer-events-auto">
      <button
        type="button"
        onClick={() => onTabChange('moments')}
        className={`flex-1 flex flex-col items-center justify-center space-y-0.5 min-h-[44px] py-1 rounded-lg touch-target cursor-pointer active:opacity-60 transition-all ${
          currentTab === 'moments'
            ? 'text-theme-main font-semibold bg-theme-surface/80'
            : 'text-zinc-500 font-medium hover:text-theme-main'
        }`}
      >
        <Clock className={`w-4 h-4 pointer-events-none ${currentTab === 'moments' ? 'text-theme-accent' : ''}`} />
        <span className="text-[11px] pointer-events-none">{t.mobile_nav_moments}</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('expenses')}
        className={`flex-1 flex flex-col items-center justify-center space-y-0.5 min-h-[44px] py-1 rounded-lg touch-target cursor-pointer active:opacity-60 transition-all ${
          currentTab === 'expenses'
            ? 'text-theme-main font-semibold bg-theme-surface/80'
            : 'text-zinc-500 font-medium hover:text-theme-main'
        }`}
      >
        <Wallet className={`w-4 h-4 pointer-events-none ${currentTab === 'expenses' ? 'text-theme-accent' : ''}`} />
        <span className="text-[11px] pointer-events-none">{t.mobile_nav_finance}</span>
      </button>
    </div>
  )
}
