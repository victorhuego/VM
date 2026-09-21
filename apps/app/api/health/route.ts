import { NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { testDriveAccess } from '@/lib/google/drive'
import { getSheetMap } from '@/lib/google/sheets'

export async function GET() {
  const configStatus = getGoogleConfigStatus()

  if (!configStatus.isConfigured) {
    return NextResponse.json(
      {
        status: 'not_configured',
        message: 'Google Services chưa được cấu hình đầy đủ trong .env.local',
        config: configStatus,
      },
      { status: 200 }
    )
  }

  let sheetsOk = false
  let sheetsError: string | undefined
  let existingTabs: string[] = []

  try {
    const map = await getSheetMap()
    sheetsOk = true
    existingTabs = Object.keys(map)
  } catch (err: any) {
    sheetsError = err?.message || 'Không thể kết nối Google Sheets'
  }

  let driveOk = false
  let driveFolder: string | undefined
  let driveError: string | undefined

  try {
    const driveCheck = await testDriveAccess()
    driveOk = driveCheck.ok
    driveFolder = driveCheck.folderName
    driveError = driveCheck.error
  } catch (err: any) {
    driveError = err?.message || 'Không thể kết nối Google Drive'
  }

  const allReady = sheetsOk && driveOk

  return NextResponse.json({
    status: allReady ? 'ok' : 'degraded',
    config: configStatus,
    sheets: {
      connected: sheetsOk,
      tabs: existingTabs,
      error: sheetsError,
    },
    drive: {
      connected: driveOk,
      folderName: driveFolder,
      error: driveError,
    },
  })
}
