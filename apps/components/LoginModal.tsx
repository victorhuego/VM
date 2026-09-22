'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { LanguageType, UserProfile } from '@/lib/types'
import { apiLogin } from '@/lib/api-client'
import { Lock, User, LogIn, Sparkles, ShieldCheck } from 'lucide-react'

interface LoginModalProps {
  open: boolean
  lang: LanguageType
  onLoginSuccess: (user: UserProfile) => void
}

export function LoginModal({ open, lang, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleanUser = username.trim()
    if (!cleanUser) {
      setError(lang === 'vi' ? 'Vui lòng nhập tên đăng nhập' : 'Please enter a username')
      return
    }

    setLoading(true)
    try {
      const res = await apiLogin(cleanUser, password)
      if (res.success && res.user) {
        onLoginSuccess(res.user)
      } else {
        setError(res.error || (lang === 'vi' ? 'Đăng nhập không thành công' : 'Login failed'))
      }
    } catch (err: any) {
      setError(err?.message || (lang === 'vi' ? 'Lỗi máy chủ khi đăng nhập' : 'Server error during login'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <Card className="w-full max-w-sm p-6 sm:p-7 bg-white shadow-2xl border-theme rounded-2xl space-y-5 relative">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 mx-auto rounded-2xl btn-theme-gradient flex items-center justify-center shadow-md">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-theme-main tracking-tight">
            {lang === 'vi' ? 'Đăng nhập DayFlow' : 'Sign in to DayFlow'}
          </h2>
          <p className="text-xs text-zinc-500">
            {lang === 'vi'
              ? 'Nhập tên người dùng và mật khẩu để tiếp tục'
              : 'Enter your username and password to proceed'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-theme-accent" />
              <span>{lang === 'vi' ? 'Tên đăng nhập' : 'Username'}</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={lang === 'vi' ? 'VD: nana' : 'E.g., nana'}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-theme rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-theme-accent/40 font-mono transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-theme-accent" />
              <span>{lang === 'vi' ? 'Mật khẩu' : 'Password'}</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123456"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-theme rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-theme-accent/40 font-mono transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg btn-theme-gradient text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{lang === 'vi' ? 'Đăng nhập' : 'Sign in'}</span>
              </>
            )}
          </button>
        </form>
      </Card>
    </div>
  )
}
