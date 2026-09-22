import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { getMoments, addMoment } from '@/lib/google/sheets'
import { MomentItem } from '@/lib/types'

export async function GET(req: NextRequest) {
  const config = getGoogleConfigStatus()
  if (!config.isConfigured) {
    return NextResponse.json(
      {
        data: [],
        source: 'not_configured',
        message: 'Google Sheets chưa được kết nối',
      },
      { status: 200 }
    )
  }

  if (req.nextUrl.searchParams.get('refresh') === 'true') {
    const { clearSheetCache } = await import('@/lib/google/sheets')
    clearSheetCache()
  }

  try {
    const moments = await getMoments()
    return NextResponse.json({ data: moments, source: 'google_sheets' })
  } catch (err: any) {
    console.error('Lỗi khi đọc danh sách khoảnh khắc từ Sheets:', err)
    return NextResponse.json(
      { error: err?.message || 'Không thể đọc dữ liệu khoảnh khắc từ Google Sheets' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const config = getGoogleConfigStatus()
  if (!config.isConfigured) {
    return NextResponse.json(
      { error: 'Google Services chưa được cấu hình. Dữ liệu chưa thể đồng bộ lên Google Sheets.' },
      { status: 503 }
    )
  }

  try {
    const body: MomentItem & { driveFileId?: string } = await req.json()

    if (!body.id) {
      body.id = `mom-${Date.now()}`
    }

    if (body.image) {
      const { normalizeImagePayload } = await import('@/lib/image-storage')
      body.image = await normalizeImagePayload(body.image)

      if (!body.driveName || !/#?img_\d+/i.test(body.driveName)) {
        const { getNextMomentImageTag } = await import('@/lib/moment-utils')
        const existing = await getMoments()
        const { driveName } = getNextMomentImageTag(existing)
        body.driveName = driveName
      }
    }

    const saved = await addMoment(body, body.user || 'jeandev')
    return NextResponse.json({ success: true, data: saved }, { status: 201 })
  } catch (err: any) {
    console.error('Lỗi khi thêm khoảnh khắc vào Sheets:', err)
    return NextResponse.json(
      { error: err?.message || 'Không thể ghi khoảnh khắc vào Google Sheets' },
      { status: 500 }
    )
  }
}
