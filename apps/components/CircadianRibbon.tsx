'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { LanguageType, MomentItem } from '@/lib/types'
import { dictionary } from '@/lib/i18n'
import { getClientTimeZoneOffset } from '@/lib/time'
import {
  SunMedium,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  Zap,
  Coffee,
  Activity,
  Moon,
} from 'lucide-react'

interface CircadianRibbonProps {
  moments: MomentItem[]
  lang: LanguageType
  onOpenZenStory: () => void
  onSelectMoment: (id: string) => void
}

function getBioRhythm(hour: number, lang: LanguageType) {
  if (hour >= 5 && hour < 9) {
    return {
      phase: lang === 'vi' ? 'Bình minh' : 'Dawn',
      Icon: Sparkles,
      iconColor: 'text-amber-500',
      insight:
        lang === 'vi'
          ? 'Mức cortisol tự nhiên gia tăng, thời điểm vàng cho tĩnh tâm, cà phê sáng và định hình ý niệm ngày mới.'
          : 'Natural cortisol surge; prime time for mindfulness, morning brew, and day planning.',
    }
  }
  if (hour >= 9 && hour < 12) {
    return {
      phase: lang === 'vi' ? 'Tỉnh táo cao độ' : 'Peak Alertness',
      Icon: Zap,
      iconColor: 'text-emerald-600',
      insight:
        lang === 'vi'
          ? 'Năng lực tư duy phản biện & tập trung nhận thức đạt đỉnh. Phù hợp nhất cho công việc chuyên sâu.'
          : 'Analytical focus and mental acuity peak. Best suited for high-leverage deep work.',
    }
  }
  if (hour >= 12 && hour < 14) {
    return {
      phase: lang === 'vi' ? 'Nghỉ trưa phục hồi' : 'Midday Reset',
      Icon: Coffee,
      iconColor: 'text-amber-700',
      insight:
        lang === 'vi'
          ? 'Hệ tiêu hóa hoạt động, năng lượng chững lại tự nhiên. Nên dùng bữa thư thái và nghỉ ngơi ngắn.'
          : 'Digestion activates with a natural energy dip. Enjoy a mindful lunch and a restorative rest.',
    }
  }
  if (hour >= 14 && hour < 17) {
    return {
      phase: lang === 'vi' ? 'Chiều sâu lắng' : 'Afternoon Flow',
      Icon: Activity,
      iconColor: 'text-teal-600',
      insight:
        lang === 'vi'
          ? 'Khả năng phối hợp và thân nhiệt đạt đỉnh. Lý tưởng để giải quyết công việc, trao đổi và sáng tạo.'
          : 'Coordination and core temperature peak. Excellent for creative collaboration and finishing tasks.',
    }
  }
  if (hour >= 17 && hour < 21) {
    return {
      phase: lang === 'vi' ? 'Hoàng hôn thong dong' : 'Golden Twilight',
      Icon: Compass,
      iconColor: 'text-orange-500',
      insight:
        lang === 'vi'
          ? 'Huyết áp và năng lượng bắt đầu hạ nhiệt. Thời gian tuyệt vời để thể thao, dạo phố và sum vầy.'
          : 'Metabolic pace begins to ease. Ideal for light activity, unwinding, and a cozy evening.',
    }
  }
  return {
    phase: lang === 'vi' ? 'Đêm sâu tái tạo' : 'Restorative Night',
    Icon: Moon,
    iconColor: 'text-indigo-400',
    insight:
      lang === 'vi'
        ? 'Melatonin tiết ra tự nhiên. Hãy giảm tiếp xúc ánh sáng xanh, đọc sách để cơ thể tái tạo tế bào.'
        : 'Melatonin secretion promotes physical restoration. Dim screens and prepare for deep rest.',
  }
}

