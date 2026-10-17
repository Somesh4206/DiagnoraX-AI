'use client'

/* DiagnoraX AI — bottom tab bar (native app navigation) */

import { motion } from 'framer-motion'
import { House, Stethoscope, Scale, History, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'home' | 'check' | 'body' | 'history' | 'profile'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'check', label: 'Check', icon: Stethoscope },
  { id: 'body', label: 'Body', icon: Scale },
  { id: 'history', label: 'History', icon: History },
  { id: 'profile', label: 'Profile', icon: UserRound },
]

export function TabBar({
  active,
  onChange,
}: {
  active: TabId
  onChange: (tab: TabId) => void
}) {
  return (
    <nav
      aria-label="App navigation"
      className="absolute inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/92 backdrop-blur-xl"
    >
      <div className="grid grid-cols-5 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 lg:pb-3">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <motion.button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(tab.id)}
              className="flex select-none flex-col items-center gap-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:rounded-xl"
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full px-[15px] py-[3px] transition-colors',
                  isActive ? 'bg-primary/12' : 'bg-transparent',
                )}
              >
                <tab.icon
                  className={cn(
                    'h-[22px] w-[22px] transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                  strokeWidth={isActive ? 2.4 : 2}
                />
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold leading-none transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {tab.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
