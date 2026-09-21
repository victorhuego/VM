import { Category } from './types'

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Ăn uống', nameEn: 'Food & Dining', iconName: 'Utensils', color: '#EF4444', type: 'expense', isDefault: true },
  { id: 'transport', name: 'Di chuyển', nameEn: 'Transportation', iconName: 'Car', color: '#F97316', type: 'expense', isDefault: true },
  { id: 'housing', name: 'Nhà ở & Tiện ích', nameEn: 'Housing & Rent', iconName: 'Home', color: '#3B82F6', type: 'expense', isDefault: true },
  { id: 'shopping', name: 'Mua sắm', nameEn: 'Shopping', iconName: 'ShoppingBag', color: '#EC4899', type: 'expense', isDefault: true },
  { id: 'entertainment', name: 'Giải trí', nameEn: 'Entertainment', iconName: 'Gamepad2', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'health', name: 'Sức khỏe', nameEn: 'Health & Medical', iconName: 'HeartPulse', color: '#10B981', type: 'expense', isDefault: true },
  { id: 'education', name: 'Giáo dục & Sách', nameEn: 'Education', iconName: 'GraduationCap', color: '#06B6D4', type: 'expense', isDefault: true },
  { id: 'development', name: 'Phát triển bản thân', nameEn: 'Self Growth', iconName: 'TrendingUp', color: '#0EA5E9', type: 'expense', isDefault: true },
  { id: 'beauty', name: 'Làm đẹp & Chăm sóc', nameEn: 'Beauty & Care', iconName: 'Sparkles', color: '#F43F5E', type: 'expense', isDefault: true },
  { id: 'pets', name: 'Thú cưng', nameEn: 'Pets', iconName: 'Dog', color: '#D97706', type: 'expense', isDefault: true },
  { id: 'children', name: 'Con cái', nameEn: 'Children', iconName: 'Baby', color: '#EAB308', type: 'expense', isDefault: true },
  { id: 'gifts', name: 'Quà tặng & Từ thiện', nameEn: 'Gifts & Charity', iconName: 'Gift', color: '#14B8A6', type: 'expense', isDefault: true },
  { id: 'bills', name: 'Hóa đơn dịch vụ', nameEn: 'Bills & Fees', iconName: 'Receipt', color: '#6366F1', type: 'expense', isDefault: true },
  { id: 'repairs', name: 'Sửa chữa bảo dưỡng', nameEn: 'Repairs', iconName: 'Wrench', color: '#64748B', type: 'expense', isDefault: true },
  { id: 'debt', name: 'Trả nợ', nameEn: 'Debt Repayment', iconName: 'HandCoins', color: '#DC2626', type: 'expense', isDefault: true },
  { id: 'other', name: 'Chi tiêu khác', nameEn: 'Other Expense', iconName: 'HelpCircle', color: '#94A3B8', type: 'expense', isDefault: true },
]

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Tiền lương', nameEn: 'Salary', iconName: 'Briefcase', color: '#16A34A', type: 'income', isDefault: true },
  { id: 'bonus', name: 'Tiền thưởng', nameEn: 'Bonus', iconName: 'Award', color: '#22C55E', type: 'income', isDefault: true },
  { id: 'investment', name: 'Lợi nhuận đầu tư', nameEn: 'Investment', iconName: 'TrendingUp', color: '#0D9488', type: 'income', isDefault: true },
  { id: 'rental', name: 'Thu nhập cho thuê', nameEn: 'Rental Income', iconName: 'Building2', color: '#2563EB', type: 'income', isDefault: true },
  { id: 'debt_collection', name: 'Thu nợ', nameEn: 'Debt Collection', iconName: 'HandCoins', color: '#15803D', type: 'income', isDefault: true },
  { id: 'other_income', name: 'Thu nhập khác', nameEn: 'Other Income', iconName: 'CircleDollarSign', color: '#64748B', type: 'income', isDefault: true },
]

export const SYSTEM_CATEGORIES: Category[] = [
  { id: 'transfer', name: 'Chuyển tiền', nameEn: 'Transfer', iconName: 'ArrowRightLeft', color: '#6366F1', type: 'system', isDefault: true },
  { id: 'reconciliation', name: 'Kiểm kê điều chỉnh', nameEn: 'Reconciliation', iconName: 'Scale', color: '#F59E0B', type: 'system', isDefault: true },
  { id: 'loan_out', name: 'Cho vay', nameEn: 'Lend Money', iconName: 'ArrowUpRight', color: '#EA580C', type: 'system', isDefault: true },
  { id: 'loan_in', name: 'Đi vay', nameEn: 'Borrow Money', iconName: 'ArrowDownLeft', color: '#2563EB', type: 'system', isDefault: true },
]

export const ALL_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES, ...SYSTEM_CATEGORIES]

export function getCategoryById(id: string): Category {
  const found = ALL_CATEGORIES.find((c) => c.id === id)
  if (found) return found
  return {
    id,
    name: id,
    nameEn: id,
    iconName: 'HelpCircle',
    color: '#94A3B8',
    type: 'expense',
  }
}