export function CircadianRibbon({
  moments,
  lang,
  onOpenZenStory,
  onSelectMoment,
}: CircadianRibbonProps) {
  const t = dictionary[lang]
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Drag-to-scroll state for desktop & pointer devices
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)

  const [livePercent, setLivePercent] = useState(() => {
    const now = new Date()
    return Math.min(Math.max(((now.getHours() * 60 + now.getMinutes()) / 1440) * 100, 0), 100)
  })
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const [liveTimeStr, setLiveTimeStr] = useState(() => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  })
  const [tzOffset, setTzOffset] = useState('')

  // Scroll to current time (center the 4-hour visible window on now)
  const scrollToNow = (smooth = true) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const now = new Date()
    const totalMinutes = now.getHours() * 60 + now.getMinutes()
    const fraction = totalMinutes / 1440
    const targetScroll = fraction * container.scrollWidth - container.clientWidth / 2
    const maxScroll = container.scrollWidth - container.clientWidth
    container.scrollTo({
      left: Math.max(0, Math.min(targetScroll, maxScroll)),
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  // Nudge slider by hours (+1 or -1 hour)
  const nudgeHours = (hoursDelta: number) => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
    // 4 hours = container.clientWidth, so 1 hour = container.clientWidth / 4
    const scrollDelta = (container.clientWidth / 4) * hoursDelta
    container.scrollBy({ left: scrollDelta, behavior: 'smooth' })
  }

  // Real-time clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const totalMinutes = now.getHours() * 60 + now.getMinutes()
      setLivePercent(Math.min(Math.max((totalMinutes / 1440) * 100, 0), 100))
      setCurrentHour(now.getHours())
      setLiveTimeStr(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      )
      setTzOffset(getClientTimeZoneOffset())
    }
    updateTime()
    const timer = setInterval(updateTime, 20000)
    return () => clearInterval(timer)
  }, [])

  // Auto-center on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToNow(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  // Desktop Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeftState(scrollContainerRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const bioRhythm = getBioRhythm(currentHour, lang)
  const BioIcon = bioRhythm.Icon

  return (
    <Card className="border-theme rounded-xl p-3.5 sm:p-5 bg-white shadow-card space-y-3.5">
      {/* Top Header: Title, Timezone badge, Scrubber Controls & Zen Story action button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-theme-surface flex items-center justify-center border border-theme/60 shrink-0">
            <SunMedium className="w-3.5 h-3.5 text-theme-accent" />
          </div>
          <div className="flex items-center space-x-1.5 min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-tight sm:tracking-wider text-theme-main whitespace-nowrap">
              {t.circadian_title}
            </h2>
            <span className="hidden sm:inline-flex text-[9px] font-mono text-theme-muted font-normal px-1.5 py-0.5 bg-theme-surface rounded border border-theme/60 whitespace-nowrap shrink-0">
              {tzOffset || 'GMT+7'}
            </span>
          </div>
        </div>

        {/* Action buttons: Jump to Now, Hour Nudge, Zen Story */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Jump to Now Button */}
          <button
            type="button"
            onClick={() => scrollToNow(true)}
            className="h-8 px-2.5 rounded-lg text-xs font-medium bg-theme-surface hover:bg-theme-border/60 text-theme-main border border-theme transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title={lang === 'vi' ? 'Về giờ hiện tại' : 'Jump to now'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-sans font-medium">{t.circadian_jump_now}</span>
          </button>

          {/* Hour Nudge Buttons (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center space-x-0.5 bg-theme-surface rounded-lg p-0.5 border border-theme">
            <button
              type="button"
              onClick={() => nudgeHours(-1)}
              className="w-7 h-7 rounded flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-white transition-colors cursor-pointer"
              title="-1 Giờ"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => nudgeHours(1)}
              className="w-7 h-7 rounded flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-white transition-colors cursor-pointer"
              title="+1 Giờ"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zen Story Button */}
          <button
            type="button"
            onClick={onOpenZenStory}
            className="h-8 px-3 rounded-lg text-xs font-semibold btn-theme-gradient text-white flex items-center space-x-1.5 shadow-xs cursor-pointer active:opacity-75 transition-all shrink-0 hover:brightness-105"
          >
            <PlayCircle className="w-4 h-4 shrink-0 pointer-events-none fill-white/20" />
            <span className="font-sans pointer-events-none">{t.btn_zen_mode}</span>
          </button>
        </div>
      </div>

      {/* 24-Hour Slider (Max 4 Hours Visible at a time = 600% Track Width) */}
      <div className="space-y-1.5 pt-1">
        {/* Helper Hint Bar */}
        <div className="flex items-center justify-between text-[11px] text-theme-muted px-0.5 select-none">
          <span className="flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-theme-accent" />
            <span>{t.circadian_hint}</span>
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-theme-surface rounded border border-theme/60">
            {t.circadian_window_tag}
          </span>
        </div>

        {/* Scrollable Viewport Container */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`relative overflow-x-auto scroll-smooth no-scrollbar touch-pan-x rounded-xl border border-theme/80 bg-white shadow-inner select-none transition-all ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Inner Timeline Track: Exactly 600% width so 24H / 4H = 6 -> exactly 4H visible at any moment */}
          <div className="relative w-[600%] h-28 sm:h-32">
            {/* Harmonious Theme Ombre Sky Gradient (Follows theme variables, no harsh neons) */}
            <div
              className="absolute inset-0 transition-colors duration-500"
              style={{
                background: `linear-gradient(90deg,
                  color-mix(in srgb, var(--primary) 32%, #0f172a) 0%,
                  color-mix(in srgb, var(--primary) 24%, #1e293b) 16.7%,
                  color-mix(in srgb, var(--theme-surface) 60%, #cbd5e1) 25%,
                  color-mix(in srgb, var(--theme-surface) 95%, #ffffff) 37.5%,
                  color-mix(in srgb, var(--theme-surface) 80%, #ffffff) 50%,
                  color-mix(in srgb, var(--theme-surface) 90%, #fef3c7) 66.7%,
                  color-mix(in srgb, var(--primary) 22%, #ea580c) 75%,
                  color-mix(in srgb, var(--primary) 28%, #1e293b) 87.5%,
                  color-mix(in srgb, var(--primary) 32%, #0f172a) 100%
                )`,
              }}
            />

            {/* Subtle Phase Division Overlays with Architectural Typography (No Emojis) */}
            <div className="absolute inset-0 flex pointer-events-none">
              {/* 00:00 - 05:00: Deep Night */}
              <div className="w-[20.833%] border-r border-white/10 h-full p-2.5 flex flex-col justify-start">
                <span className="text-[10px] font-mono tracking-widest font-semibold uppercase text-white/60">
                  {t.circadian_night}
                </span>
              </div>
              {/* 05:00 - 09:00: Dawn */}
              <div className="w-[16.667%] border-r border-black/5 h-full p-2.5 flex flex-col justify-start bg-white/10">
                <span className="text-[10px] font-mono tracking-widest font-semibold uppercase text-zinc-700">
                  {t.circadian_dawn}
                </span>
              </div>
              {/* 09:00 - 17:00: Daylight */}
              <div className="w-[33.333%] border-r border-black/5 h-full p-2.5 flex flex-col justify-start bg-white/15">
                <span className="text-[10px] font-mono tracking-widest font-semibold uppercase text-zinc-800">
                  {t.circadian_day}
                </span>
              </div>
              {/* 17:00 - 21:00: Twilight */}
              <div className="w-[16.667%] border-r border-white/10 h-full p-2.5 flex flex-col justify-start bg-black/10">
                <span className="text-[10px] font-mono tracking-widest font-semibold uppercase text-white/80">
                  {t.circadian_sunset}
                </span>
              </div>
              {/* 21:00 - 24:00: Night */}
              <div className="w-[12.5%] h-full p-2.5 flex flex-col justify-start">
                <span className="text-[10px] font-mono tracking-widest font-semibold uppercase text-white/60">
                  {t.circadian_night}
                </span>
              </div>
            </div>

            {/* Precision Ruler Ticks across 24 Hours (00:00 to 24:00) */}
            <div className="absolute bottom-0 inset-x-0 h-10 border-t border-white/20 bg-black/10 flex pointer-events-none">
              {Array.from({ length: 25 }, (_, i) => i).map((h) => {
                const leftPct = (h / 24) * 100
                return (
                  <React.Fragment key={h}>
                    {/* Major Hour Tick */}
                    <div
                      className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${leftPct}%` }}
                    >
                      <span className="text-[9px] font-mono font-medium text-white/90 drop-shadow-xs mb-1">
                        {h.toString().padStart(2, '0')}:00
                      </span>
                      <div className="w-0.5 h-3 bg-white/70" />
                    </div>

                    {/* Minor Sub-ticks at 15m, 30m, 45m */}
                    {h < 24 && (
                      <>
                        <div
                          className="absolute bottom-0 -translate-x-1/2 w-px h-1.5 bg-white/30"
                          style={{ left: `${((h + 0.25) / 24) * 100}%` }}
                        />
                        <div
                          className="absolute bottom-0 -translate-x-1/2 w-px h-2.5 bg-white/50"
                          style={{ left: `${((h + 0.5) / 24) * 100}%` }}
                        />
                        <div
                          className="absolute bottom-0 -translate-x-1/2 w-px h-1.5 bg-white/30"
                          style={{ left: `${((h + 0.75) / 24) * 100}%` }}
                        />
                      </>
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* High Z-Index Event Markers (Moments: z-50) */}
            {moments.map((m) => {
              const [hStr, mStr] = m.time.split(':')
              const h = Number(hStr)
              const min = Number(mStr) || 0
              const percent = ((h * 60 + min) / 1440) * 100

              return (
                <div
                  key={m.id}
                  className="absolute top-9 sm:top-10 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center"
                  style={{ left: `${percent}%` }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectMoment(m.id)
                    }}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border-2 border-theme text-theme-main shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title={`${m.time} • ${m.caption.slice(0, 30)}...`}
                  >
                    <span className="w-2 h-2 rounded-full bg-theme-accent shrink-0 animate-pulse" />
                    <span className="font-mono text-[11px] font-bold tracking-tight">
                      {m.time}
                    </span>
                    {m.caption && (
                      <span className="text-[10px] text-zinc-600 truncate max-w-[80px] sm:max-w-[120px] font-normal hidden xs:inline">
                        {m.caption}
                      </span>
                    )}

                    {/* Floating Hover Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-900/95 text-white text-[11px] px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-60 font-sans flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-amber-300">{m.time}</span>
                      <span>•</span>
                      <span className="max-w-[180px] truncate">{m.caption}</span>
                    </div>
                  </button>

                  {/* Connecting indicator pin down to timeline ruler */}
                  <div className="w-0.5 h-3 sm:h-4 bg-theme-accent/60 pointer-events-none" />
                  <div className="w-1.5 h-1.5 rounded-full bg-theme-accent -mt-0.5 pointer-events-none" />
                </div>
              )
            })}

            {/* Current Time Needle ("Now Scrubber", z-30) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-30 -translate-x-1/2 pointer-events-none shadow-md"
              style={{ left: `${livePercent}%` }}
            >
              {/* Real-time Clock Pill at Needle Top */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-zinc-950/95 backdrop-blur-xs text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-emerald-400/50 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>{liveTimeStr}</span>
              </div>
              {/* Needle Base Orb */}
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/30 absolute bottom-3 left-1/2 -translate-x-1/2 shadow-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Circadian Bio-Rhythm Insight Banner (Clean architectural design, no emojis) */}
      <div className="p-3 rounded-lg bg-theme-surface/75 border border-theme/60 flex items-start space-x-2.5 text-xs text-theme-main transition-all">
        <div className="w-7 h-7 rounded-lg bg-white border border-theme/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <BioIcon className={`w-4 h-4 ${bioRhythm.iconColor}`} />
        </div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-theme-main text-xs">{bioRhythm.phase}</span>
            <span className="text-zinc-400">•</span>
            <span className="text-[10px] font-mono text-theme-muted">
              {t.circadian_now} {liveTimeStr}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-600 font-normal">
            {bioRhythm.insight}
          </p>
        </div>
      </div>
    </Card>
  )
}
