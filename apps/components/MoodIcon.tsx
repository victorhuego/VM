'use client'

import React from 'react'
import {
  Coffee,
  Leaf,
  Lightbulb,
  CloudRain,
  Footprints,
  Headphones,
  Sparkles,
} from 'lucide-react'

const MOOD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Coffee,
  Leaf,
  Lightbulb,
  CloudRain,
  Footprints,
  Headphones,
}

interface MoodIconProps {
  name: string
  className?: string
}

export function MoodIcon({ name, className = 'w-3 h-3' }: MoodIconProps) {
  const Component = MOOD_ICONS[name] || Sparkles
  return <Component className={className} />
}
