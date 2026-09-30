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
    topColor: '#0D131F',
    rootBg: '#0D131F',
    statusBarStyle: 'black',
  },
  retro: {
    topColor: '#C0C0C0',
    rootBg: '#008080',
    statusBarStyle: 'default',
  },
}

/**
 * Dynamically synchronizes documentElement, body, meta theme-color, and apple-mobile-web-app status bar.
 * This guarantees the status bar / notch / overscroll on iOS Safari, Android Chrome, and PWAs
 * always matches the active theme seamlessly.
 */
export function applyTheme(theme: ThemeType) {
  if (typeof document === 'undefined') return

  const config = themeTopBarConfig[theme] || themeTopBarConfig.classic

  // 1. Set theme data-theme attribute on <html>
  document.documentElement.setAttribute('data-theme', theme)

  // 2. Set root element background color for mobile bounce & browser frame
  document.documentElement.style.backgroundColor = config.rootBg
  if (document.body) {
    document.body.style.backgroundColor = config.rootBg
  }

  // 3. Update meta[name="theme-color"]
  const existingMetaThemeColors = document.querySelectorAll('meta[name="theme-color"]')
  if (existingMetaThemeColors.length > 1) {
    existingMetaThemeColors.forEach((m, idx) => {
      if (idx > 0) m.remove()
    })
  }

  let metaTheme = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (!metaTheme) {
    metaTheme = document.createElement('meta')
    metaTheme.setAttribute('name', 'theme-color')
    document.head.appendChild(metaTheme)
  }
  metaTheme.removeAttribute('media')
  metaTheme.setAttribute('content', config.topColor)

  // Re-insert or clone to guarantee WebKit / Safari triggers Page::themeColorChanged immediately
  try {
    const freshMeta = metaTheme.cloneNode(true) as HTMLMetaElement
    freshMeta.setAttribute('content', config.topColor)
    metaTheme.parentNode?.replaceChild(freshMeta, metaTheme)
  } catch {
    // fallback if replaceChild fails
  }

  // 4. Update apple-mobile-web-app-status-bar-style for iOS
  let metaApple = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement | null
  if (!metaApple) {
    metaApple = document.createElement('meta')
    metaApple.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
    document.head.appendChild(metaApple)
  }
  metaApple.setAttribute('content', config.statusBarStyle)
}
