'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { LanguageType, MomentItem } from '@/lib/types'
import { dictionary, moodMetadata } from '@/lib/i18n'
import { X, ChevronLeft, ChevronRight, Sparkles, User } from 'lucide-react'
import { MoodIcon } from '@/components/MoodIcon'
import { getClientLocalDateString, normalizeDateString, normalizeTimeString } from '@/lib/time'
import { UserProfile } from '@/lib/types'

interface StoryZenModalProps {
  open: boolean
  onClose: () => void
  moments: MomentItem[]
  lang: LanguageType
  currentUser?: UserProfile | null
}

export function StoryZenModal({ open, onClose, moments, lang, currentUser }: StoryZenModalProps) {
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

  const [currentIndex, setCurrentIndex] = useState(0)
  const isSwipedRef = useRef(false)

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
        // Swiped Left -> Next
        isSwipedRef.current = true
        handleNext()
      } else if (distanceX < -minSwipeDistance) {
        // Swiped Right -> Prev
        isSwipedRef.current = true
        handlePrev()
      }
    } else {
      // Swiped Down -> Close
      if (distanceY < -60) {
        isSwipedRef.current = true
        onClose()
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  const handleClickToNext = () => {
    // If a swipe gesture just finished, prevent double trigger from synthetic click
    if (isSwipedRef.current) {
      isSwipedRef.current = false
      return
    }
    handleNext()
  }

  if (!open) return null

  if (todayMoments.length === 0) {
    return (
      <div
        className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              {lang === 'vi' ? 'Chưa có Tin hôm nay' : 'No Zen Story Today'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {lang === 'vi'
                ? 'Hãy lưu lại ít nhất một tin trong ngày hôm nay để tạo câu chuyện của bạn nhé!'
                : 'Capture at least one moment today to start your Zen Story.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors cursor-pointer"
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
      className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex flex-col justify-between p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] select-none touch-none cursor-pointer"
      onClick={handleClickToNext}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Story Header & Segment Bars */}
      <div className="max-w-2xl w-full mx-auto space-y-3 cursor-default" onClick={(e) => e.stopPropagation()}>
        {/* Segment Progress Indicators */}
        <div className="flex items-center space-x-1.5">
          {todayMoments.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx <= currentIndex ? 'bg-white' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-white/90">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
              {t.zen_title}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs font-mono text-zinc-400">
              {currentIndex + 1} / {todayMoments.length}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs font-mono text-emerald-400 font-medium">
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
            className="text-zinc-400 hover:text-white p-1.5 rounded touch-target flex items-center space-x-1 text-xs font-mono cursor-pointer active:opacity-60"
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
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center">
          {current.image ? (
            <img
              src={current.image}
              alt="Zen Story"
              className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
            />
          ) : (
            <div className="text-zinc-600 font-mono text-xs">Không có ảnh</div>
          )}

          {current.image && (
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-amber-300 font-mono text-[11px] tracking-wider px-2 py-0.5 rounded border border-amber-500/30 select-none">
              {current.date}
            </div>
          )}
        </div>

        <div className="space-y-2 w-full px-2">
          <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-1">
            <span className="font-mono text-sm font-semibold text-white">{current.time}</span>
            <span className="text-zinc-600">•</span>
            {/* User display */}
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center space-x-1">
              <User className="w-3 h-3 text-emerald-400" />
              <span>
                {current.user === currentUser?.username
                  ? lang === 'vi' ? 'Bạn' : 'You'
                  : `@${current.user || 'jeandev'}`}
              </span>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-emerald-300 border border-zinc-700 flex items-center space-x-1.5">
              <MoodIcon name={moodInfo.icon} className="w-3.5 h-3.5" />
              <span>{moodInfo[lang]}</span>
            </span>
            {current.driveName && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400 font-mono">{current.driveName}</span>
              </>
            )}
          </div>
          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-light">
            {current.caption}
          </p>
        </div>
      </div>

      {/* Bottom Controls & Navigation */}
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center pt-2">
        {/* Desktop Navigation Buttons (hidden on mobile) */}
        <div
          className="hidden sm:flex items-center justify-between w-full text-xs font-mono text-zinc-400"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handlePrev()
            }}
            disabled={currentIndex === 0}
            className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 flex items-center space-x-1.5 transition-all touch-target disabled:opacity-30 cursor-pointer active:opacity-60"
          >
            <ChevronLeft className="w-4 h-4 pointer-events-none" />
            <span className="pointer-events-none">{t.zen_prev}</span>
          </button>

          <span className="text-[11px] text-zinc-500">{t.keyboard_hint}</span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleNext()
            }}
            className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 flex items-center space-x-1.5 transition-all touch-target cursor-pointer active:opacity-60"
          >
            <span className="pointer-events-none">{t.zen_next}</span>
            <ChevronRight className="w-4 h-4 pointer-events-none" />
          </button>
        </div>

        {/* Mobile Gesture & Tap Hint (No buttons on mobile!) */}
        <div className="sm:hidden text-center py-1 select-none">
          <span className="text-[11px] text-zinc-500 font-mono tracking-tight">
            {t.swipe_hint}
          </span>
        </div>
      </div>
    </div>
  )
}
