import confetti from 'canvas-confetti'
import { TransactionType, TransferDirection, LanguageType, CurrencyType, ThemeType } from './types'
import { emitTransactionAnimation } from '@/components/TransactionAnimationOverlay'
import {
  playIncomeSound,
  playExpenseSound,
  playAtmCashSound,
  playVaultUnlockSound,
  playCoinDropSound,
  playTransferSound,
  playDebtPaySound,
  playDebtCollectSound,
  playReconcileSound,
} from './audio-effects'

export interface TransactionEffectOptions {
  amount?: number
  lang?: LanguageType
  currency?: CurrencyType
  theme?: ThemeType
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

function triggerHaptic(pattern: number[] = [15]) {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate?.(pattern)
    } catch {}
  }
}

/**
 * 1. THU NHẬP (Income / Thu tiền)
 * - Animation: Đài phun pháo hoa vàng kim & ngọc lục bảo + Badge "+$ [số tiền]"
 * - Âm thanh: Ting ting chuông vàng tài lộc (Ka-ching Chime)
 */
export function triggerIncomeEffect(options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([15, 30, 15])
  playIncomeSound(theme)
  emitTransactionAnimation({
    type: 'income',
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })

  // Theme-adaptive confetti celebration
  try {
    let colors = ['#10B981', '#34D399', '#6EE7B7', '#F59E0B', '#FBBF24', '#3B82F6']
    let shapes: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star']

    if (theme === 'retro') {
      // 8-bit Win95 pixel confetti
      colors = ['#008080', '#C0C0C0', '#000080', '#FFFF00', '#FFFFFF', '#000000']
      shapes = ['square']
    } else if (theme === 'ronin') {
      // Katana blood crimson & cyber neon gold
      colors = ['#E52535', '#FF3B4E', '#18181B', '#FAFAFA', '#EAB308']
      shapes = ['square']
    } else if (theme === 'fantasy') {
      // Astral Genshin Mora gold & celestial starlight
      colors = ['#F3D079', '#D3BC8E', '#ECE5D8', '#818CF8', '#F59E0B']
      shapes = ['star', 'circle']
    } else if (theme === 'cozy') {
      // Boba pastel strawberry & matcha
      colors = ['#F472B6', '#FBBF24', '#60A5FA', '#34D399', '#FDE68A', '#F43F5E']
      shapes = ['circle']
    }

    confetti({
      particleCount: theme === 'retro' ? 65 : 55,
      spread: 75,
      origin: { x: 0.5, y: 0.65 },
      colors,
      startVelocity: 44,
      ticks: 240,
      shapes,
    })

    setTimeout(() => {
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { x: 0.5, y: 0.62 },
          colors,
          startVelocity: 35,
          ticks: 200,
          shapes,
        })
      } catch {}
    }, 120)
  } catch {}
}

/**
 * 2. CHI TIÊU (Expense / Chi tiền)
 * - Animation: Gió cuốn tiền bay đi 💸 + Badge "-$ [số tiền]" uốn lượn bay lên
 * - Âm thanh: Quẹt thẻ thanh toán & tiếng gió lướt êm dịu (Card Swipe Swoosh)
 * - KHÔNG DÙNG CONFETTI ĂN MỪNG!
 */
