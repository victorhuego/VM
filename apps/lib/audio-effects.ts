import { ThemeType } from './types'

/**
 * Web Audio API Synthesizer Engine with Full Theme Adaptation
 * Tự động biến đổi âm sắc theo theme:
 * - retro: 8-bit chiptune (square wave) chuẩn Windows 95 / arcade
 * - ronin: Cyber samurai synth (sawtooth + deep bass + katana resonance)
 * - fantasy: Ethereal harp & crystal chime (Genshin Mora / celestial)
 * - cozy: Kalimba & warm bubble pop (cute boba cafe)
 * - classic: Clean studio chime & modern sleek card swipe
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

function getActiveTheme(): ThemeType {
  if (typeof document === 'undefined') return 'classic'
  const attr = document.documentElement.getAttribute('data-theme') as ThemeType
  if (attr) return attr
  try {
    const saved = localStorage.getItem('app_theme') as ThemeType
    if (saved) return saved
  } catch {}
  return 'classic'
}

/**
 * 1. ÂM THANH THU NHẬP (Income / Tiền về ví / Ting ting 💰)
 */
export function playIncomeSound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    // 8-bit Chiptune Arpeggio (Mario coin / Win95 arcade)
    const notes = [987.77, 1318.51] // B5, E6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.09
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.12, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.3)
    })
    return
  }

  if (theme === 'ronin') {
    // Cyber Neon Slash Chime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15)
    gain.gain.setValueAtTime(0.14, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.5)
    return
  }

  if (theme === 'fantasy') {
    // Ethereal Harp Arpeggio (Genshin Mora Pick up)
    const notes = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.05
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.16, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.85)
    })
    return
  }

  if (theme === 'cozy') {
    // Cute Kalimba Chime
    const notes = [1046.5, 1318.5, 1567.98]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.09
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.18, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.45)
    })
    return
  }

  // Classic: Ting ting chuông vàng tài lộc
  const notes = [1318.5, 1661.2, 1975.5, 2637.0]
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = now + idx * 0.08
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.65)
  })
}

/**
 * 2. ÂM THANH CHI TIÊU (Expense / Quẹt thẻ & Tiền bay 💸)
 */
export function playExpenseSound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    // 8-bit Downward step (Win95 pop)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(523.25, now)
    osc.frequency.setValueAtTime(392.0, now + 0.1)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
    return
  }

  if (theme === 'ronin') {
    // Katana blade cut whoosh
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2)
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.25)
    return
  }

  if (theme === 'fantasy') {
    // Celestial spending chime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(659.25, now)
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.35)
    gain.gain.setValueAtTime(0.14, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.4)
    return
  }

  if (theme === 'cozy') {
    // Cute bubble pop
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08)
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.15)
    return
  }

  // Classic: Card swipe swoosh + confirmation
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'triangle'
  osc1.frequency.setValueAtTime(440, now)
  osc1.frequency.exponentialRampToValueAtTime(220, now + 0.25)
  gain1.gain.setValueAtTime(0.12, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.26)

  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  const t2 = now + 0.12
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(659.25, t2)
  osc2.frequency.setValueAtTime(880, t2 + 0.08)
  gain2.gain.setValueAtTime(0, t2)
  gain2.gain.linearRampToValueAtTime(0.15, t2 + 0.02)
  gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.45)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(t2)
  osc2.stop(t2 + 0.5)
}

/**
 * 3. ÂM THANH RÚT TIỀN MẶT ATM (ATM Cash Dispense 💵)
 */
export function playAtmCashSound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    // 8-bit print/beep
    ;[0, 0.1, 0.2].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + offset
      osc.type = 'square'
      osc.frequency.setValueAtTime(440, t)
      gain.gain.setValueAtTime(0.1, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.07)
    })
    return
  }

  // 3 nhịp xòe tiền xẹt... xẹt... xẹt...
  ;[0, 0.12, 0.24].forEach((offset) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = now + offset
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.linearRampToValueAtTime(320, t + 0.06)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.09, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  })

  // Beep ATM
  const beepOsc = ctx.createOscillator()
  const beepGain = ctx.createGain()
  const beepTime = now + 0.38
  beepOsc.type = 'sine'
  beepOsc.frequency.setValueAtTime(1760, beepTime)
  beepGain.gain.setValueAtTime(0, beepTime)
  beepGain.gain.linearRampToValueAtTime(0.12, beepTime + 0.01)
  beepGain.gain.exponentialRampToValueAtTime(0.0001, beepTime + 0.35)
  beepOsc.connect(beepGain)
  beepGain.connect(ctx.destination)
  beepOsc.start(beepTime)
  beepOsc.stop(beepTime + 0.4)
}

