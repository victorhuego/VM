'use client'

import React from 'react'
import {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Dog,
  Baby,
  Gift,
  Receipt,
  Wrench,
  HandCoins,
  HelpCircle,
  Briefcase,
  Award,
  Building2,
  CircleDollarSign,
  ArrowRightLeft,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  Coins,
  ShieldAlert,
} from 'lucide-react'
import { getCategoryById } from '@/lib/categories'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Dog,
  Baby,
  Gift,
  Receipt,
  Wrench,
  HandCoins,
  HelpCircle,
  Briefcase,
  Award,
  Building2,
  CircleDollarSign,
  ArrowRightLeft,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  Coins,
  ShieldAlert,
}

interface CategoryIconProps {
  iconName?: string
  categoryId?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBackground?: boolean
  customBg?: string
  customColor?: string
}

export function CategoryIcon({
  iconName,
  categoryId,
  className = '',
  size = 'md',
  showBackground = false,
  customBg,
  customColor,
}: CategoryIconProps) {
  let resolvedIcon = iconName
  let color = customColor || '#64748B'

  if (categoryId) {
    const cat = getCategoryById(categoryId)
    resolvedIcon = resolvedIcon || cat.iconName
    color = customColor || cat.color
  }

  const IconComponent = (resolvedIcon && ICON_MAP[resolvedIcon]) || HelpCircle

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }

  const bgSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
    xl: 'w-13 h-13 rounded-2xl',
  }

  if (showBackground) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 shadow-xs transition-transform ${bgSizes[size]} ${className}`}
        style={{
          backgroundColor: customBg || `${color}18`,
          color: color,
        }}
      >
        <IconComponent className={iconSizes[size]} />
      </div>
    )
  }

  return <IconComponent className={`${iconSizes[size]} ${className}`} style={{ color }} />
}
