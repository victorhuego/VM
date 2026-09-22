import { NextRequest, NextResponse } from 'next/server'
import { updateUserAvatar } from '@/lib/google/sheets'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = String(body.username || '').trim()
    const avatarUrl = String(body.avatarUrl || '').trim()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (!avatarUrl) {
      return NextResponse.json({ error: 'Avatar URL is required' }, { status: 400 })
    }

    const success = await updateUserAvatar(username, avatarUrl)
    if (!success) {
      return NextResponse.json({ error: 'Failed to update avatar in Google Sheets' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      username,
      avatar: avatarUrl,
    })
  } catch (err: any) {
    console.error('Error updating avatar API:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error while updating avatar' },
      { status: 500 }
    )
  }
}
