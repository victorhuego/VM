import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/google/sheets'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = String(body.username || '').trim()
    const password = String(body.password || '').trim()

    if (!username) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mật khẩu' },
        { status: 400 }
      )
    }

    const authResult = await authenticateUser(username, password)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Đăng nhập không thành công' },
        { status: 401 }
      )
    }

    const user = authResult.user

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar,
        currency: user.currency || (user.username.toLowerCase() === 'jeandev' ? 'VND' : undefined),
      },
    })
  } catch (err: any) {
    console.error('Lỗi khi xử lý đăng nhập:', err)
    return NextResponse.json(
      { error: err?.message || 'Lỗi máy chủ khi đăng nhập' },
      { status: 500 }
    )
  }
}
