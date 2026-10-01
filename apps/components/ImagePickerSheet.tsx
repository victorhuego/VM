'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Camera, ImageIcon, X } from 'lucide-react'
import { ThemeType } from '@/lib/types'

interface ImagePickerSheetProps {
  /** Whether the picker sheet is visible */
  open: boolean
  /** Called when the sheet should close (cancel or after picking) */
  onClose: () => void
  /** Called with the selected File */
  onFile: (file: File) => void
  /** Label shown at the top of the sheet */
  label?: string
}

/**
 * Custom themed image picker bottom sheet.
 * Replaces the raw OS file dialog with a per-theme styled picker.
 *
 * Shows two options:
 *   • Camera  — triggers <input capture="environment">
 *   • Gallery — triggers <input type="file"> without capture
 */
export function ImagePickerSheet({
  open,
  onClose,
  onFile,
  label,
}: ImagePickerSheetProps) {
  const [theme, setTheme] = useState<ThemeType>('classic')
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Read active theme from <html data-theme="...">
  useEffect(() => {
    const read = () => {
      const t = (document.documentElement.getAttribute('data-theme') as ThemeType) || 'classic'
      setTheme(t)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFile(file)
      onClose()
    }
    // reset so same file can be selected again
    e.target.value = ''
  }

  if (!open) return null

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Overlay / Backdrop */}
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Sheet */}
        <div
          className="relative w-full max-w-lg mx-auto animate-in slide-in-from-bottom duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <SheetContent
            theme={theme}
            label={label}
            onCamera={() => cameraInputRef.current?.click()}
            onGallery={() => galleryInputRef.current?.click()}
            onClose={onClose}
          />
        </div>
      </div>
    </>
  )
}

// ─── Per-Theme Sheet Renderers ──────────────────────────────────────────────

interface SheetContentProps {
  theme: ThemeType
  label?: string
  onCamera: () => void
  onGallery: () => void
  onClose: () => void
}

function SheetContent(props: SheetContentProps) {
  switch (props.theme) {
    case 'retro':    return <RetroSheet {...props} />
    case 'fantasy':  return <FantasySheet {...props} />
    case 'ronin':    return <RoninSheet {...props} />
    case 'cozy':     return <CozySheet {...props} />
    default:         return <ClassicSheet {...props} />
  }
}

// ─── Classic ─────────────────────────────────────────────────────────────────
function ClassicSheet({ label, onCamera, onGallery, onClose }: SheetContentProps) {
  return (
    <div className="bg-white overflow-hidden shadow-2xl pb-safe">
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-zinc-200" />
      </div>

      {label && (
        <p className="text-center text-xs text-zinc-400 font-medium pb-2 px-4">{label}</p>
      )}

      <div className="p-4 space-y-2.5">
        <button
          type="button"
          onClick={onCamera}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium text-sm hover:bg-zinc-100 active:scale-98 transition-all"
        >
          <Camera className="w-5 h-5 text-zinc-500" />
          <span>Camera</span>
        </button>
        <button
          type="button"
          onClick={onGallery}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium text-sm hover:bg-zinc-100 active:scale-98 transition-all"
        >
          <ImageIcon className="w-5 h-5 text-zinc-500" />
          <span>Photo Library</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center justify-center px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-500 font-semibold text-sm hover:bg-zinc-50 active:scale-98 transition-all mt-1"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
      </div>
      <div className="h-2" />
    </div>
  )
}

// ─── Cozy ─────────────────────────────────────────────────────────────────────
function CozySheet({ label, onCamera, onGallery, onClose }: SheetContentProps) {
  return (
    <div className="overflow-hidden shadow-2xl pb-safe" style={{ background: '#FAF5ED', border: '1.5px solid #e9d5b0', borderBottom: 'none' }}>
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ background: '#D4A96A' }} />
      </div>

      {label && (
        <p className="text-center text-xs font-medium pb-2 px-4" style={{ color: '#8B6940' }}>{label}</p>
      )}

      <div className="p-4 space-y-2.5">
        <button
          type="button"
          onClick={onCamera}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium text-sm active:scale-98 transition-all"
          style={{ background: '#FFF8EE', border: '1.5px solid #e9d5b0', color: '#5C3D11' }}
        >
          <Camera className="w-5 h-5" style={{ color: '#C17F3B' }} />
          <span>Camera</span>
        </button>
        <button
          type="button"
          onClick={onGallery}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium text-sm active:scale-98 transition-all"
          style={{ background: '#FFF8EE', border: '1.5px solid #e9d5b0', color: '#5C3D11' }}
        >
          <ImageIcon className="w-5 h-5" style={{ color: '#C17F3B' }} />
          <span>Photo Library</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center justify-center px-4 py-3.5 rounded-2xl font-semibold text-sm active:scale-98 transition-all mt-1"
          style={{ background: '#FAF5ED', border: '1.5px solid #e9d5b0', color: '#9C7A50' }}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
      </div>
      <div className="h-2" />
    </div>
  )
}

