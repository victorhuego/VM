import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Quicksand, Cinzel, Be_Vietnam_Pro, Chakra_Petch } from 'next/font/google'
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
  weight: ['400', '500', '600', '700', '800'],
})

const chakraPetch = Chakra_Petch({
  variable: '--font-ronin',
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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
      className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} ${cinzel.variable} ${beVietnamPro.variable} ${chakraPetch.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('app_theme');
                  var validThemes = ['classic', 'cozy', 'fantasy', 'retro', 'ronin'];
                  var theme = validThemes.indexOf(saved) !== -1 ? saved : 'classic';
                  document.documentElement.setAttribute('data-theme', theme);
                  var isDark = theme === 'fantasy' || theme === 'ronin';
                  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                  var topColors = {
                    classic: '#FFFFFF',
                    cozy: '#FAF5ED',
                    fantasy: '#0D121D',
                    retro: '#C0C0C0',
                    ronin: '#07090C'
                  };
                  var rootColors = {
                    classic: '#FFFFFF',
                    cozy: '#FAF5ED',
                    fantasy: '#0D121D',
                    retro: '#008080',
                    ronin: '#07090C'
                  };
                  var topColor = topColors[theme] || '#FFFFFF';
                  var rootColor = rootColors[theme] || '#FFFFFF';
                  document.documentElement.style.backgroundColor = rootColor;
                  var metas = document.querySelectorAll('meta[name="theme-color"]');
                  metas.forEach(function(m) { m.remove(); });
                  var meta = document.createElement('meta');
                  meta.name = 'theme-color';
                  meta.content = topColor;
                  document.head.appendChild(meta);
                  var metaL = document.createElement('meta');
                  metaL.name = 'theme-color';
                  metaL.media = '(prefers-color-scheme: light)';
                  metaL.content = topColor;
                  document.head.appendChild(metaL);
                  var metaD = document.createElement('meta');
                  metaD.name = 'theme-color';
                  metaD.media = '(prefers-color-scheme: dark)';
                  metaD.content = topColor;
                  document.head.appendChild(metaD);
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
