'use client'

import React, { useMemo, useState } from 'react'
import { LanguageType, MomentItem } from '@/lib/types'
import { dictionary, moodMetadata } from '@/lib/i18n'
import { CalendarClock, Camera, Maximize2, Trash2, History, Calendar } from 'lucide-react'
import { MoodIcon } from '@/components/MoodIcon'
import { getClientLocalDateString, getClientYesterdayDateString, normalizeDateString, compareMomentsDescending } from '@/lib/time'

interface MomentsTimelineProps {
  moments: MomentItem[]
  lang: LanguageType
  onOpenLightbox: (src: string) => void
  onDeleteMoment?: (id: string) => void
}

export function MomentsTimeline({
  moments,
  lang,
  onOpenLightbox,
  onDeleteMoment,
}: MomentsTimelineProps) {
  const t = dictionary[lang]
  const todayStr = getClientLocalDateString()
  const yesterdayStr = getClientYesterdayDateString()

  // Filter mode: 'today' | 'all' (default: 'today')
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today')

  const todayMoments = useMemo(() => {
    return moments
      .filter((item) => normalizeDateString(item.date) === todayStr)
      .sort(compareMomentsDescending)
  }, [moments, todayStr])

  const pastMomentsGrouped = useMemo(() => {
    const past = moments.filter((item) => normalizeDateString(item.date) !== todayStr)
    const groups: Record<string, MomentItem[]> = {}
    for (const item of past) {
      const dKey = normalizeDateString(item.date) || 'unknown'
      if (!groups[dKey]) groups[dKey] = []
      groups[dKey].push(item)
    }
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dKey) => {
        let label = dKey
        if (dKey === yesterdayStr) {
          label = lang === 'vi' ? `Hôm qua - ${dKey.split('-').reverse().join('/')}` : `Yesterday - ${dKey}`
        } else {
          label = dKey.split('-').reverse().join('/')
        }
        return {
          dateKey: dKey,
          label,
          items: groups[dKey].sort(compareMomentsDescending),
        }
      })
  }, [moments, todayStr, yesterdayStr, lang])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -5
    const rotateY = ((x - centerX) / centerX) * 5
    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)'
  }

  const renderMomentCard = (item: MomentItem, isFirst: boolean) => {
    const moodInfo = moodMetadata[item.mood] || { vi: item.mood, en: item.mood, icon: 'Leaf' }

    return (
      <div
        key={item.id}
        id={`moment-card-${item.id}`}
        className="relative group transition-all duration-300"
      >
        {/* Timeline Indicator Dot */}
        <div
          className={`absolute -left-[17px] sm:-left-[21px] top-1.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transition-transform group-hover:scale-125 ${
            isFirst ? 'bg-theme-accent shadow-xs' : 'bg-theme-main/60'
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>

        {/* Card Container */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-zinc-600 font-medium">{item.time}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-theme bg-theme-surface text-theme-main flex items-center space-x-1 font-sans">
                <MoodIcon name={moodInfo.icon} className="w-3 h-3 text-theme-accent" />
                <span>{moodInfo[lang]}</span>
              </span>
              {item.driveName && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span className="text-[11px] text-theme-muted font-mono">{item.driveName}</span>
                </>
              )}
            </div>

            {onDeleteMoment && (
              <button
                type="button"
                onClick={() => onDeleteMoment(item.id)}
                className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-opacity opacity-0 group-hover:opacity-100 touch-target cursor-pointer"
                title={lang === 'vi' ? 'Xóa khoảnh khắc' : 'Delete moment'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="tilt-card border border-theme rounded-lg p-3.5 sm:p-4 bg-white shadow-card space-y-3 border-theme-hover transition-all"
          >
            <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">{item.caption}</p>

            {item.image && (
              <div
                onClick={() => onOpenLightbox(item.image!)}
                className="border border-theme rounded-md overflow-hidden w-full sm:max-w-sm bg-theme-surface cursor-zoom-in group/img relative"
              >
                <img
                  src={item.image}
                  alt="Moment"
                  className="w-full h-40 sm:h-44 object-cover group-hover/img:scale-[1.02] transition-transform duration-300"
                />
                {/* Analog Film Date Stamp Imprint */}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-amber-300 font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded border border-amber-500/30 select-none flex items-center space-x-1">
                  <Camera className="w-2.5 h-2.5" />
                  <span>{item.date}</span>
                </div>

                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono flex items-center space-x-1">
                  <Maximize2 className="w-3 h-3" />
                  <span>{t.view_photo}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const pastMomentsCount = moments.length - todayMoments.length

  return (
    <section className="space-y-6 sm:space-y-7">
      {/* Header: Title + Filter Toggle (Today vs All) */}
      <div className="flex items-center justify-between border-b border-theme pb-3 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <CalendarClock className="w-3.5 h-3.5 text-theme-accent" />
          <h2 className="text-xs font-semibold text-theme-main uppercase tracking-wider">
            {t.timeline_title}
          </h2>
          <span className="text-xs text-theme-accent font-mono">
            {todayMoments.length} {t.items_recorded}
          </span>
        </div>

        {/* View Mode Filter: Today vs All */}
        {pastMomentsCount > 0 && (
          <div className="flex items-center space-x-1 p-0.5 bg-theme-surface rounded-lg border border-theme text-[11px] font-sans">
            <button
              type="button"
              onClick={() => setFilterMode('today')}
              className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                filterMode === 'today'
                  ? 'bg-white text-theme-main font-semibold shadow-2xs border border-theme/60'
                  : 'text-zinc-500 hover:text-theme-main'
              }`}
            >
              {lang === 'vi' ? `Hôm nay (${todayMoments.length})` : `Today (${todayMoments.length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-theme-main font-semibold shadow-2xs border border-theme/60'
                  : 'text-zinc-500 hover:text-theme-main'
              }`}
            >
              {lang === 'vi' ? `Tất cả (${moments.length})` : `All (${moments.length})`}
            </button>
          </div>
        )}
      </div>

      {/* Today's Timeline (Strictly Today's Moments) */}
      {todayMoments.length === 0 ? (
        <div className="p-8 text-center bg-theme-surface/40 rounded-xl border border-theme border-dashed space-y-2">
          <Camera className="w-8 h-8 text-theme-muted mx-auto opacity-50" />
          <p className="text-xs text-theme-muted">
            {lang === 'vi'
              ? 'Chưa có khoảnh khắc nào trong hôm nay. Hãy chia sẻ cảm xúc đầu tiên của bạn ở trên!'
              : 'No moments recorded today yet. Capture your first moment above!'}
          </p>
        </div>
      ) : (
        <div className="relative pl-5 sm:pl-6 space-y-6 sm:space-y-7 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-theme perspective-container">
          {todayMoments.map((item, idx) => renderMomentCard(item, idx === 0))}
        </div>
      )}

      {/* Past Moments Section (Shown when filterMode === 'all') */}
      {filterMode === 'all' && pastMomentsGrouped.length > 0 && (
        <div className="pt-6 border-t border-theme/80 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center space-x-2">
              <History className="w-3.5 h-3.5 text-theme-muted" />
              <span>{lang === 'vi' ? 'Khoảnh khắc các ngày trước' : 'Previous Days'}</span>
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">
              {pastMomentsCount} {t.items_recorded}
            </span>
          </div>

          <div className="space-y-6">
            {pastMomentsGrouped.map((group) => (
              <div key={group.dateKey} className="space-y-3">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-theme-surface border border-theme text-[11px] font-mono text-theme-main font-medium">
                  <Calendar className="w-3 h-3 text-theme-accent" />
                  <span>{group.label}</span>
                </div>

                <div className="relative pl-5 sm:pl-6 space-y-6 sm:space-y-7 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-theme perspective-container">
                  {group.items.map((item, idx) => renderMomentCard(item, idx === 0))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