// ─── Fantasy ──────────────────────────────────────────────────────────────────
function FantasySheet({ label, onCamera, onGallery, onClose }: SheetContentProps) {
  return (
    <div
      className="overflow-hidden shadow-2xl pb-safe"
      style={{
        background: 'linear-gradient(180deg, #131929 0%, #0D121D 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderBottom: 'none',
        boxShadow: '0 -8px 32px rgba(139,92,246,0.15)',
      }}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(139,92,246,0.5)' }} />
      </div>

      {label && (
        <p className="text-center text-xs font-medium pb-2 px-4" style={{ color: 'rgba(139,92,246,0.8)' }}>{label}</p>
      )}

      <div className="p-4 space-y-2.5">
        <button
          type="button"
          onClick={onCamera}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm active:scale-98 transition-all"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.25)',
            color: '#E0D7FF',
          }}
        >
          <Camera className="w-5 h-5" style={{ color: '#A78BFA' }} />
          <span>Camera</span>
        </button>
        <button
          type="button"
          onClick={onGallery}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm active:scale-98 transition-all"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.25)',
            color: '#E0D7FF',
          }}
        >
          <ImageIcon className="w-5 h-5" style={{ color: '#A78BFA' }} />
          <span>Photo Library</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center justify-center px-4 py-3.5 rounded-xl font-semibold text-sm active:scale-98 transition-all mt-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </button>
      </div>
      <div className="h-2" />
    </div>
  )
}

// ─── Retro (Windows 95) ───────────────────────────────────────────────────────
function RetroSheet({ label, onCamera, onGallery, onClose }: SheetContentProps) {
  return (
    <div
      className="pb-safe"
      style={{ background: '#C0C0C0', fontFamily: '"MS Sans Serif", "Segoe UI", Tahoma, sans-serif' }}
    >
      {/* Win95 Title Bar */}
      <div
        className="flex items-center justify-between px-2 py-1"
        style={{ background: 'linear-gradient(to right, #000080, #1084D0)' }}
      >
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-bold tracking-wide">
            {label || 'Select Image'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-4 h-4 flex items-center justify-center text-[10px] font-bold"
          style={{
            background: '#C0C0C0',
            border: '1.5px solid',
            borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
            color: '#000',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Content area */}
      <div
        className="p-3 space-y-2"
        style={{
          border: '2px solid',
          borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
        }}
      >
        <p className="text-xs text-black mb-3">
          Choose image source:
        </p>
        <button
          type="button"
          onClick={onCamera}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-black"
          style={{
            background: '#C0C0C0',
            border: '2px solid',
            borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
            boxShadow: 'inset -1px -1px 0 #404040, inset 1px 1px 0 #FFFFFF',
          }}
        >
          <Camera className="w-4 h-4" />
          <span>📷  Camera</span>
        </button>
        <button
          type="button"
          onClick={onGallery}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-black"
          style={{
            background: '#C0C0C0',
            border: '2px solid',
            borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
            boxShadow: 'inset -1px -1px 0 #404040, inset 1px 1px 0 #FFFFFF',
          }}
        >
          <ImageIcon className="w-4 h-4" />
          <span>🖼️  Photo Library</span>
        </button>
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-1.5 text-xs font-bold text-black"
            style={{
              background: '#C0C0C0',
              border: '2px solid',
              borderColor: '#FFFFFF #808080 #808080 #FFFFFF',
              boxShadow: 'inset -1px -1px 0 #404040, inset 1px 1px 0 #FFFFFF',
              minWidth: 70,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="h-2" />
    </div>
  )
}

// ─── Ronin ────────────────────────────────────────────────────────────────────
function RoninSheet({ label, onCamera, onGallery, onClose }: SheetContentProps) {
  return (
    <div
      className="overflow-hidden pb-safe"
      style={{
        background: '#07090C',
        borderTop: '1px solid #E63946',
        boxShadow: '0 -4px 24px rgba(230,57,70,0.12)',
      }}
    >
      {/* Red accent strip */}
      <div className="h-0.5 w-full" style={{ background: '#E63946' }} />

      <div className="flex justify-center pt-3 pb-1">
        <div className="w-8 h-0.5 rounded-full" style={{ background: '#E63946' }} />
      </div>

      {label && (
        <p className="text-center text-[11px] font-mono uppercase tracking-widest pb-2 px-4" style={{ color: '#E63946' }}>{label}</p>
      )}

      <div className="p-4 space-y-2">
        <button
          type="button"
          onClick={onCamera}
          className="w-full flex items-center gap-3 px-4 py-3.5 font-mono text-sm active:scale-98 transition-all"
          style={{
            background: 'transparent',
            border: '1px solid rgba(230,57,70,0.4)',
            color: '#F8F8F8',
          }}
        >
          <Camera className="w-4 h-4" style={{ color: '#E63946' }} />
          <span>CAMERA</span>
        </button>
        <button
          type="button"
          onClick={onGallery}
          className="w-full flex items-center gap-3 px-4 py-3.5 font-mono text-sm active:scale-98 transition-all"
          style={{
            background: 'transparent',
            border: '1px solid rgba(230,57,70,0.4)',
            color: '#F8F8F8',
          }}
        >
          <ImageIcon className="w-4 h-4" style={{ color: '#E63946' }} />
          <span>PHOTO LIBRARY</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center justify-center px-4 py-3 font-mono text-xs active:scale-98 transition-all mt-1"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          — CANCEL —
        </button>
      </div>
      <div className="h-2" />
    </div>
  )
}
