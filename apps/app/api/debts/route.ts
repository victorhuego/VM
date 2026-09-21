import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { getDebts, addDebt } from '@/lib/google/sheets'
import { DebtItem } from '@/lib/types'

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
    const debts = await getDebts()
    return NextResponse.json({ data: debts, source: 'google_sheets' })
  } catch (err: any) {
    console.error('Lỗi khi đọc danh sách nợ từ Sheets:', err)
    return NextResponse.json(
      { error: err?.message || 'Không thể đọc dữ liệu nợ từ Google Sheets' },
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
    const body: DebtItem = await req.json()

    if (!body.id) {
      body.id = `debt-${Date.now()}`
    }
    if (!body.date) {
      body.date = new Date().toISOString().split('T')[0]
    }

    const saved = await addDebt(body)
    return NextResponse.json({ success: true, data: saved }, { status: 201 })
  } catch (err: any) {
    console.error('Lỗi khi thêm khoản nợ vào Sheets:', err)
    return NextResponse.json(
      { error: err?.message || 'Không thể ghi khoản nợ vào Google Sheets' },
      { status: 500 }
    )
  }
}
