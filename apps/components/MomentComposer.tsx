'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LanguageType, MoodType, MomentItem } from '@/lib/types'
import { dictionary, moodMetadata } from '@/lib/i18n'
import { getClientTimeZoneOffset, getClientLocalDateString } from '@/lib/time'
import { Camera, Send, X } from 'lucide-react'
import { MoodIcon } from '@/components/MoodIcon'
import { getNextMomentImageTag } from '@/lib/moment-utils'

interface MomentComposerProps {
  lang: LanguageType
  onAddMoment: (moment: Omit<MomentItem, 'id'>, rawFile?: File) => void | Promise<void>
  existingMoments?: MomentItem[]
}

export function MomentComposer({ lang, onAddMoment, existingMoments = [] }: MomentComposerProps) {
  const t = dictionary[lang]
  const [caption, setCaption] = useState('')
  const [mood, setMood] = useState<MoodType>('serene')
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [driveNameLabel, setDriveNameLabel] = useState('')
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [liveTime, setLiveTime] = useState('11:35')

  useEffect(() => {
    const updateTime = () => {
      const d = new Date()
      setLiveTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'jpg'
      const { tag, driveName, getFilename } = getNextMomentImageTag(existingMoments)
      const targetFilename = getFilename(ext)

      // Rename File object so rawFile.name follows moment convention (#img_XX.ext)
      const renamedFile = new File([file], targetFilename, { type: file.type })

      setRawFile(renamedFile)
      setFileName(targetFilename)
      setDriveNameLabel(driveName)

      const reader = new FileReader()
      reader.onload = (evt) => {
        setFilePreview(evt.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClearFile = () => {
    setFilePreview(null)
    setFileName('')
    setDriveNameLabel('')
    setRawFile(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!caption.trim()) return

    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const dateStr = getClientLocalDateString(now)

    onAddMoment(
      {
        time: timeStr,
        date: dateStr,
        caption: caption.trim(),
        mood,
        image: filePreview || undefined,
        driveName: driveNameLabel || (fileName ? `Google Drive: ${fileName}` : undefined),
      },
      rawFile || undefined
    )

    setCaption('')
    handleClearFile()
  }

  return (
    <Card className="border-theme rounded-lg p-4 sm:p-5 bg-white shadow-xs space-y-3.5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-theme-main flex items-center space-x-1.5">
          <span>{t.moment_box_title}</span>
        </h2>
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-mono text-theme-accent bg-theme-surface px-2 py-0.5 rounded border border-theme">
            {liveTime}
          </span>
          <span className="text-[10px] font-mono text-theme-muted bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200">
            {getClientTimeZoneOffset()}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Textarea
          rows={2}
          required
          placeholder={t.moment_placeholder}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-white border border-theme rounded-md p-3 text-base sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-theme/20 resize-none leading-relaxed"
        />

        {/* Micro-Mood Tags Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-theme-muted flex items-center space-x-1">
            <span>{t.label_mood}</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {(Object.keys(moodMetadata) as MoodType[]).map((key) => {
              const isSelected = mood === key
              const item = moodMetadata[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMood(key)}
                  className={`w-full px-2 py-1.5 min-h-[38px] rounded-md text-xs font-medium transition-all flex items-center justify-center space-x-1 cursor-pointer active:opacity-60 ${
                    isSelected
                      ? 'btn-theme-gradient text-white shadow-xs font-semibold border border-theme'
                      : 'border border-theme bg-white hover:bg-theme-surface text-theme-main'
                  }`}
                >
                  <MoodIcon name={item.icon} className="w-3.5 h-3.5 shrink-0 pointer-events-none" />
                  <span className="truncate pointer-events-none">{item[lang]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Image Preview Container */}
        {filePreview && (
          <div className="p-2.5 border border-dashed border-theme rounded-md bg-theme-surface flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded overflow-hidden bg-white border border-theme shrink-0">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-medium text-theme-main truncate max-w-[180px] sm:max-w-[280px]">
                  {fileName}
                </p>
                <p className="text-[10px] text-theme-muted font-mono">
                  {driveNameLabel ? `${driveNameLabel} • ${t.ready_to_upload}` : t.ready_to_upload}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="text-zinc-400 hover:text-rose-600 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded touch-target cursor-pointer active:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <label className="cursor-pointer border border-dashed border-theme hover:border-theme-hover hover:bg-theme-surface rounded-md px-3.5 py-2.5 w-full sm:w-auto flex items-center justify-center space-x-2 text-xs font-medium text-theme-main transition-all touch-target active:opacity-75 min-h-[42px]">
            <Camera className="w-4 h-4 text-theme-accent" />
            <span>{fileName || t.btn_choose_photo}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <Button
            type="submit"
            className="w-full sm:w-auto btn-theme-gradient text-white font-medium text-xs sm:text-sm py-2.5 px-6 rounded-md shadow-xs transition-all flex items-center justify-center space-x-2 h-11 cursor-pointer active:opacity-75 touch-target"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.btn_post_moment}</span>
          </Button>
        </div>
      </form>
    </Card>
  )
}
