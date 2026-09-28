'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CloudOff,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Database,
  ArrowRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { checkGoogleDriveAuthStatus, DriveAuthStatus } from '@/lib/api-client'
import { LanguageType } from '@/lib/types'
import { dictionary } from '@/lib/i18n'

interface GoogleDriveAuthProps {
  lang: LanguageType
  onReauthSuccess?: () => void
}

/**
 * Compact icon indicator for Google Drive OAuth status.
 * Appears next to refresh button in header only when token is expired or needs action.
 * Clicking opens standard DayFlow Dialog modal with full responsive formatting.
 */
export function GoogleDriveAuthIndicator({ lang, onReauthSuccess }: GoogleDriveAuthProps) {
  const t = dictionary[lang]
  const [status, setStatus] = useState<DriveAuthStatus | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [justConnected, setJustConnected] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await checkGoogleDriveAuthStatus()
      setStatus(res)
    } catch {
      // Ignore
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Handle drive_auth query param after redirect back from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const driveAuth = params.get('drive_auth')

    if (driveAuth === 'success') {
      setJustConnected(true)
      setShowModal(false)

      const url = new URL(window.location.href)
      url.searchParams.delete('drive_auth')
      url.searchParams.delete('drive_auth_msg')
      window.history.replaceState({}, '', url.pathname + (url.search || ''))

      setTimeout(async () => {
        await fetchStatus()
        if (onReauthSuccess) onReauthSuccess()
      }, 500)

      setTimeout(() => setJustConnected(false), 5000)
    } else if (driveAuth === 'error') {
      setShowModal(true)
      const url = new URL(window.location.href)
      url.searchParams.delete('drive_auth')
      url.searchParams.delete('drive_auth_msg')
      window.history.replaceState({}, '', url.pathname + (url.search || ''))
    }
  }, [fetchStatus, onReauthSuccess])

  const handleConnectDrive = () => {
    window.location.href = '/api/auth/google'
  }

  if (!status) return null
  if (!status.hasOAuthConfig) return null

  const needsAction = status.needsReauth || (status.hasOAuthConfig && !status.hasRefreshToken)
  const isExpired = status.needsReauth && status.hasRefreshToken

  // Just connected — show green check briefly
  if (justConnected) {
    return (
      <div
        className="p-1 sm:p-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs animate-in fade-in duration-300"
        title={t.drive_auth_connected_success}
      >
        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
      </div>
    )
  }

  // Token valid — no indicator needed
  if (!needsAction && status.isTokenValid) return null
  if (!needsAction) return null

  return (
    <>
      {/* Compact warning icon in header */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="relative p-1 sm:p-1.5 rounded-md border border-amber-300/80 bg-amber-50 hover:bg-amber-100 text-amber-700 transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
        title={isExpired ? t.drive_auth_tooltip_expired : t.drive_auth_tooltip_unconnected}
        aria-label="Google Drive status"
      >
        <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 ring-1 ring-white" />
        </span>
      </button>

      {/* Standard Dialog Modal - Compact, cleanly padded, non-fullwidth */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          showCloseButton={true}
          className="w-[calc(100%-2rem)] max-w-[390px] bg-white border-theme shadow-modal p-4 sm:p-5 rounded-2xl max-h-[85vh] flex flex-col overflow-hidden gap-3"
        >
          {/* Header */}
          <DialogHeader className="border-b border-theme pb-3 shrink-0 flex-row items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs shrink-0 ${
                isExpired
                  ? 'bg-amber-50 border-amber-300/80 text-amber-700'
                  : 'bg-blue-50 border-blue-300/80 text-blue-700'
              }`}
            >
              {isExpired ? <CloudOff className="w-4.5 h-4.5" /> : <HardDrive className="w-4.5 h-4.5" />}
            </div>
            <div className="min-w-0 pr-6">
              <DialogTitle className="text-sm font-bold text-theme-main truncate leading-tight">
                {isExpired ? t.drive_auth_modal_title_expired : t.drive_auth_modal_title_unconnected}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-theme-muted truncate mt-0.5">
                {isExpired ? t.drive_auth_modal_sub_expired : t.drive_auth_modal_sub_unconnected}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Modal Body */}
          <div className="overflow-y-auto flex-1 space-y-3 py-1 pr-0.5">
            {/* Alert Box */}
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                isExpired
                  ? 'bg-amber-50/80 border-amber-200/90 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200/90 text-blue-900'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isExpired ? 'text-amber-600' : 'text-blue-600'
                }`}
              />
              <div className="leading-relaxed">
                <span className="font-semibold block mb-0.5 text-xs">
                  {isExpired ? t.drive_auth_alert_title_expired : t.drive_auth_alert_title_unconnected}
                </span>
                <p className="text-[11px] text-zinc-600 leading-normal">
                  {isExpired ? t.drive_auth_alert_desc_expired : t.drive_auth_alert_desc_unconnected}
                </p>
              </div>
            </div>

            {/* Sync Information Details */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider px-0.5">
                {t.drive_auth_section_sync}
              </div>
              <div className="p-3 bg-theme-surface/70 border border-theme rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">{t.drive_auth_oauth_config}</span>
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.drive_auth_status_configured}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-theme/60 pt-2">
                  <span className="text-zinc-500">{t.drive_auth_token_label}</span>
                  {status.hasRefreshToken ? (
                    <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t.drive_auth_token_expired}</span>
                    </span>
                  ) : (
                    <span className="text-zinc-500">{t.drive_auth_token_unauthorized}</span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-theme/60 pt-2">
                  <span className="text-zinc-500">{t.drive_auth_destination_label}</span>
                  <span className="font-mono text-[11px] font-medium text-theme-main flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-theme-accent" />
                    <span>
                      {isExpired ? 'Local Sandbox (fallback)' : 'Google Drive'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2.5 border-t border-theme/60 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-theme-main bg-white hover:bg-theme-surface border border-theme transition-colors cursor-pointer shadow-2xs"
            >
              {t.drive_auth_btn_close}
            </button>
            <button
              type="button"
              onClick={handleConnectDrive}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold btn-theme-gradient text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>{isExpired ? t.drive_auth_btn_reconnect : t.drive_auth_btn_connect}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
