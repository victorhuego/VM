import { google } from 'googleapis'
import http from 'http'
import url from 'url'
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { exec } from 'child_process'

const PORT = 3333
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`
const ENV_PATH = path.join(process.cwd(), '.env.local')

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) return {}
  const content = fs.readFileSync(ENV_PATH, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
  }
  return env
}

function updateEnv(newVars) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''
  for (const [k, v] of Object.entries(newVars)) {
    const regex = new RegExp(`^${k}=.*$`, 'm')
    if (regex.test(content)) {
      content = content.replace(regex, `${k}="${v}"`)
    } else {
      content += `\n${k}="${v}"`
    }
  }
  fs.writeFileSync(ENV_PATH, content.trim() + '\n', 'utf8')
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close()
      resolve(ans.trim())
    })
  })
}

async function main() {
  console.log('\n======================================================')
  console.log('   Google Drive OAuth 2.0 Token Helper (VM Personal Finance)')
  console.log('======================================================\n')

  const env = readEnv()
  let clientId = process.argv[2] || env.GOOGLE_OAUTH_CLIENT_ID
  let clientSecret = process.argv[3] || env.GOOGLE_OAUTH_CLIENT_SECRET

  if (!clientId) {
    clientId = await prompt(' Nhập Google OAuth Client ID: ')
  }
  if (!clientSecret) {
    clientSecret = await prompt(' Nhập Google OAuth Client Secret: ')
  }

  if (!clientId || !clientSecret) {
    console.error('\n❌ Lỗi: Bạn cần cung cấp Client ID và Client Secret!')
    process.exit(1)
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI)

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Bắt buộc để luôn trả về refresh_token
    scope: ['https://www.googleapis.com/auth/drive'],
  })

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true)
      if (parsedUrl.pathname === '/oauth2callback') {
        const code = parsedUrl.query.code

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<h3>❌ Không tìm thấy authorization code.</h3>')
          return
        }

        const { tokens } = await oauth2Client.getToken(code)
        const refreshToken = tokens.refresh_token

        if (!refreshToken) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`
            <div style="font-family: sans-serif; padding: 40px; text-align: center;">
              <h2 style="color: #f59e0b;">⚠️ Không nhận được Refresh Token</h2>
              <p>Có thể bạn đã từng cấp quyền trước đó. Vui lòng chạy lại script để cấp quyền lại.</p>
            </div>
          `)
          console.warn('\n⚠️ Không nhận được Refresh Token (đã cấp quyền trước đó).')
          server.close()
          return
        }

        // Lưu vào .env.local
        updateEnv({
          GOOGLE_OAUTH_CLIENT_ID: clientId,
          GOOGLE_OAUTH_CLIENT_SECRET: clientSecret,
          GOOGLE_OAUTH_REFRESH_TOKEN: refreshToken,
        })

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 60px auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
            <h2 style="color: #059669; margin-bottom: 8px;">Kết nối Google Drive thành công!</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Refresh Token đã được tự động lưu vào <code>.env.local</code>.<br/>
              Bây giờ toàn bộ ảnh sẽ được tải trực tiếp lên Google Drive cá nhân của bạn (15GB).
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Bạn có thể đóng tab trình duyệt này.</p>
          </div>
        `)

        console.log('\n✅ CẤP QUYỀN THÀNH CÔNG!')
        console.log(`   Đã lưu GOOGLE_OAUTH_REFRESH_TOKEN vào: ${ENV_PATH}`)
        console.log('   Ứng dụng giờ đây sẽ upload ảnh trực tiếp lên Google Drive cá nhân của bạn!\n')

        setTimeout(() => {
          server.close()
          process.exit(0)
        }, 1500)
      } else {
        res.writeHead(404)
        res.end('Not Found')
      }
    } catch (err) {
      console.error('\n❌ Lỗi khi lấy token:', err?.message || err)
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<h3>❌ Lỗi: ${err?.message}</h3>`)
      server.close()
      process.exit(1)
    }
  })

  server.listen(PORT, () => {
    console.log('1. Đang mở trình duyệt để xác thực tài khoản Google...')
    console.log('   Nếu trình duyệt không tự mở, hãy click vào liên kết bên dưới:\n')
    console.log(`👉 \x1b[36m${authUrl}\x1b[0m\n`)
    console.log('2. Đang chờ bạn đăng nhập và bấm "Cho phép" (Allow)...\n')

    // Tự động mở trình duyệt trên macOS
    exec(`open "${authUrl}"`, (err) => {
      // Ignore err if cannot auto open
    })
  })
}

main().catch(console.error)
