'use client'

import React, { useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { LanguageType, UserProfile } from '@/lib/types'
import { LogOut, User, Loader2, Maximize2, Camera, Lock } from 'lucide-react'
import { apiUploadImage, apiUpdateUserAvatar } from '@/lib/api-client'
import { CURRENCY_METADATA } from '@/lib/i18n'

interface UserManagerTabProps {
  currentUser: UserProfile
  lang: LanguageType
  onLogout: () => void
  onUpdateAvatar?: (avatarUrl: string) => void
  onOpenLightbox?: (src: string) => void
}

export function UserManagerTab({
  currentUser,
  lang,
  onLogout,
  onUpdateAvatar,
  onOpenLightbox,
}: UserManagerTabProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // Reset so same file can be selected again if needed

    setIsUploading(true)
    setErrorMsg(null)
    try {
      const uploadRes = await apiUploadImage(file, currentUser.username, undefined, 'avatar')
      if (!uploadRes || !uploadRes.url) {
        throw new Error(lang === 'vi' ? 'Không thể tải ảnh lên' : 'Failed to upload image')
      }

      const updateRes = await apiUpdateUserAvatar(currentUser.username, uploadRes.url)
      if (!updateRes.success) {
        throw new Error(updateRes.error || (lang === 'vi' ? 'Không thể lưu avatar vào hệ thống' : 'Failed to save avatar'))
      }

      if (onUpdateAvatar) {
        onUpdateAvatar(uploadRes.url)
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (lang === 'vi' ? 'Lỗi khi cập nhật avatar' : 'Error updating avatar'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto pt-4 sm:pt-8 animate-in fade-in duration-200">
      <Card className="border-theme rounded-2xl p-6 sm:p-8 bg-white shadow-card space-y-6">
        {/* Avatar next to Name */}
        <div className="flex items-center justify-center space-x-4 sm:space-x-5">
          {/* Avatar / Placeholder (Bounded Square, Bigger, User Icon) */}
          <div className="relative shrink-0">
            {currentUser.avatar ? (
              <div className="relative group">
                {/* Clicking avatar opens lightbox (show như các hình khác, không download) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenLightbox?.(currentUser.avatar!)}
                  title={lang === 'vi' ? 'Xem ảnh phóng to' : 'View full image'}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-theme shadow-sm flex items-center justify-center bg-slate-50 cursor-zoom-in group select-none"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.displayName || currentUser.username}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {/* Subtle hover icon */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                    <Maximize2 className="w-5 h-5 drop-shadow" />
                  </div>
                </div>

                {/* Change Avatar Button (in corner) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isUploading) fileInputRef.current?.click()
                  }}
                  disabled={isUploading}
                  title={lang === 'vi' ? 'Đổi ảnh đại diện' : 'Change avatar'}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full btn-theme-gradient text-white shadow-md flex items-center justify-center border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                title={lang === 'vi' ? 'Tải ảnh đại diện' : 'Upload avatar'}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-theme shadow-sm flex items-center justify-center transition hover:ring-2 hover:ring-theme-main/40 focus:outline-none cursor-pointer bg-theme-surface/60 group"
              >
                <div className="w-full h-full flex flex-col items-center justify-center bg-theme-accent/10 hover:bg-theme-accent/20 text-theme-main transition p-1">
                  <User className="w-9 h-9 sm:w-10 sm:h-10 text-theme-accent mb-1 stroke-[1.75]" />
                  <span className="text-[11px] font-semibold text-theme-main tracking-tight leading-tight">
                    {lang === 'vi' ? 'Tải ảnh' : 'Upload'}
                  </span>
                </div>
              </button>
            )}

            {/* Uploading spinner overlay */}
            {isUploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center text-white z-10">
                <Loader2 className="w-7 h-7 animate-spin text-white mb-1" />
                <span className="text-[10px] font-mono text-white/90">
                  {lang === 'vi' ? 'Đang tải...' : 'Uploading...'}
                </span>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name only (cạnh tên) */}
          <div className="min-w-0 flex-1 text-left space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-theme-main tracking-tight truncate">
              {currentUser.displayName || currentUser.username}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-theme-muted truncate">
              @{currentUser.username}
            </p>
          </div>
        </div>

        {/* Currency Info (Immutable / Locked) */}
        <div className="p-3 rounded-xl bg-theme-surface/70 border border-theme flex items-center justify-between text-xs">
          <span className="text-theme-muted font-medium">
            {lang === 'vi' ? 'Đơn vị tiền tệ:' : 'Currency:'}
          </span>
          <div className="flex items-center space-x-1.5 font-semibold text-theme-main">
            <span className="font-mono">
              {currentUser.currency
                ? `${currentUser.currency} (${CURRENCY_METADATA[currentUser.currency]?.symbol || ''})`
                : (currentUser.username.toLowerCase() === 'jeandev' ? 'VND (₫)' : 'KRW (₩)')}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-600 font-sans flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" />
              <span>{lang === 'vi' ? 'Cố định' : 'Fixed'}</span>
            </span>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 font-medium text-center">
            {errorMsg}
          </p>
        )}

        {/* Logout button matching the theme */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-xl btn-theme-gradient text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{lang === 'vi' ? 'Đăng xuất' : 'Log out'}</span>
        </button>
      </Card>
    </div>
  )
}
