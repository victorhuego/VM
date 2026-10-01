'use client'

import React from 'react'
import { TabType, LanguageType, UserProfile } from '@/lib/types'
import { dictionary } from '@/lib/i18n'
import { Wallet, Clock, User } from 'lucide-react'

interface MobileBottomNavProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  lang: LanguageType
  onOpenBalanceModal?: () => void
  currentUser?: UserProfile | null
}

export function MobileBottomNav({
  currentTab,
  onTabChange,
  lang,
  currentUser,
}: MobileBottomNavProps) {
  const t = dictionary[lang]

  const tabIndex = currentTab === 'moments' ? 0 : currentTab === 'expenses' ? 1 : 2

  return (
    <div className="sm:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-4 right-4 z-40 max-w-sm mx-auto pointer-events-auto">
      <nav
        aria-label="Mobile Navigation"
        className="relative bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl [html[data-theme='cozy']_&]:rounded-3xl p-1 floating-dock-shadow flex items-center justify-between shadow-lg overflow-hidden"
      >
        {/* Animated Sliding Pill Indicator */}
        <div
          className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-xl [html[data-theme='cozy']_&]:rounded-2xl bg-theme-surface/95 border border-theme/60 shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{
            transform: `translateX(${tabIndex * 100}%)`,
          }}
        />

        {/* Tab 1: Moments / Tin */}
        <button
          type="button"
          data-active={currentTab === 'moments'}
          onClick={() => onTabChange('moments')}
          className={`mobile-nav-btn relative z-10 flex-1 flex flex-col items-center justify-center space-y-0.5 min-h-[46px] py-1 rounded-xl touch-target cursor-pointer transition-transform active:scale-95 duration-150 ${
            currentTab === 'moments' ? 'mobile-nav-active' : ''
          }`}
        >
          <Clock
            className={`w-4 h-4 pointer-events-none transition-transform duration-200 ${
              currentTab === 'moments' ? 'text-theme-accent scale-110' : 'text-zinc-400'
            }`}
          />
          <span
            className={`text-[11px] pointer-events-none transition-colors duration-200 ${
              currentTab === 'moments' ? 'text-theme-main font-semibold' : 'text-zinc-500 font-medium'
            }`}
          >
            {t.mobile_nav_moments}
          </span>
        </button>

        {/* Tab 2: Finance / Tài chính */}
        <button
          type="button"
          data-active={currentTab === 'expenses'}
          onClick={() => onTabChange('expenses')}
          className={`mobile-nav-btn relative z-10 flex-1 flex flex-col items-center justify-center space-y-0.5 min-h-[46px] py-1 rounded-xl touch-target cursor-pointer transition-transform active:scale-95 duration-150 ${
            currentTab === 'expenses' ? 'mobile-nav-active' : ''
          }`}
        >
          <Wallet
            className={`w-4 h-4 pointer-events-none transition-transform duration-200 ${
              currentTab === 'expenses' ? 'text-theme-accent scale-110' : 'text-zinc-400'
            }`}
          />
          <span
            className={`text-[11px] pointer-events-none transition-colors duration-200 ${
              currentTab === 'expenses' ? 'text-theme-main font-semibold' : 'text-zinc-500 font-medium'
            }`}
          >
            {t.mobile_nav_finance}
          </span>
        </button>

        {/* Tab 3: User / Tài khoản */}
        <button
          type="button"
          data-active={currentTab === 'users'}
          onClick={() => onTabChange('users')}
          className={`mobile-nav-btn relative z-10 flex-1 flex flex-col items-center justify-center space-y-0.5 min-h-[46px] py-1 rounded-xl touch-target cursor-pointer transition-transform active:scale-95 duration-150 ${
            currentTab === 'users' ? 'mobile-nav-active' : ''
          }`}
        >
          <User
            className={`w-4 h-4 pointer-events-none transition-transform duration-200 ${
              currentTab === 'users' ? 'text-theme-accent scale-110' : 'text-zinc-400'
            }`}
          />
          <span
            className={`text-[11px] pointer-events-none transition-colors duration-200 ${
              currentTab === 'users' ? 'text-theme-main font-semibold' : 'text-zinc-500 font-medium'
            }`}
          >
            {t.mobile_nav_user || 'Tài khoản'}
          </span>
        </button>
      </nav>
    </div>
  )
}
