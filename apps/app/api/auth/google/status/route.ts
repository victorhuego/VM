import { NextResponse } from 'next/server'
import { checkDriveOAuthStatus } from '@/lib/google/client'

export async function GET() {
  try {
    const status = await checkDriveOAuthStatus()

    return NextResponse.json({
      ...status,
      authUrl: '/api/auth/google',
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        hasOAuthConfig: false,
        hasRefreshToken: false,
        isTokenValid: false,
        needsReauth: false,
        error: err?.message || 'Không thể kiểm tra trạng thái OAuth',
      },
      { status: 500 }
    )
  }
}
