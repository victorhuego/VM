import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { getExpenses, addExpense } from '@/lib/google/sheets'
import { ExpenseItem } from '@/lib/types'

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
    const expenses = await getExpenses()
    return NextResponse.json({ data: expenses, source: 'google_sheets' })
  } catch (err: any) {
    console.error('Lỗi khi đọc danh sách chi tiêu từ Sheets:', err)
    return NextResponse.json(
      { error: err?.message || 'Không thể đọc dữ liệu chi tiêu từ Google Sheets' },
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
    const body: ExpenseItem = await req.json()

    if (!body.id) {
      body.id = `exp-${Date.now()}`
    }
    if (!body.date) {
      body.date = new Date().toISOString().split('T')[0]
    }

    if (body.image) {
      const { normalizeImagePayload } = await import('@/lib/image-storage')
      body.image = await normalizeImagePayload(body.image)
    }

    const saved = await addExpense(body)
    return NextResponse.json({ success: true, data: saved }, { status: 201 })
  } catch (err: any) {
    console.error('Lỗi khi thêm giao dịch vào Sheets:', err)
    return NextResponse.json(
      { error: err?.message || 'Không thể ghi giao dịch vào Google Sheets' },
      { status: 500 }
    )
  }
}
