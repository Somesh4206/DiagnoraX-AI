'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  History as HistoryIcon,
  Home,
  LayoutDashboard,
  Scale,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VIEW_LABEL, type View } from './ui-bits'
import { LandingView } from './landing'
import { DashboardView } from './dashboard'
import { SymptomCheckerView } from './symptoms'
import { BodyAnalysisView } from './body'
import { HistoryView } from './history'

const NAV: { view: View; icon: LucideIcon }[] = [
  { view: 'home', icon: Home },
  { view: 'dashboard', icon: LayoutDashboard },
  { view: 'symptoms', icon: Stethoscope },
  { view: 'body', icon: Scale },
  { view: 'history', icon: HistoryIcon },
]

export function DiagnoraXApp() {
  const [view, setView] = useState<View>('home')
  const navigate = useCallback((v: View) => setView(v), [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-neon focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* ---------- app header ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-left"
            aria-label="DiagnoraX AI — go to home"
          >
            <span className="rounded-lg border border-neon/40 bg-neon/10 p-1.5 shadow-[0_0_14px_rgba(0,255,163,.25)]">
              <Activity className="size-4 text-neon" aria-hidden />
            </span>
            <span className="text-base font-semibold tracking-tight">
              DiagnoraX<span className="text-neon"> AI</span>
            </span>
          </button>

          <p className="flex items-center gap-1.5 text-[11px] leading-tight text-text-3">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-neon shadow-[0_0_8px_rgba(0,255,163,.8)]" />
            AI health companion
          </p>
        </div>
      </header>

      {/* ---------- main ---------- */}
      <main id="main" className="flex-1 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {view === 'home' ? <LandingView onNavigate={navigate} /> : null}
            {view === 'dashboard' ? <DashboardView onNavigate={navigate} /> : null}
            {view === 'symptoms' ? <SymptomCheckerView onNavigate={navigate} /> : null}
            {view === 'body' ? <BodyAnalysisView onNavigate={navigate} /> : null}
            {view === 'history' ? <HistoryView onNavigate={navigate} /> : null}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ---------- bottom tab bar (the app's navigation) ---------- */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/90 backdrop-blur-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = view === n.view
            return (
              <li key={n.view}>
                <button
                  onClick={() => navigate(n.view)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex w-full flex-col items-center gap-1 px-1 pb-1.5 pt-2 text-[10px] font-medium transition-colors',
                    active ? 'text-neon' : 'text-text-3'
                  )}
                >
                  <n.icon
                    className={cn('size-5', active && 'drop-shadow-[0_0_8px_rgba(0,255,163,.9)]')}
                    aria-hidden
                  />
                  {VIEW_LABEL[n.view]}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