export function triggerExpenseEffect(options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([25])
  playExpenseSound(theme)
  emitTransactionAnimation({
    type: 'expense',
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 3. RÚT TIỀN MẶT (Withdraw Cash / Bank to Cash / ATM)
 * - Animation: Máy ATM nhả xấp tiền polymer xanh trượt xòe quạt ra có in số tiền
 * - Âm thanh: Máy ATM đếm tiền xẹt... xẹt... xẹt... bíp! (ATM Dispense Tick-Beep)
 */
export function triggerWithdrawCashEffect(options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([15, 40, 20])
  playAtmCashSound(theme)
  emitTransactionAnimation({
    type: 'withdraw_cash',
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 4. RÚT TIẾT KIỆM (Withdraw Savings to Bank / Savings to Bank)
 * - Animation: Két sắt mở bung còng khóa 🔓, sóng xung kích năng lượng giải phóng
 * - Âm thanh: Ổ khóa xoay click và mở tung khoang chứa (Vault Mechanical Unlock)
 */
export function triggerWithdrawSavingsEffect(options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([25, 20])
  playVaultUnlockSound(theme)
  emitTransactionAnimation({
    type: 'withdraw_savings',
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 5. GỬI TIẾT KIỆM (Deposit to Savings Vault)
 * - Animation: Thùng két vàng hứng 3 đồng xu vàng lớn rơi "Plink plink", nảy nhẹ
 * - Âm thanh: Đồng xu vàng rơi vào khe két sắt "Keng... Clink... Keng!" (Gold Coin Metal Resonance)
 */
export function triggerDepositSavingsEffect(options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([15, 25, 35])
  playCoinDropSound(theme)
  emitTransactionAnimation({
    type: 'deposit_savings',
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 6. NẠP TIỀN VÀO TÀI KHOẢN (Deposit Cash to Bank)
 * - Animation: Luồng sóng ngân hàng số thăng thiên 💳 ⚡
 * - Âm thanh: Xung năng lượng nạp tiền số (Digital Beam Inflow)
 */
export function triggerDepositCashEffect(options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([15, 20])
  playTransferSound(theme)
  emitTransactionAnimation({
    type: 'deposit_cash',
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 7. CHUYỂN TIỀN NỘI BỘ (General Transfer)
 * Tự động điều hướng theo chiều chuyển khoản:
 * - bank_to_cash: Rút tiền mặt (ATM)
 * - cash_to_bank: Nạp tiền vào tài khoản
 * - savings_to_bank: Rút tiết kiệm
 * - bank_to_savings: Gửi tiết kiệm
 */
export function triggerTransferEffect(
  direction?: TransferDirection,
  options?: TransactionEffectOptions
) {
  if (direction === 'bank_to_cash') {
    triggerWithdrawCashEffect(options)
    return
  }
  if (direction === 'cash_to_bank') {
    triggerDepositCashEffect(options)
    return
  }
  if (direction === 'savings_to_bank') {
    triggerWithdrawSavingsEffect(options)
    return
  }
  if (direction === 'bank_to_savings') {
    triggerDepositSavingsEffect(options)
    return
  }

  const theme = options?.theme || getActiveTheme()
  // Chuyển khoản thông thường: Hai ví 2 bên trao đổi luồng ánh sáng
  triggerHaptic([15, 20])
  playTransferSound(theme)
  emitTransactionAnimation({
    type: 'transfer',
    direction,
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 8. TRẢ NỢ (Pay Debt / Repayment)
 * - Animation: Xiềng xích vỡ vụn, khiên bảo vệ xác nhận "Đã thanh toán", lông vũ bay lên nhẹ bẫng 🕊️
 * - Âm thanh: Hợp âm thanh thản giải phóng gánh nặng (Serene Freedom Chord)
 */
export function triggerDebtPayEffect(options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([15, 30])
  playDebtPaySound(theme)
  emitTransactionAnimation({
    type: 'debt_pay',
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 9. THU NỢ (Debt Collection)
 * - Animation: Nam châm tài lộc 🧲 hút các đồng tiền vàng từ 4 phía quy tụ về tâm ví 🎯
 * - Âm thanh: Fanfare hồi vốn vui tươi (Victory Recall Chime)
 */
export function triggerDebtCollectEffect(options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([20, 20, 20])
  playDebtCollectSound(theme)
  emitTransactionAnimation({
    type: 'debt_collect',
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 10. THÊM KHOẢN NỢ / CHO VAY (Add Debt / Borrow / Lend)
 * - Animation: Thẻ ghi nhận hợp đồng minh bạch 📋 🤝
 * - Âm thanh: Xác nhận ghi chép
 */
export function triggerDebtAddEffect(
  type?: 'payable' | 'receivable',
  options?: TransactionEffectOptions
) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([15])
  playReconcileSound(theme)
  emitTransactionAnimation({
    type: 'debt_add',
    debtType: type,
    amount: options?.amount,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * 11. KIỂM KÊ / CÂN ĐỐI SỐ DƯ (Reconcile Balance)
 * - Animation: Cán cân công lý ⚖️ đung đưa rồi về điểm cân bằng hoàn hảo
 * - Âm thanh: Crystal tune cân bằng
 */
export function triggerReconcileEffect(diff: number, options?: TransactionEffectOptions) {
  const theme = options?.theme || getActiveTheme()
  triggerHaptic([15])
  playReconcileSound(theme)
  emitTransactionAnimation({
    type: 'reconcile',
    diff,
    lang: options?.lang,
    currency: options?.currency,
    theme,
  })
}

/**
 * Master dispatcher
 */
export function triggerTransactionEffect(
  type: TransactionType | 'debt_pay' | 'debt_collect' | 'debt_add' | 'withdraw_cash' | 'withdraw_savings',
  options?: TransactionEffectOptions & {
    direction?: TransferDirection
    diff?: number
    debtType?: 'payable' | 'receivable'
  }
) {
  switch (type) {
    case 'income':
      triggerIncomeEffect(options)
      break
    case 'expense':
      triggerExpenseEffect(options)
      break
    case 'transfer':
      triggerTransferEffect(options?.direction, options)
      break
    case 'withdraw_cash':
      triggerWithdrawCashEffect(options)
      break
    case 'withdraw_savings':
      triggerWithdrawSavingsEffect(options)
      break
    case 'debt_pay':
      triggerDebtPayEffect(options)
      break
    case 'debt_collect':
      triggerDebtCollectEffect(options)
      break
    case 'debt_add':
      triggerDebtAddEffect(options?.debtType, options)
      break
    case 'reconciliation':
      triggerReconcileEffect(options?.diff ?? 0, options)
      break
    default:
      triggerIncomeEffect(options)
      break
  }
}
