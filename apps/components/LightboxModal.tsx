'use client'

import React, { useEffect } from 'react'
import { LanguageType } from '@/lib/types'
import { dictionary } from '@/lib/i18n'
import { X } from 'lucide-react'

interface LightboxModalProps {
  imageSrc: string | null
  lang: LanguageType
  onClose: () => void
}

export function LightboxModal({ imageSrc, lang, onClose }: LightboxModalProps) {
  const t = dictionary[lang]

  useEffect(() => {
    if (!imageSrc) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageSrc, onClose])

  if (!imageSrc) return null

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 text-xs font-mono flex items-center space-x-1 touch-target cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>{t.lightbox_close}</span>
        </button>
        <img
          src={imageSrc}
          alt="Enlarged moment"
          className="rounded-lg max-h-[80vh] w-auto shadow-modal object-contain border border-zinc-700"
        />
      </div>
    </div>
  )
}
