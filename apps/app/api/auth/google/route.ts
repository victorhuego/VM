import { NextRequest, NextResponse } from 'next/server'
import { createOAuth2Client } from '@/lib/google/client'

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const callbackUrl = `${origin}/api/auth/google/callback`

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
    return NextResponse.json({ authUrl })
  }

  return NextResponse.redirect(authUrl)
}
