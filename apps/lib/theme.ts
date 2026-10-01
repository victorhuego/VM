import { ThemeType } from './types'

export interface ThemeColorConfig {
  topColor: string
  rootBg: string
  statusBarStyle: 'default' | 'black-translucent' | 'black'
}

export const themeTopBarConfig: Record<ThemeType, ThemeColorConfig> = {
  classic: {
    topColor: '#FFFFFF',
    rootBg: '#FFFFFF',
    statusBarStyle: 'default',
  },
  cozy: {
    topColor: '#FAF5ED',
    rootBg: '#FAF5ED',
    statusBarStyle: 'default',
  },
  fantasy: {
    topColor: '#0D121D',
    rootBg: '#0D121D',
    statusBarStyle: 'black',
  },
  retro: {
    topColor: '#C0C0C0',
    rootBg: '#008080',
    statusBarStyle: 'default',
  },
  ronin: {
    topColor: '#07090C',
    rootBg: '#07090C',
    statusBarStyle: 'black',
  },
}

/**
 * Dynamically synchronizes documentElement, body, meta theme-color, and apple-mobile-web-app status bar.
 * This guarantees the status bar / notch / overscroll on iOS Safari, Android Chrome, and PWAs
 * always matches the active theme seamlessly without retaining stale values.
 */
export function applyTheme(theme: ThemeType) {
  if (typeof document === 'undefined') return

  const config = themeTopBarConfig[theme] || themeTopBarConfig.classic
  const isDark = theme === 'fantasy' || theme === 'ronin'

  // 1. Set theme data-theme attribute on <html>
  document.documentElement.setAttribute('data-theme', theme)

  // 2. Set colorScheme for OS status bar icons (black icons for light, white icons for dark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  if (document.body) {
    document.body.style.colorScheme = isDark ? 'dark' : 'light'
  }

  // 3. Set root element background color for mobile bounce & browser frame
  document.documentElement.style.backgroundColor = config.rootBg
  if (document.body) {
    document.body.style.backgroundColor = config.rootBg
  }

  // 4. Update meta[name="theme-color"]
  // Remove all existing theme-color tags to force browser / WebKit engine to re-sample
  const existingMetaThemeColors = document.querySelectorAll('meta[name="theme-color"]')
  existingMetaThemeColors.forEach((m) => m.remove())

  // Fresh primary theme-color
  const metaTheme = document.createElement('meta')
  metaTheme.setAttribute('name', 'theme-color')
  metaTheme.setAttribute('content', config.topColor)
  document.head.appendChild(metaTheme)

  // Explicit media query tags so mobile Safari & Chrome dark/light mode switches never get out of sync
  const metaLight = document.createElement('meta')
  metaLight.setAttribute('name', 'theme-color')
  metaLight.setAttribute('media', '(prefers-color-scheme: light)')
  metaLight.setAttribute('content', config.topColor)
  document.head.appendChild(metaLight)

  const metaDark = document.createElement('meta')
  metaDark.setAttribute('name', 'theme-color')
  metaDark.setAttribute('media', '(prefers-color-scheme: dark)')
  metaDark.setAttribute('content', config.topColor)
  document.head.appendChild(metaDark)

  // 5. Update apple-mobile-web-app-status-bar-style for iOS PWA
  let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null
  if (!metaApple) {
    metaApple = document.createElement('meta')
    metaApple.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
    document.head.appendChild(metaApple)
  }
  metaApple.setAttribute('content', config.statusBarStyle)
}
