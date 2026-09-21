import { NextRequest, NextResponse } from 'next/server'
import { getGoogleConfigStatus } from '@/lib/google/client'
import { uploadImageToDrive } from '@/lib/google/drive'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]

export async function POST(req: NextRequest) {
  const config = getGoogleConfigStatus()
  if (!config.isConfigured) {
    return NextResponse.json(
      {
        error: 'Google Drive chưa được cấu hình. Vui lòng cấu hình GOOGLE_DRIVE_FOLDER_ID và Service Account trong .env.local',
      },
      { status: 503 }
    )
  }

  let file: File | null = null
  let buffer: Buffer | null = null

  try {
    const formData = await req.formData()
    file = formData.get('file') as File | null
    const customFilename = (formData.get('filename') as string | null)?.trim()

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file tải lên' }, { status: 400 })
    }

    const uploadFilename = customFilename || file.name || 'image.jpg'

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Kích thước file vượt quá giới hạn cho phép (Tối đa 10MB)' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Định dạng file không được hỗ trợ. Vui lòng tải file ảnh (JPEG, PNG, WebP).' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    buffer = Buffer.from(arrayBuffer)

    // Try Google Drive upload first
    try {
      const result = await uploadImageToDrive(buffer, uploadFilename, file.type || 'image/jpeg')
      return NextResponse.json({
        success: true,
        fileId: result.fileId,
        url: result.url,
        name: result.name,
      })
    } catch (driveErr: any) {
      console.warn('Google Drive notice (fallback to local server storage):', driveErr?.message)

      // Save locally to public/uploads so the URL is short and safe for Google Sheets
      const { saveLocalImage } = await import('@/lib/image-storage')
      const localUrl = await saveLocalImage(buffer, uploadFilename, file.type || 'image/jpeg')

      return NextResponse.json({
        success: true,
        fileId: `local-${Date.now()}`,
        url: localUrl,
        name: uploadFilename,
        isLocalFallback: true,
      })
    }
  } catch (err: any) {
    console.error('Lỗi khi tải file ảnh lên:', err)
    return NextResponse.json(
      { error: err?.message || 'Có lỗi xảy ra khi tải ảnh lên' },
      { status: 500 }
    )
  }
}
