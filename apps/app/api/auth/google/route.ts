import { NextRequest, NextResponse } from 'next/server'
import { createOAuth2Client } from '@/lib/google/client'

/**
 * Resolve the app origin for OAuth redirect URI.
 * Uses APP_URL env if set (important when accessing via LAN IP but Google Console
 * only has localhost registered), otherwise falls back to request origin.
 */
function getAppOrigin(req: NextRequest): string {
  const envUrl = process.env.APP_URL
  if (envUrl) {
    return envUrl.replace(/\/+$/, '') // trim trailing slash
  }
  return req.nextUrl.origin
}

export async function GET(req: NextRequest) {
  const origin = getAppOrigin(req)
  const callbackUrl = `${origin}/api/auth/google/callback`

  console.log('[Google OAuth] Using redirect URI:', callbackUrl)

  const oauth2Client = createOAuth2Client(callbackUrl)

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive',
  ]

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  })

  if (req.nextUrl.searchParams.get('format') === 'json') {
    return NextResponse.json({ authUrl, callbackUrl })
  }

  return NextResponse.redirect(authUrl)
}
