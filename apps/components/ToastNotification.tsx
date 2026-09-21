'use client'

import React from 'react'
import { CheckCircle2, Undo2 } from 'lucide-react'

interface ToastNotificationProps {
  message: string | null
  actionLabel?: string | null
  onAction?: () => void
}

export function ToastNotification({ message, actionLabel, onAction }: ToastNotificationProps) {
  if (!message) return null

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-50 pointer-events-none flex flex-col items-center sm:items-end">
      <div className="pointer-events-auto bg-zinc-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2.5 border border-zinc-800 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate max-w-[220px] sm:max-w-xs">{message}</span>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="ml-2 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-400/30 active:scale-95"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  )
}
