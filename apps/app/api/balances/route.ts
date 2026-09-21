import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { getBalancesData, updateBalancesData } from '@/lib/google/sheets'

export async function GET(req: NextRequest) {
  const config = getGoogleConfigStatus()
  if (!config.isConfigured) {
    return NextResponse.json(
      {
        initialBalances: { cash: 0, bankAccount: 0, savings: 0 },
        monthlyBudget: 0,
        savingsGoal: 0,
        source: 'not_configured',
      },
      { status: 200 }
    )
  }

  if (req.nextUrl.searchParams.get('refresh') === 'true') {
    const { clearSheetCache } = await import('@/lib/google/sheets')
    clearSheetCache()
  }

  try {
    const data = await getBalancesData()
    return NextResponse.json({ ...data, source: 'google_sheets' })
  } catch (err: any) {
    console.error('Lỗi khi đọc balances từ Sheets:', err)
    return NextResponse.json(
      { error: err?.message || 'Không thể đọc dữ liệu số dư từ Google Sheets' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const config = getGoogleConfigStatus()
  if (!config.isConfigured) {
    return NextResponse.json(
      { error: 'Google Services chưa được cấu hình. Dữ liệu chỉ được lưu tạm trên giao diện.' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const updated = await updateBalancesData(body)
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    console.error('Lỗi khi cập nhật balances vào Sheets:', err)
    return NextResponse.json(
      { error: err?.message || 'Không thể cập nhật số dư vào Google Sheets' },
      { status: 500 }
    )
  }
}
