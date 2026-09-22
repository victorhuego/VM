'use client'

import React, { useState, useEffect } from 'react'
import Select, { components, OptionProps, SingleValueProps } from 'react-select'
import { ThemeType, LanguageType, TabType, UserProfile } from '@/lib/types'
import { themeMetadata, dictionary } from '@/lib/i18n'
import {
  getClientTimeZone,
  getClientTimeZoneOffset,
  formatClientHeaderDate,
  formatClientTime,
  formatClientDayOfWeek,
} from '@/lib/time'
import { Wallet, Clock, Palette, Check, Globe, RotateCw, User } from 'lucide-react'

interface ThemeOption {
  value: ThemeType
  label: string
  color: string
}

interface AppHeaderProps {
  currentTheme: ThemeType
  onThemeChange: (theme: ThemeType) => void
  currentLang: LanguageType
  onLangChange: (lang: LanguageType) => void
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  currentUser?: UserProfile | null
}

export function AppHeader({
  currentTheme,
  onThemeChange,
  currentLang,
  onLangChange,
  currentTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  currentUser,
}: AppHeaderProps) {
  const t = dictionary[currentLang]

  const [mounted, setMounted] = useState(false)
  const [clientTz, setClientTz] = useState({ tz: 'Asia/Ho_Chi_Minh', offset: 'GMT+7', date: new Date() })

  useEffect(() => {
    setMounted(true)
    setClientTz({
      tz: getClientTimeZone(),
      offset: getClientTimeZoneOffset(),
      date: new Date(),
    })
    const timer = setInterval(() => {
      setClientTz((prev) => ({ ...prev, date: new Date() }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const themeOptions: ThemeOption[] = (Object.keys(themeMetadata) as ThemeType[]).map((key) => ({
    value: key,
    label: themeMetadata[key].name,
    color: themeMetadata[key].color,
  }))

  return (
    <header className="w-full border-b border-theme bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="w-full px-2.5 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-6 min-w-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 cursor-pointer" onClick={() => onTabChange('moments')}>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full btn-theme-gradient ring-2 ring-theme" />
            <span className="font-bold tracking-tight text-xs sm:text-base text-theme-gradient truncate">
              {t.app_title}
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRefresh()
              }}
              disabled={isRefreshing}
              className="p-1 sm:p-1.5 rounded-md border border-theme bg-white hover:bg-theme-surface text-theme-muted hover:text-theme-main transition-all cursor-pointer shadow-2xs disabled:opacity-50 flex items-center justify-center shrink-0"
              title={currentLang === 'vi' ? 'Làm mới toàn bộ ứng dụng' : 'Refresh entire app'}
              aria-label="Refresh app"
            >
              <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-accent ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          <span className="text-zinc-300 hidden sm:inline">|</span>

          {/* Tab Navigation (Desktop) */}
          <nav className="hidden sm:flex items-center space-x-1">
            <button
              onClick={() => onTabChange('moments')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentTab === 'moments'
                  ? 'bg-theme-surface text-theme-main border border-theme shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-theme-main hover:bg-theme-surface'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-theme-accent" />
              <span>{t.tab_moments}</span>
            </button>
            <button
              onClick={() => onTabChange('expenses')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentTab === 'expenses'
                  ? 'bg-theme-surface text-theme-main border border-theme shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-theme-main hover:bg-theme-surface'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-theme-accent" />
              <span>{t.tab_expenses}</span>
            </button>
            <button
              onClick={() => onTabChange('users')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentTab === 'users'
                  ? 'bg-theme-surface text-theme-main border border-theme shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-theme-main hover:bg-theme-surface'
              }`}
            >
              <User className="w-3.5 h-3.5 text-theme-accent" />
              <span>{t.tab_users || 'USER MANAGER'}</span>
              {currentUser?.username && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-200/80 text-zinc-700 font-mono">
                  @{currentUser.username}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right Action Tools: Date, Time, Timezone, Theme Switcher, Language Switcher */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          {/* Live Client Real-Time Clock, Date & Timezone */}
          {/* Desktop/Tablet version */}
          <div
            className="hidden md:flex items-center space-x-2 text-xs text-theme-main font-mono bg-theme-surface/90 px-2.5 py-1 rounded-md border border-theme select-none cursor-default shadow-xs"
            title={`Thời gian thực client: ${clientTz.tz} (${clientTz.offset})`}
          >
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span suppressHydrationWarning className="text-zinc-600 font-sans font-medium text-[11px]">
                {formatClientDayOfWeek(clientTz.date, currentLang)},
              </span>
              <span suppressHydrationWarning>{formatClientHeaderDate(clientTz.date, currentLang)}</span>
            </div>
            <span className="text-zinc-300">•</span>
            <span suppressHydrationWarning className="font-semibold text-theme-accent font-mono-nums tracking-wider">
              {formatClientTime(clientTz.date)}
            </span>
            <span suppressHydrationWarning className="text-[10px] text-theme-accent font-semibold px-1 py-0.5 bg-theme-accent/10 rounded">
              {clientTz.offset}
            </span>
          </div>

          {/* Mobile version */}
          <div
            className="flex md:hidden items-center space-x-1 text-[10px] text-theme-main font-mono bg-theme-surface px-1.5 py-0.5 rounded border border-theme select-none cursor-default"
            title={`Thời gian thực client: ${clientTz.tz} (${clientTz.offset})`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span suppressHydrationWarning className="font-semibold text-theme-accent font-mono-nums">
              {formatClientTime(clientTz.date, false)}
            </span>
          </div>

          {/* Theme Switcher via react-select */}
          <div className="w-24 sm:w-40 md:w-44 shrink-0">
            {!mounted ? (
              <div className="h-8 rounded-md border border-theme flex items-center px-2 space-x-1.5 text-xs text-theme-main bg-white">
                <div
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 shrink-0"
                  style={{ backgroundColor: themeMetadata[currentTheme].color }}
                />
                <span className="truncate sm:inline hidden">{themeMetadata[currentTheme].name}</span>
                <span className="truncate sm:hidden inline">{themeMetadata[currentTheme].name.split(' ')[0]}</span>
              </div>
            ) : (
              <Select<ThemeOption>
                instanceId="theme-switcher-select"
                menuPortalTarget={mounted && typeof document !== 'undefined' ? document.body : undefined}
                menuPosition="fixed"
                isSearchable={false}
                value={themeOptions.find((opt) => opt.value === currentTheme)}
                onChange={(option) => {
                  if (option) onThemeChange(option.value)
                }}
                options={themeOptions}
                formatOptionLabel={(option, { context }) => (
                  <div className="flex items-center space-x-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                    {context === 'value' ? (
                      <>
                        <span className="text-xs truncate font-medium sm:inline hidden">{option.label}</span>
                        <span className="text-xs truncate font-medium sm:hidden inline">{option.label.split(' ')[0]}</span>
                      </>
                    ) : (
                      <span className="text-xs truncate font-medium">{option.label}</span>
                    )}
                  </div>
                )}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '32px',
                    height: '32px',
                    fontSize: '12px',
                    backgroundColor: '#ffffff',
                    borderColor: 'var(--theme-border)',
                    boxShadow: state.isFocused ? '0 0 0 1px var(--theme-border)' : 'none',
                    '&:hover': {
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'var(--theme-surface)',
                    },
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: '0 6px',
                    height: '32px',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'var(--theme-main)',
                    margin: 0,
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    height: '32px',
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: '2px 4px',
                    color: 'var(--theme-muted)',
                    '&:hover': {
                      color: 'var(--theme-main)',
                    },
                  }),
                  indicatorSeparator: () => ({
                    display: 'none',
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                    pointerEvents: 'auto',
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--theme-border)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
                    zIndex: 9999,
                    width: '150px',
                    right: 0,
                    touchAction: 'manipulation',
                  }),
                  menuList: (base) => ({
                    ...base,
                    padding: '4px',
                  }),
                  option: (base, state) => ({
                    ...base,
                    fontSize: '12px',
                    borderRadius: '0.375rem',
                    padding: '9px 10px',
                    minHeight: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: state.isSelected
                      ? 'var(--theme-surface)'
                      : state.isFocused
                      ? '#f4f4f5'
                      : 'transparent',
                    color: state.isSelected ? 'var(--theme-main)' : '#3f3f46',
                    fontWeight: state.isSelected ? 600 : 400,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    '&:active': {
                      backgroundColor: 'var(--theme-surface)',
                    },
                  }),
                }}
              />
            )}
          </div>

          {/* Bilingual Switcher: Compact Toggle on Mobile, Segment on Desktop */}
          {/* Mobile version: Compact 1-click button (h-8, ~38px wide) */}
          <button
            type="button"
            onClick={() => onLangChange(currentLang === 'vi' ? 'en' : 'vi')}
            className="sm:hidden h-8 px-2 rounded-md text-[11px] font-mono font-bold border border-theme bg-white hover:bg-theme-surface text-theme-main flex items-center space-x-1 cursor-pointer active:opacity-60 shrink-0 shadow-xs"
            title={currentLang === 'vi' ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}
          >
            <Globe className="w-3.5 h-3.5 text-theme-accent shrink-0 pointer-events-none" />
            <span className="pointer-events-none">{currentLang.toUpperCase()}</span>
          </button>

          {/* Desktop version: Clean segmented toggle */}
          <div className="hidden sm:flex items-center bg-zinc-100 p-0.5 rounded-md text-xs font-mono border border-zinc-200">
            <button
              type="button"
              onClick={() => onLangChange('vi')}
              className={`px-2 py-0.5 rounded text-xs transition-all cursor-pointer active:opacity-60 ${
                currentLang === 'vi'
                  ? 'bg-white text-theme-main font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-theme-main'
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => onLangChange('en')}
              className={`px-2 py-0.5 rounded text-xs transition-all cursor-pointer active:opacity-60 ${
                currentLang === 'en'
                  ? 'bg-white text-theme-main font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-theme-main'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>

  )
}
