'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { LanguageType, MomentItem, ThemeType, UserProfile } from '@/lib/types'
import { dictionary, moodMetadata } from '@/lib/i18n'
import { X, ChevronLeft, ChevronRight, Sparkles, User } from 'lucide-react'
import { MoodIcon } from '@/components/MoodIcon'
import { getClientLocalDateString, normalizeDateString, normalizeTimeString } from '@/lib/time'

interface StoryZenModalProps {
  open: boolean
  onClose: () => void
  moments: MomentItem[]
  lang: LanguageType
  currentUser?: UserProfile | null
  theme?: ThemeType
}

export function StoryZenModal({
  open,
  onClose,
  moments,
  lang,
  currentUser,
  theme = 'classic',
}: StoryZenModalProps) {
  const t = dictionary[lang]
  const todayStr = getClientLocalDateString()
  const todayMoments = useMemo(() => {
    return moments
      .filter((m) => normalizeDateString(m.date) === todayStr)
      .sort((a, b) => {
        const timeA = normalizeTimeString(a.time) || '00:00'
        const timeB = normalizeTimeString(b.time) || '00:00'
        if (timeA !== timeB) return timeA.localeCompare(timeB)
        return a.id.localeCompare(b.id)
      })
  }, [moments, todayStr])

  const [activeTheme, setActiveTheme] = useState<ThemeType>(theme)

  useEffect(() => {
    if (theme) {
      setActiveTheme(theme)
    } else if (typeof document !== 'undefined') {
      const docTheme = document.documentElement.getAttribute('data-theme') as ThemeType
      if (docTheme) setActiveTheme(docTheme)
    }
  }, [theme, open])

  const [currentIndex, setCurrentIndex] = useState(0)
  const isSwipedRef = useRef(false)

  const isFantasy = activeTheme === 'fantasy'
  const isCozy = activeTheme === 'cozy'

  const handleNext = () => {
    if (currentIndex < todayMoments.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  useEffect(() => {
    if (open) setCurrentIndex(0)
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, todayMoments.length, onClose, currentIndex])

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)

  const minSwipeDistance = 35

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches.length > 1) return
    isSwipedRef.current = false
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    const currentX = e.targetTouches[0].clientX
    const currentY = e.targetTouches[0].clientY
    setTouchEnd({ x: currentX, y: currentY })

    const diffX = currentX - touchStart.x
    const diffY = currentY - touchStart.y
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setSwipeOffset(diffX * 0.35)
    }
  }

  const handleTouchEnd = () => {
    setSwipeOffset(0)
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY)

    if (isHorizontal) {
      if (distanceX > minSwipeDistance) {
        isSwipedRef.current = true
        handleNext()
      } else if (distanceX < -minSwipeDistance) {
        isSwipedRef.current = true
        handlePrev()
      }
    } else {
      if (distanceY < -60) {
        isSwipedRef.current = true
        onClose()
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  const handleClickToNext = () => {
    if (isSwipedRef.current) {
      isSwipedRef.current = false
      return
    }
    handleNext()
  }

  if (!open) return null

  // Empty State: No moments recorded today
  if (todayMoments.length === 0) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200 ${
          isFantasy
            ? 'bg-[#0A0E18]/96 backdrop-blur-md'
            : isCozy
            ? 'bg-[#251812]/96 backdrop-blur-md'
            : 'bg-[#0D1810]/96 backdrop-blur-md'
        }`}
        data-theme={activeTheme}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 ${
            isFantasy
              ? 'bg-[#162132] border-2 border-[#D3BC8E] shadow-[0_0_30px_rgba(211,188,142,0.25)] rounded-2xl text-[#F5EAD4]'
              : isCozy
              ? 'bg-[#3E2A20] border-2 border-[#5C4133] rounded-3xl text-[#FFFDF8]'
              : 'bg-[#182B1B] border border-[#2D472F] rounded-2xl text-white'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
              isFantasy
                ? 'bg-[#1E2B3E] border border-[#D3BC8E]/60 text-[#E5C992]'
                : isCozy
                ? 'bg-[#5C4133] border border-[#7A5745] text-[#FCD34D]'
                : 'bg-[#243E27] border border-[#355B39] text-[#94B895]'
            }`}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3
              className={`text-sm font-bold ${
                isFantasy ? 'text-[#FFE5A3]' : isCozy ? 'text-[#FFFDF8]' : 'text-white'
              }`}
            >
              {lang === 'vi' ? 'Chưa có Tin hôm nay' : 'No Zen Story Today'}
            </h3>
            <p
              className={`text-xs leading-relaxed ${
                isFantasy ? 'text-[#8E9FAC]' : isCozy ? 'text-[#EBD8C8]' : 'text-[#A2BBA4]'
              }`}
            >
              {lang === 'vi'
                ? 'Hãy lưu lại ít nhất một tin trong ngày hôm nay để tạo câu chuyện của bạn nhé!'
                : 'Capture at least one moment today to start your Zen Story.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 px-4 text-xs font-bold transition-all cursor-pointer ${
              isFantasy
                ? 'btn-theme-gradient text-[#1E2533] rounded-full shadow-md'
                : isCozy
                ? 'btn-theme-gradient text-white rounded-full shadow-md'
                : 'btn-theme-gradient text-white rounded-xl shadow-xs'
            }`}
          >
            {t.zen_exit || (lang === 'vi' ? 'Đóng' : 'Close')}
          </button>
        </div>
      </div>
    )
  }

  const current = todayMoments[currentIndex]
  const moodInfo = moodMetadata[current.mood] || { vi: current.mood, en: current.mood, icon: 'Leaf' }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] select-none touch-none cursor-pointer animate-in fade-in duration-200 ${
        isFantasy
          ? 'bg-[#0A0E18]/96 backdrop-blur-md'
          : isCozy
          ? 'bg-[#251812]/96 backdrop-blur-md'
          : 'bg-[#0D1810]/96 backdrop-blur-md'
      }`}
      data-theme={activeTheme}
      onClick={handleClickToNext}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
    >
      {/* Top Story Header & Segment Bars */}
      <div className="max-w-2xl w-full mx-auto space-y-3 cursor-default" onClick={(e) => e.stopPropagation()}>
        {/* Fantasy Top Golden Glow or Cozy Awning */}
        {isFantasy && (
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#E5C992] to-transparent shadow-[0_0_8px_#E5C992] -mt-2 mb-2" />
        )}
        {isCozy && (
          <div className="h-1.5 w-full cafe-awning-stripes rounded-full -mt-2 mb-2 shadow-xs" />
        )}

        {/* Segment Progress Indicators */}
        <div className="flex items-center space-x-1.5">
          {todayMoments.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx <= currentIndex
                  ? isFantasy
                    ? 'bg-gradient-to-r from-[#FFE5A3] to-[#E5C992] shadow-[0_0_8px_rgba(229,201,146,0.7)]'
                    : isCozy
                    ? 'bg-[#EA5C79] shadow-xs'
                    : 'bg-[#719B73]'
                  : isFantasy
                  ? 'bg-[#223048]'
                  : isCozy
                  ? 'bg-[#5C4133]'
                  : 'bg-[#243E27]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold uppercase tracking-widest ${
                isFantasy
                  ? 'text-[#E5C992]'
                  : isCozy
                  ? 'text-[#FCD34D]'
                  : 'text-[#94B895] font-mono'
              }`}
            >
              {t.zen_title}
            </span>
            <span className={isFantasy ? 'text-[#44556F]' : isCozy ? 'text-[#7A5745]' : 'text-zinc-600'}>•</span>
            <span
              className={`text-xs font-mono ${
                isFantasy ? 'text-[#8E9FAC]' : isCozy ? 'text-[#D4C3B3]' : 'text-[#A2BBA4]'
              }`}
            >
              {currentIndex + 1} / {todayMoments.length}
            </span>
            <span className={isFantasy ? 'text-[#44556F]' : isCozy ? 'text-[#7A5745]' : 'text-zinc-600'}>•</span>
            <span
              className={`text-xs font-mono font-semibold ${
                isFantasy ? 'text-[#FFE5A3]' : isCozy ? 'text-[#F06583]' : 'text-[#719B73]'
              }`}
            >
              @{current.user || 'jeandev'}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            onTouchStart={(e) => e.stopPropagation()}
            className={`p-1.5 touch-target flex items-center space-x-1 text-xs font-mono cursor-pointer active:opacity-60 transition-colors ${
              isFantasy
                ? 'text-[#8E9FAC] hover:text-[#FFE5A3]'
                : isCozy
                ? 'text-[#D4C3B3] hover:text-[#FFFDF8]'
                : 'text-[#A2BBA4] hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">{t.zen_exit}</span>
          </button>
        </div>
      </div>

      {/* Main Story Card (Centered & Touch-Swipeable) */}
      <div
        className="max-w-md w-full mx-auto my-auto flex flex-col items-center text-center space-y-4 transition-transform duration-150 ease-out pointer-events-none"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div
          className={`relative w-full aspect-[4/3] overflow-hidden flex items-center justify-center transition-all ${
            isFantasy
              ? 'bg-[#141C2A] border-2 border-[#D3BC8E] shadow-[0_0_35px_rgba(211,188,142,0.25)] rounded-2xl'
              : isCozy
              ? 'bg-[#3E2A20] border-2 border-[#5C4133] shadow-2xl rounded-3xl'
              : 'bg-[#182B1B] border border-[#2D472F] shadow-2xl rounded-xl'
          }`}
        >
          {current.image ? (
            <img
              src={current.image}
              alt="Zen Story"
              className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
            />
          ) : (
            <div
              className={`font-mono text-xs ${
                isFantasy ? 'text-[#8E9FAC]' : isCozy ? 'text-[#D4C3B3]' : 'text-[#7E9480]'
              }`}
            >
              {lang === 'vi' ? 'Không có ảnh' : 'No photo'}
            </div>
          )}

          {current.image && (
            <div
              className={`absolute bottom-3 right-3 font-mono text-[11px] tracking-wider px-2.5 py-0.5 select-none shadow-sm ${
                isFantasy
                  ? 'bg-[#0D121D]/90 backdrop-blur-xs text-[#FFE5A3] border border-[#D3BC8E]/60 rounded-md'
                  : isCozy
                  ? 'bg-[#281A13]/90 backdrop-blur-xs text-[#FCD34D] border border-[#5C4133] rounded-full'
                  : 'bg-[#0F1A11]/90 backdrop-blur-xs text-[#94B895] border border-[#2D472F] rounded-md'
              }`}
            >
              {current.date}
            </div>
          )}
        </div>

        <div className="space-y-2 w-full px-2">
          <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-1">
            <span
              className={`font-mono text-sm font-semibold ${
                isFantasy ? 'text-[#FFE5A3]' : isCozy ? 'text-[#FFFDF8]' : 'text-white'
              }`}
            >
              {current.time}
            </span>
            <span className={isFantasy ? 'text-[#44556F]' : isCozy ? 'text-[#7A5745]' : 'text-zinc-600'}>•</span>
            
            {/* User display */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono flex items-center space-x-1 ${
                isFantasy
                  ? 'bg-[#162132] text-[#F5EAD4] border border-[#D3BC8E]/40 shadow-2xs'
                  : isCozy
                  ? 'bg-[#3E2A20] text-[#FFFDF8] border border-[#5C4133] shadow-xs'
                  : 'bg-[#182B1B] text-[#DCEADF] border border-[#2D472F]'
              }`}
            >
              <User
                className={`w-3 h-3 ${
                  isFantasy ? 'text-[#E5C992]' : isCozy ? 'text-[#F06583]' : 'text-[#719B73]'
                }`}
              />
              <span>
                {current.user === currentUser?.username
                  ? lang === 'vi' ? 'Bạn' : 'You'
                  : `@${current.user || 'jeandev'}`}
              </span>
            </span>

            <span className={isFantasy ? 'text-[#44556F]' : isCozy ? 'text-[#7A5745]' : 'text-zinc-600'}>•</span>
            
            {/* Mood display */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1.5 ${
                isFantasy
                  ? 'bg-[#162132] text-[#FFE5A3] border border-[#D3BC8E]/40 shadow-2xs'
                  : isCozy
                  ? 'bg-[#3E2A20] text-[#FCD34D] border border-[#5C4133] shadow-xs'
                  : 'bg-[#182B1B] text-[#94B895] border border-[#2D472F]'
              }`}
            >
              <MoodIcon name={moodInfo.icon} className="w-3.5 h-3.5" />
              <span>{moodInfo[lang]}</span>
            </span>

            {current.driveName && (
              <>
                <span className={isFantasy ? 'text-[#44556F]' : isCozy ? 'text-[#7A5745]' : 'text-zinc-600'}>•</span>
                <span
                  className={`text-xs font-mono ${
                    isFantasy ? 'text-[#8E9FAC]' : isCozy ? 'text-[#D4C3B3]' : 'text-[#7E9480]'
                  }`}
                >
                  {current.driveName}
                </span>
              </>
            )}
          </div>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isFantasy
                ? 'text-[#F5EAD4]'
                : isCozy
                ? 'text-[#FFFDF8]'
                : 'text-[#E7F0E8] font-light'
            }`}
          >
            {current.caption}
          </p>
        </div>
      </div>

      {/* Bottom Controls & Navigation */}
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center pt-2">
        {/* Desktop Navigation Buttons */}
        <div
          className="hidden sm:flex items-center justify-between w-full text-xs font-mono"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            disabled={currentIndex === 0}
            className={`px-3.5 py-2 flex items-center space-x-1.5 transition-all touch-target disabled:opacity-30 cursor-pointer ${
              isFantasy
                ? 'bg-[#162132] hover:bg-[#1E2B3E] text-[#E5C992] hover:text-[#FFE5A3] border border-[#D3BC8E]/50 rounded-xl shadow-md'
                : isCozy
                ? 'bg-[#3E2A20] hover:bg-[#4A3327] text-[#FFFDF8] border-2 border-[#5C4133] rounded-full shadow-md'
                : 'bg-[#182B1B] hover:bg-[#223B26] hover:text-white text-[#DCEADF] border border-[#2D472F] rounded-lg'
            }`}
          >
            <ChevronLeft className="w-4 h-4 pointer-events-none" />
            <span className="pointer-events-none">{t.zen_prev}</span>
          </button>

          <span
            className={`text-[11px] ${
              isFantasy ? 'text-[#8E9FAC]' : isCozy ? 'text-[#D4C3B3]' : 'text-[#7E9480]'
            }`}
          >
            {t.keyboard_hint}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className={`px-3.5 py-2 flex items-center space-x-1.5 transition-all touch-target cursor-pointer ${
              isFantasy
                ? 'bg-[#162132] hover:bg-[#1E2B3E] text-[#E5C992] hover:text-[#FFE5A3] border border-[#D3BC8E]/50 rounded-xl shadow-md'
                : isCozy
                ? 'bg-[#3E2A20] hover:bg-[#4A3327] text-[#FFFDF8] border-2 border-[#5C4133] rounded-full shadow-md'
                : 'bg-[#182B1B] hover:bg-[#223B26] hover:text-white text-[#DCEADF] border border-[#2D472F] rounded-lg'
            }`}
          >
            <span className="pointer-events-none">{t.zen_next}</span>
            <ChevronRight className="w-4 h-4 pointer-events-none" />
          </button>
        </div>

        {/* Mobile Gesture & Tap Hint */}
        <div className="sm:hidden text-center py-1 select-none">
          <span
            className={`text-[11px] font-mono tracking-tight ${
              isFantasy ? 'text-[#8E9FAC]' : isCozy ? 'text-[#D4C3B3]' : 'text-[#7E9480]'
            }`}
          >
            {t.swipe_hint}
          </span>
        </div>
      </div>
    </div>
  )
}
