import fs from 'fs'
import path from 'path'

/**
 * Saves a binary image buffer to public/uploads/ and returns the web-accessible URL.
 */
export async function saveLocalImage(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const rawExt = mimeType.split('/')[1]?.split('+')[0] || 'jpg'
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt
  const isPreformatted = /^#?img_\d+/i.test(filename) || /^receipt_/i.test(filename)

  let safeName: string
  if (isPreformatted) {
    const clean = filename.replace(/[^a-zA-Z0-9.#_-]/g, '_')
    safeName = clean.toLowerCase().endsWith(`.${ext}`) ? clean : `${clean}.${ext}`
  } else {
    const cleanBase = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30) || 'image'
    safeName = `${Date.now()}_${cleanBase}.${ext}`
  }

  const filePath = path.join(uploadsDir, safeName)

  await fs.promises.writeFile(filePath, buffer)
  return `/uploads/${safeName}`
}

/**
 * If image string is a data URL (base64), decode and save it to public/uploads/.
 * If already an HTTP/HTTPS URL or local path, return as is.
 */
export async function normalizeImagePayload(imageStr?: string): Promise<string | undefined> {
  if (!imageStr) return undefined
  if (!imageStr.startsWith('data:image/')) {
    // Already an HTTP or local URL
    return imageStr
  }

  try {
    const matches = imageStr.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
    if (!matches) {
      // Malformed data URL, skip to prevent crashing Google Sheets cell limit
      return undefined
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')

    return await saveLocalImage(buffer, 'upload', mimeType)
  } catch (err) {
    console.warn('Không thể chuyển đổi base64 image sang local file:', err)
    return undefined
  }
}
