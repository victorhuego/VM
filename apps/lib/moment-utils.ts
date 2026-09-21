import { MomentItem } from '@/lib/types'

/**
 * Computes the next sequential moment image tag and filename
 * following the project convention: #img_01, #img_02, #img_03, etc.
 */
export function getNextMomentImageTag(moments: MomentItem[] = []): {
  tag: string
  driveName: string
  getFilename: (ext?: string) => string
} {
  let maxIndex = 0

  for (const m of moments) {
    if (m.driveName) {
      const match = m.driveName.match(/#?img_(\d+)/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxIndex) maxIndex = num
      }
    }
    if (m.image) {
      const match = m.image.match(/#?img_(\d+)/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxIndex) maxIndex = num
      }
    }
  }

  const nextNum = maxIndex + 1
  const tag = `#img_${String(nextNum).padStart(2, '0')}`
  const driveName = `Google Drive: ${tag}`

  return {
    tag,
    driveName,
    getFilename: (ext: string = 'jpg') => {
      const cleanExt = ext.replace(/^\./, '').toLowerCase() || 'jpg'
      return `${tag}.${cleanExt}`
    },
  }
}
