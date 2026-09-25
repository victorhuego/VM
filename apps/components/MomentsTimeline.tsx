'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import { LanguageType, MomentItem, UserProfile } from '@/lib/types'
import { dictionary, moodMetadata } from '@/lib/i18n'
import { CalendarClock, Camera, Maximize2, Trash2, History, Calendar, User, Sparkles, Heart } from 'lucide-react'
import { MoodIcon } from '@/components/MoodIcon'
import { getClientLocalDateString, getClientYesterdayDateString, normalizeDateString, compareMomentsDescending } from '@/lib/time'

interface UserFilterOption {
  value: string
  label: string
  count: number
  isMe?: boolean
}

interface MomentsTimelineProps {
  moments: MomentItem[]
  lang: LanguageType
  onOpenLightbox: (src: string) => void
  onDeleteMoment?: (id: string) => void
  currentUser?: UserProfile | null
}

export function MomentsTimeline({
  moments,
  lang,
  onOpenLightbox,
  onDeleteMoment,
  currentUser,
}: MomentsTimelineProps) {
  const t = dictionary[lang]
  const todayStr = getClientLocalDateString()
  const yesterdayStr = getClientYesterdayDateString()

  // Filter mode: 'today' | 'all' (default: 'today')
  const [filterMode, setFilterMode] = useState<'today' | 'all'>('today')
  // User filter: 'all' | username
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [mounted, setMounted] = useState(false)

  // Double-tap reaction burst state
  const [bursts, setBursts] = useState<Record<string, { id: number; x: number; y: number }[]>>({})
  const lastTapRef = useRef<Record<string, number>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  const availableUsers = useMemo(() => {
    const userSet = new Set<string>()
    if (currentUser?.username) {
      userSet.add(currentUser.username)
    }
    userSet.add('jeandev')
    for (const m of moments) {
      const u = m.user || 'jeandev'
      userSet.add(u)
    }
    return Array.from(userSet).sort()
  }, [moments, currentUser])

  const userOptions: UserFilterOption[] = useMemo(() => {
    const opts: UserFilterOption[] = [
      {
        value: 'all',
        label: lang === 'vi' ? 'Tất cả người dùng' : 'All users',
        count: moments.length,
      },
    ]

    for (const u of availableUsers) {
      const count = moments.filter((m) => (m.user || 'jeandev') === u).length
      const isMe = u === currentUser?.username
      opts.push({
        value: u,
        label: isMe
          ? lang === 'vi'
            ? `Bạn (@${u})`
            : `You (@${u})`
          : `@${u}`,
        count,
        isMe,
      })
    }
    return opts
  }, [availableUsers, moments, currentUser, lang])

  const currentSelectedOption = userOptions.find((opt) => opt.value === selectedUser) || userOptions[0]

  const filteredMoments = useMemo(() => {
    if (selectedUser === 'all') return moments
    return moments.filter((item) => (item.user || 'jeandev') === selectedUser)
  }, [moments, selectedUser])

  const todayMoments = useMemo(() => {
    return filteredMoments
      .filter((item) => normalizeDateString(item.date) === todayStr)
      .sort(compareMomentsDescending)
  }, [filteredMoments, todayStr])

  const pastMomentsGrouped = useMemo(() => {
    const past = filteredMoments.filter((item) => normalizeDateString(item.date) !== todayStr)
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
  }, [filteredMoments, todayStr, yesterdayStr, lang])

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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, itemId: string) => {
    const now = Date.now()
    const last = lastTapRef.current[itemId] || 0
    if (now - last < 400) {
      // Double tap detected!
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const burstId = Date.now()
      setBursts((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), { id: burstId, x, y }],
      }))
      setTimeout(() => {
        setBursts((prev) => ({
          ...prev,
          [itemId]: (prev[itemId] || []).filter((b) => b.id !== burstId),
        }))
      }, 850)
      lastTapRef.current[itemId] = 0
    } else {
      lastTapRef.current[itemId] = now
    }
  }

  const renderMomentCard = (item: MomentItem, isFirst: boolean) => {
    const moodInfo = moodMetadata[item.mood] || { vi: item.mood, en: item.mood, icon: 'Leaf' }
    const isAuthor = (Boolean(item.user) && item.user === currentUser?.username) || (!item.user && currentUser?.username === 'jeandev')

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
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-mono text-zinc-600 font-medium">{item.time}</span>
              {/* Author badge: 'Bạn' / 'You' or @username */}
              {isAuthor ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  {t.author_you || (lang === 'vi' ? 'Bạn' : 'You')}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                  @{item.user || 'jeandev'}
                </span>
              )}
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

            {onDeleteMoment && isAuthor && (
              <button
                type="button"
                onClick={() => onDeleteMoment(item.id)}
                className="text-zinc-400 hover:text-rose-600 p-1 rounded-md transition-opacity opacity-0 group-hover:opacity-100 touch-target cursor-pointer btn-spring"
                title={lang === 'vi' ? 'Xóa tin' : 'Delete moment'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            onClick={(e) => handleCardClick(e, item.id)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="bento-card tilt-card border border-theme/80 rounded-2xl p-3.5 sm:p-4 bg-white shadow-xs space-y-3 transition-all relative overflow-hidden cursor-pointer active:scale-[0.98] select-none"
          >
            {/* Double-tap Floating Particle Bursts */}
            {bursts[item.id]?.map((b) => (
              <div
                key={b.id}
                className="absolute pointer-events-none z-30 animate-heart-pop text-rose-500 drop-shadow-md flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                style={{ left: b.x, top: b.y }}
              >
                <Heart className="w-8 h-8 fill-rose-500 text-rose-400 stroke-rose-600" />
              </div>
            ))}

            <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">{item.caption}</p>

            {item.image && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenLightbox(item.image!)
                }}
                className="border border-theme rounded-xl overflow-hidden w-full sm:max-w-sm bg-theme-surface cursor-zoom-in group/img relative"
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

  const pastMomentsCount = filteredMoments.length - todayMoments.length

  return (
    <section className="space-y-6 sm:space-y-7">
      {/* Header: Title + Filters (User Selector & Today/All Toggle) */}
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

        {/* Filters Group: User Filter + View Mode Filter */}
        <div className="flex items-center space-x-2 flex-wrap gap-1.5">
          {/* User Filter via react-select */}
          <div className="w-36 sm:w-44 shrink-0">
            {!mounted ? (
              <div className="h-[30px] rounded-lg border border-theme flex items-center px-2 space-x-1.5 text-[11px] text-theme-main bg-white">
                <User className="w-3 h-3 text-theme-accent shrink-0" />
                <span className="truncate">{currentSelectedOption?.label}</span>
              </div>
            ) : (
              <Select<UserFilterOption>
                instanceId="moments-user-filter-select"
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                menuPosition="fixed"
                isSearchable={false}
                value={currentSelectedOption}
                onChange={(opt) => {
                  if (opt) setSelectedUser(opt.value)
                }}
                options={userOptions}
                formatOptionLabel={(option, { context }) => (
                  <div className="flex items-center justify-between space-x-1.5 text-xs w-full">
                    <div className="flex items-center space-x-1.5 truncate">
                      <User className="w-3 h-3 text-theme-accent shrink-0" />
                      <span className="font-medium truncate">{option.label}</span>
                    </div>
                    {context === 'menu' && (
                      <span className="text-[10px] font-mono text-theme-muted shrink-0 ml-1">
                        {option.count}
                      </span>
                    )}
                  </div>
                )}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: '30px',
                    height: '30px',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    borderColor: 'var(--theme-border)',
                    boxShadow: state.isFocused ? '0 0 0 1px var(--theme-accent)' : 'none',
                    '&:hover': {
                      borderColor: 'var(--theme-accent)',
                      backgroundColor: 'var(--theme-surface)',
                    },
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: '0 6px',
                    height: '30px',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'var(--theme-main)',
                    margin: 0,
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    height: '30px',
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
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--theme-border)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
                    zIndex: 9999,
                    minWidth: '170px',
                  }),
                  menuList: (base) => ({
                    ...base,
                    padding: '4px',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? 'var(--theme-surface)'
                      : state.isFocused
                      ? 'rgba(0, 0, 0, 0.04)'
                      : 'transparent',
                    color: state.isSelected ? 'var(--theme-accent)' : 'var(--theme-main)',
                    borderRadius: '0.375rem',
                    padding: '6px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    '&:active': {
                      backgroundColor: 'var(--theme-surface)',
                    },
                  }),
                }}
              />
            )}
          </div>

          {/* View Mode Filter: Today vs All */}
          {pastMomentsCount > 0 && (
            <div className="flex items-center space-x-1 p-0.5 bg-theme-surface rounded-lg border border-theme text-[11px] font-sans">
              <button
                type="button"
                onClick={() => setFilterMode('today')}
                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer btn-spring ${
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
                className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer btn-spring ${
                  filterMode === 'all'
                    ? 'bg-white text-theme-main font-semibold shadow-2xs border border-theme/60'
                    : 'text-zinc-500 hover:text-theme-main'
                }`}
              >
                {lang === 'vi' ? `Tất cả (${filteredMoments.length})` : `All (${filteredMoments.length})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Today's Timeline (Strictly Today's Moments) */}
      {todayMoments.length === 0 ? (
        <div className="p-8 text-center bg-theme-surface/40 rounded-xl border border-theme border-dashed space-y-2">
          <Camera className="w-8 h-8 text-theme-muted mx-auto opacity-50" />
          <p className="text-xs text-theme-muted">
            {selectedUser !== 'all'
              ? lang === 'vi'
                ? `Không có tin nào hôm nay từ @${selectedUser}.`
                : `No moments recorded today from @${selectedUser}.`
              : lang === 'vi'
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
