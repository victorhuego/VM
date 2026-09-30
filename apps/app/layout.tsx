import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Quicksand, Cinzel, Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const quicksand = Quicksand({
  variable: '--font-cozy',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
})

const cinzel = Cinzel({
  variable: '--font-fantasy-serif',
  subsets: ['latin'],
})

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-fantasy-sans',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
}

export const metadata: Metadata = {
  title: 'DayFlow | Personal Rhythm & Finance',
  description: 'DayFlow: Quản lý tài chính & Lưu giữ khoảnh khắc theo nhịp sinh học',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DayFlow',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="vi"
      data-theme="classic"
      className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} ${cinzel.variable} ${beVietnamPro.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('app_theme');
                  var validThemes = ['classic', 'cozy', 'fantasy', 'retro'];
                  var theme = validThemes.indexOf(saved) !== -1 ? saved : 'classic';
                  document.documentElement.setAttribute('data-theme', theme);
                  var topColors = {
                    classic: '#FFFFFF',
                    cozy: '#FAF5ED',
                    fantasy: '#0D131F',
                    retro: '#C0C0C0'
                  };
                  var rootColors = {
                    classic: '#FFFFFF',
                    cozy: '#FAF5ED',
                    fantasy: '#0D131F',
                    retro: '#008080'
                  };
                  var topColor = topColors[theme] || '#FFFFFF';
                  var rootColor = rootColors[theme] || '#FFFFFF';
                  document.documentElement.style.backgroundColor = rootColor;
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) {
                    meta.setAttribute('content', topColor);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
