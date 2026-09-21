import { NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { initSpreadsheet } from '@/lib/google/sheets'
import { testDriveAccess } from '@/lib/google/drive'

export async function POST() {
  const configStatus = getGoogleConfigStatus()

  if (!configStatus.isConfigured) {
    return NextResponse.json(
      {
        success: false,
        error: configStatus.error || 'Google Service Account chưa được cấu hình',
        config: configStatus,
      },
      { status: 400 }
    )
  }

  try {
    const sheetsResult = await initSpreadsheet()
    const driveCheck = await testDriveAccess()

    return NextResponse.json({
      success: true,
      message: 'Khởi tạo Google Sheets và kiểm tra Drive thành công!',
      sheets: sheetsResult,
      drive: driveCheck,
    })
  } catch (err: any) {
    console.error('Lỗi khi khởi tạo Google Sheets/Drive:', err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Có lỗi xảy ra khi khởi tạo Google Sheets/Drive',
      },
      { status: 500 }
    )
  }
}
