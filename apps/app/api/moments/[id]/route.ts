import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { deleteMoment } from '@/lib/google/sheets'
import { deleteFileFromDrive } from '@/lib/google/drive'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const config = getGoogleConfigStatus()
  if (!config.isConfigured) {
    return NextResponse.json(
      { error: 'Google Services chưa được cấu hình' },
      { status: 503 }
    )
  }

  try {
    const driveFileId = req.nextUrl.searchParams.get('driveFileId')
    if (driveFileId) {
      await deleteFileFromDrive(driveFileId)
    }

    const success = await deleteMoment(id)
    if (!success) {
      return NextResponse.json(
        { error: `Không tìm thấy hoặc không thể xóa khoảnh khắc ${id}` },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error(`Lỗi khi xóa khoảnh khắc ${id}:`, err)
    return NextResponse.json(
      { error: err?.message || 'Không thể xóa khoảnh khắc' },
      { status: 500 }
    )
  }
}
