'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, RefreshCw, Database, ExternalLink, X, HelpCircle, HardDrive } from 'lucide-react'
import { checkHealth, initSpreadsheetApi, HealthResponse } from '@/lib/api-client'
import { LanguageType } from '@/lib/types'

interface SyncStatusBannerProps {
  lang: LanguageType
  onRefreshData?: () => void
}

export function SyncStatusBanner({ lang, onRefreshData }: SyncStatusBannerProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    const res = await checkHealth()
    setHealth(res)
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleInit = async () => {
    setInitLoading(true)
    const res = await initSpreadsheetApi()
    if (res.success) {
      await fetchStatus()
      if (onRefreshData) onRefreshData()
    } else {
      alert(res.error || res.message || 'Lỗi khởi tạo')
    }
    setInitLoading(false)
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchStatus()
    if (onRefreshData) {
      await onRefreshData()
    }
    setLoading(false)
  }

  if (!health || dismissed) return null

  // 1. Fully Connected OK
  if (health.status === 'ok') {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 sm:px-3.5 sm:py-2 text-xs text-emerald-800 flex items-center justify-between transition-all">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">
            {lang === 'vi'
              ? 'Google Sheets & Google Drive: Đã kết nối và đồng bộ'
              : 'Google Sheets & Drive: Connected & Synced'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            title={lang === 'vi' ? 'Đồng bộ lại từ Google Sheets' : 'Sync again from Google Sheets'}
            className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-emerald-100 rounded text-emerald-600 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // 2. Degraded: Configured but Sheets tabs not created yet
  if (health.status === 'degraded') {
    return (
      <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold">
              {lang === 'vi'
                ? 'Đã kết nối Google API nhưng bảng tính chưa có cấu trúc 4 Tabs!'
                : 'Connected to Google API, but 4 Tabs need initialization!'}
            </span>
            <p className="text-[11px] text-amber-700">
              {lang === 'vi'
                ? 'Bấm nút bên cạnh để hệ thống tự động tạo các Tab (Expenses, Debts, Moments, Balances) và cố định hàng header.'
                : 'Click button to automatically generate Expenses, Debts, Moments, Balances tabs.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleInit}
            disabled={initLoading}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md shadow-xs text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${initLoading ? 'animate-spin' : ''}`} />
            <span>{initLoading ? (lang === 'vi' ? 'Đang tạo...' : 'Creating...') : (lang === 'vi' ? 'Tự động khởi tạo Sheets' : 'Auto-Init Sheets')}</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-100 rounded text-amber-700 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // 3. Not configured: Running in offline local memory mode
  return (
    <>
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 sm:px-3.5 sm:py-2.5 text-xs text-zinc-700 flex items-center justify-between transition-all">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Database className="w-4 h-4 text-zinc-500 shrink-0" />
          <div className="min-w-0">
            <span className="font-medium text-zinc-800">
              {lang === 'vi' ? 'Chế độ Trải nghiệm Cục bộ (Local Sandbox)' : 'Local Sandbox Mode'}
            </span>
            <span className="text-zinc-500 hidden sm:inline ml-1.5">
              • {lang === 'vi' ? 'Để đồng bộ dữ liệu vào Google Sheets & Drive, hãy cấu hình .env.local' : 'Configure .env.local to sync with Google Sheets & Drive'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowGuide(true)}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-700 font-medium rounded text-[11px] flex items-center space-x-1 cursor-pointer transition shadow-2xs"
          >
            <HelpCircle className="w-3 h-3 text-zinc-500" />
            <span>{lang === 'vi' ? 'Hướng dẫn kết nối Google' : 'Setup Guide'}</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-zinc-200 rounded text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xl max-w-xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">
                  {lang === 'vi' ? 'Cấu Hình Google Sheets & Google Drive' : 'Google Sheets & Drive Setup'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-zinc-700">
              <p className="text-zinc-600">
                {lang === 'vi'
                  ? 'Ứng dụng đã sẵn sàng 100% backend. Để kết nối với bảng tính và Google Drive của bạn, hãy làm theo 4 bước tóm tắt sau:'
                  : 'Backend is 100% ready. Follow these 4 quick steps to connect with your Google account:'}
              </p>

              <ol className="list-decimal pl-4 space-y-2 font-medium text-zinc-800">
                <li>
                  <span className="font-semibold">Bật API:</span> Vào Google Cloud Console bật <code>Google Sheets API</code> và <code>Google Drive API</code>.
                </li>
                <li>
                  <span className="font-semibold">Tạo Service Account:</span> Tạo tài khoản dịch vụ, tạo Key định dạng JSON và lưu vào <code>frontend/credentials/service-account.json</code>.
                </li>
                <li>
                  <span className="font-semibold">Chia sẻ quyền:</span> Mở Google Spreadsheet và thư mục Google Drive của bạn, bấm <b>Share (Chia sẻ)</b> cho email Service Account với quyền <b>Editor</b>.
                </li>
                <li>
                  <span className="font-semibold">Tạo file .env.local:</span> Sao chép từ <code>frontend/.env.example</code> sang <code>frontend/.env.local</code> và dán ID của Spreadsheet và Drive Folder.
                </li>
              </ol>

              <div className="p-3 bg-zinc-900 text-zinc-100 rounded-md font-mono text-[11px] overflow-x-auto">
                <p className="text-emerald-400 mb-1"># File: frontend/.env.local</p>
                <p>GOOGLE_SPREADSHEET_ID=your_spreadsheet_id</p>
                <p>GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id</p>
                <p>GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./credentials/service-account.json</p>
              </div>

              <p className="text-[11px] text-zinc-500 italic">
                {lang === 'vi'
                  ? 'Sau khi lưu file .env.local, bạn chỉ cần bấm "Tự động khởi tạo Sheets" để hệ thống tự động tạo mọi bảng và cột!'
                  : 'After saving .env.local, click "Auto-Init Sheets" and the system will automatically create all tables and columns!'}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-black text-white font-medium text-xs rounded-md shadow-xs cursor-pointer"
              >
                {lang === 'vi' ? 'Đã hiểu' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
