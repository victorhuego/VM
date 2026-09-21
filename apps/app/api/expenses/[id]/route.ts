import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { updateExpense, deleteExpense } from '@/lib/google/sheets'

export async function PUT(
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
    const body = await req.json()
    if (body.image) {
      const { normalizeImagePayload } = await import('@/lib/image-storage')
      body.image = await normalizeImagePayload(body.image)
    }
    const updated = await updateExpense(id, body)
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy giao dịch có id ${id}` },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error(`Lỗi khi sửa giao dịch ${id}:`, err)
    return NextResponse.json(
      { error: err?.message || 'Không thể cập nhật giao dịch' },
      { status: 500 }
    )
  }
}

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
    const success = await deleteExpense(id)
    if (!success) {
      return NextResponse.json(
        { error: `Không tìm thấy hoặc không thể xóa giao dịch ${id}` },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error(`Lỗi khi xóa giao dịch ${id}:`, err)
    return NextResponse.json(
      { error: err?.message || 'Không thể xóa giao dịch' },
      { status: 500 }
    )
  }
}
