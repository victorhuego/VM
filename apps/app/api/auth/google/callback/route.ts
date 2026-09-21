import { NextRequest, NextResponse } from 'next/server'
import { createOAuth2Client } from '@/lib/google/client'
import { saveOAuthTokenToSheet } from '@/lib/google/sheets'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const origin = req.nextUrl.origin

  if (error) {
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.json({ error: 'Mã xác thực code bị thiếu' }, { status: 400 })
  }

  try {
    const callbackUrl = `${origin}/api/auth/google/callback`
    const oauth2Client = createOAuth2Client(callbackUrl)

    const { tokens } = await oauth2Client.getToken(code)

    if (tokens.refresh_token) {
      // Save refresh token directly into Google Sheets AuthTokens tab
      await saveOAuthTokenToSheet({
        service: 'google_drive',
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token || undefined,
        expiryDate: tokens.expiry_date || undefined,
      })
    } else {
      console.warn('Google did not return a new refresh token (already authorized).')
    }

    return NextResponse.redirect(`${origin}/?auth=success`)
  } catch (err: any) {
    console.error('Lỗi khi xử lý OAuth callback:', err)
    return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(err?.message || 'OAuth error')}`)
  }
}
