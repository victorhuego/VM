import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { updateDebt, deleteDebt } from '@/lib/google/sheets'

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
    const updated = await updateDebt(id, body)
    if (!updated) {
      return NextResponse.json(
        { error: `Không tìm thấy khoản nợ có id ${id}` },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error(`Lỗi khi sửa khoản nợ ${id}:`, err)
    return NextResponse.json(
      { error: err?.message || 'Không thể cập nhật khoản nợ' },
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
    const success = await deleteDebt(id)
    if (!success) {
      return NextResponse.json(
        { error: `Không tìm thấy hoặc không thể xóa khoản nợ ${id}` },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error(`Lỗi khi xóa khoản nợ ${id}:`, err)
    return NextResponse.json(
      { error: err?.message || 'Không thể xóa khoản nợ' },
      { status: 500 }
    )
  }
}