/**
 * 4. ÂM THANH MỞ KHÓA TIẾT KIỆM (Vault Unlock 🔓)
 */
export function playVaultUnlockSound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(800, now)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.22)
    return
  }

  // Mechanical click & open
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'square'
  osc1.frequency.setValueAtTime(450, now)
  osc1.frequency.exponentialRampToValueAtTime(800, now + 0.08)
  gain1.gain.setValueAtTime(0.12, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(now)
  osc1.stop(now + 0.11)

  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  const t2 = now + 0.15
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(523.25, t2)
  osc2.frequency.setValueAtTime(783.99, t2 + 0.1)
  osc2.frequency.setValueAtTime(1046.5, t2 + 0.2)
  gain2.gain.setValueAtTime(0, t2)
  gain2.gain.linearRampToValueAtTime(0.16, t2 + 0.02)
  gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.6)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(t2)
  osc2.stop(t2 + 0.65)
}

/**
 * 5. ÂM THANH BỎ ỐNG HEO / GỬI TIẾT KIỆM (Coin Drop Clink 🪙)
 */
export function playCoinDropSound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    ;[0, 0.12].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + offset
      osc.type = 'square'
      osc.frequency.setValueAtTime(1500, t)
      gain.gain.setValueAtTime(0.12, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.18)
    })
    return
  }

  ;[0, 0.16, 0.32].forEach((offset, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = now + offset
    const freq = 2093 + idx * 300
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.15)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.35)
  })
}

/**
 * 6. ÂM THANH CHUYỂN TIỀN (Transfer ⚡)
 */
/**
 * 6. ÂM THANH CHUYỂN TIỀN (Transfer ⚡)
 */
export function playTransferSound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    // 8-bit fast arpeggio
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(392.0, now)
    osc.frequency.setValueAtTime(587.33, now + 0.08)
    osc.frequency.setValueAtTime(783.99, now + 0.16)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.38)
    return
  }

  if (theme === 'ronin') {
    // Cyber whoosh
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25)
    gain.gain.setValueAtTime(0.14, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.32)
    return
  }

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(350, now)
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.28)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.14, now + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.45)
}

/**
 * 7. ÂM THANH TRẢ NỢ (Debt Repay / Nhẹ nhõm 🕊️)
 */
export function playDebtPaySound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    ;[523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.08
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.1, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.35)
    })
    return
  }

  if (theme === 'ronin') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(146.83, now)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.85)
    return
  }

  const chord = [698.46, 880.0, 1046.5]
  chord.forEach((freq) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.1, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.75)
  })
}

/**
 * 8. ÂM THANH THU NỢ (Debt Collect / Thu hồi công nợ 🧲)
 */
export function playDebtCollectSound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    ;[659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const t = now + idx * 0.07
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.11, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.3)
    })
    return
  }

  const notes = [1046.5, 1318.5, 1567.98]
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = now + idx * 0.09
    osc.type = theme === 'cozy' ? 'sine' : 'triangle'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.16, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}

/**
 * 9. ÂM THANH KIỂM KÊ CÂN ĐỐI (Reconcile ⚖️)
 */
export function playReconcileSound(themeOverride?: ThemeType) {
  const ctx = getAudioContext()
  if (!ctx) return
  const theme = themeOverride || getActiveTheme()
  const now = ctx.currentTime

  if (theme === 'retro') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.setValueAtTime(1174.66, now + 0.09)
    gain.gain.setValueAtTime(0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.32)
    return
  }

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.setValueAtTime(1174.66, now + 0.1)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.14, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.55)
}
