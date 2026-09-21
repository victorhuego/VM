import { Readable } from 'stream'
import { getGoogleDrive, getDriveFolderId } from './client'

export interface UploadResult {
  fileId: string
  url: string
  name: string
}

/**
 * Upload an image buffer to the designated Google Drive folder
 * and set public read permissions so it can be viewed in the app.
 */
export async function uploadImageToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/jpeg'
): Promise<UploadResult> {
  const drive = await getGoogleDrive()
  const folderId = getDriveFolderId()

  // Clean filename: if already formatted with moment convention (#img_XX or receipt_XX), preserve it cleanly without random timestamp prefix
  const isPreformatted = /^#?img_\d+/i.test(filename) || /^receipt_/i.test(filename)
  const safeName = isPreformatted
    ? filename.replace(/[^a-zA-Z0-9.#_-]/g, '_')
    : `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.#_-]/g, '_')}`

  const stream = Readable.from(buffer)

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: safeName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, webContentLink, webViewLink',
  })

  const fileId = res.data.id
  if (!fileId) {
    throw new Error('Google Drive API không trả về fileId sau khi tải lên')
  }

  // Grant public read permission: anyone with link can view
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })
  } catch (err) {
    console.warn('Cảnh báo khi gán quyền xem công khai file Google Drive:', err)
  }

  // Google Drive high-resolution thumbnail direct URL
  const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`

  return {
    fileId,
    url: directUrl,
    name: safeName,
  }
}

/**
 * Delete an image file from Google Drive
 */
export async function deleteFileFromDrive(fileId: string): Promise<boolean> {
  try {
    const drive = await getGoogleDrive()
    await drive.files.delete({ fileId })
    return true
  } catch (err) {
    console.error(`Lỗi khi xóa file ${fileId} trên Google Drive:`, err)
    return false
  }
}

/**
 * Test write/read access to the designated Google Drive folder
 */
export async function testDriveAccess(): Promise<{ ok: boolean; folderName?: string; error?: string }> {
  try {
    const drive = await getGoogleDrive()
    const folderId = getDriveFolderId()

    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, capabilities',
    })

    return {
      ok: true,
      folderName: res.data.name || 'Unknown',
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Không thể truy cập Google Drive Folder',
    }
  }
}
