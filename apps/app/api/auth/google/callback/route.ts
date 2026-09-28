import { NextRequest, NextResponse } from 'next/server'
import { createOAuth2Client, resetDriveOAuthCache } from '@/lib/google/client'
import { saveOAuthTokenToSheet } from '@/lib/google/sheets'

function getAppOrigin(req: NextRequest): string {
  const envUrl = process.env.APP_URL
  if (envUrl) {
    return envUrl.replace(/\/+$/, '')
  }
  return req.nextUrl.origin
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')
  const origin = getAppOrigin(req)

  if (error) {
    return NextResponse.redirect(`${origin}/?drive_auth=error&drive_auth_msg=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?drive_auth=error&drive_auth_msg=${encodeURIComponent('Mã xác thực code bị thiếu')}`)
  }

  try {
    const callbackUrl = `${origin}/api/auth/google/callback`
    const oauth2Client = createOAuth2Client(callbackUrl)

    const { tokens } = await oauth2Client.getToken(code)

    if (tokens.refresh_token) {
      await saveOAuthTokenToSheet({
        service: 'google_drive',
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token || undefined,
        expiryDate: tokens.expiry_date || undefined,
      })
      resetDriveOAuthCache()
    } else {
      console.warn('Google did not return a new refresh token (already authorized).')
      if (tokens.access_token) {
        try {
          await saveOAuthTokenToSheet({
            service: 'google_drive',
            refreshToken: '',
            accessToken: tokens.access_token,
            expiryDate: tokens.expiry_date || undefined,
          })
        } catch {
          // Non-critical
        }
      }
    }

    return NextResponse.redirect(`${origin}/?drive_auth=success`)
  } catch (err: any) {
    console.error('Lỗi khi xử lý OAuth callback:', err)
    return NextResponse.redirect(`${origin}/?drive_auth=error&drive_auth_msg=${encodeURIComponent(err?.message || 'OAuth error')}`)
  }
}
