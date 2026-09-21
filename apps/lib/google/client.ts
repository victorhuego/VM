import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
]

export interface GoogleConfigStatus {
  isConfigured: boolean
  hasSpreadsheetId: boolean
  hasDriveFolderId: boolean
  hasCredentials: boolean
  error?: string
}

function resolveKeyPath(keyPath: string): string {
  if (path.isAbsolute(keyPath)) return keyPath
  const filename = path.basename(keyPath)
  return path.join(process.cwd(), 'credentials', filename)
}

export function getGoogleConfigStatus(): GoogleConfigStatus {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  const hasSpreadsheetId = Boolean(spreadsheetId && spreadsheetId !== 'your_google_spreadsheet_id_here')
  const hasDriveFolderId = Boolean(driveFolderId && driveFolderId !== 'your_google_drive_folder_id_here')

  let hasCredentials = false
  if (keyPath) {
    const resolvedPath = resolveKeyPath(keyPath)
    if (fs.existsSync(/* turbopackIgnore: true */ resolvedPath)) {
      hasCredentials = true
    }
  }

  if (!hasCredentials && clientEmail && privateKey) {
    hasCredentials = true
  }

  if (!hasSpreadsheetId) {
    return {
      isConfigured: false,
      hasSpreadsheetId,
      hasDriveFolderId,
      hasCredentials,
      error: 'Chưa cấu hình GOOGLE_SPREADSHEET_ID trong .env.local',
    }
  }

  if (!hasDriveFolderId) {
    return {
      isConfigured: false,
      hasSpreadsheetId,
      hasDriveFolderId,
      hasCredentials,
      error: 'Chưa cấu hình GOOGLE_DRIVE_FOLDER_ID trong .env.local',
    }
  }

  if (!hasCredentials) {
    return {
      isConfigured: false,
      hasSpreadsheetId,
      hasDriveFolderId,
      hasCredentials,
      error: 'Chưa cấu hình Service Account Credentials (file JSON hoặc EMAIL/KEY)',
    }
  }

  return {
    isConfigured: true,
    hasSpreadsheetId,
    hasDriveFolderId,
    hasCredentials,
  }
}

let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null

export function getGoogleAuthClient() {
  if (cachedAuth) return cachedAuth

  const status = getGoogleConfigStatus()
  if (!status.isConfigured) {
    throw new Error(status.error || 'Google Service Account chưa được cấu hình')
  }

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY

  if (keyPath) {
    const resolvedPath = resolveKeyPath(keyPath)
    if (fs.existsSync(/* turbopackIgnore: true */ resolvedPath)) {
      const keyFile = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ resolvedPath, 'utf-8'))
      cachedAuth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: SCOPES,
      })
      return cachedAuth
    }
  }

  if (clientEmail && rawPrivateKey) {
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n')
    cachedAuth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES,
    })
    return cachedAuth
  }

  throw new Error('Không tìm thấy thông tin Service Account hợp lệ')
}

let cachedDriveOAuth: InstanceType<typeof google.auth.OAuth2> | null = null

export function createOAuth2Client(redirectUri?: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export async function getGoogleDriveAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

  if (clientId && clientSecret) {
    // 1. Try reading token from Google Sheets AuthTokens tab
    const { getOAuthTokenFromSheet, saveOAuthTokenToSheet } = await import('./sheets')
    const sheetToken = await getOAuthTokenFromSheet('google_drive')
    const refreshToken = sheetToken?.refreshToken || process.env.GOOGLE_OAUTH_REFRESH_TOKEN

    if (refreshToken) {
      if (!cachedDriveOAuth) {
        cachedDriveOAuth = createOAuth2Client()
        cachedDriveOAuth.setCredentials({
          refresh_token: refreshToken,
          access_token: sheetToken?.accessToken,
          expiry_date: sheetToken?.expiryDate,
        })

        // Auto-save refreshed tokens back to Google Sheets whenever Google rotates them
        cachedDriveOAuth.on('tokens', async (tokens) => {
          try {
            if (tokens.refresh_token || tokens.access_token) {
              await saveOAuthTokenToSheet({
                service: 'google_drive',
                refreshToken: tokens.refresh_token || refreshToken,
                accessToken: tokens.access_token || undefined,
                expiryDate: tokens.expiry_date || undefined,
              })
            }
          } catch (err) {
            console.error('Lỗi khi tự động lưu token mới vào Google Sheets:', err)
          }
        })
      }
      return cachedDriveOAuth
    }
  }

  // Fallback to Service Account
  return getGoogleAuthClient()
}

export function getGoogleSheets() {
  const auth = getGoogleAuthClient()
  return google.sheets({ version: 'v4', auth })
}

export async function getGoogleDrive() {
  const auth = await getGoogleDriveAuth()
  return google.drive({ version: 'v3', auth })
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID
  if (!id || id === 'your_google_spreadsheet_id_here') {
    throw new Error('GOOGLE_SPREADSHEET_ID chưa được định cấu hình trong .env.local')
  }
  return id
}

export function getDriveFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!id || id === 'your_google_drive_folder_id_here') {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID chưa được định cấu hình trong .env.local')
  }
  return id
}
