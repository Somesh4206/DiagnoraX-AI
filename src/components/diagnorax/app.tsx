'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  History as HistoryIcon,
  Home,
  LayoutDashboard,
  Scale,
  Siren,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VIEW_LABEL, MEDICAL_DISCLAIMER, type View } from './ui-bits'
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

      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
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

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => {
                const active = view === n.view
                return (
                  <li key={n.view} className="relative">
                    <button
                      onClick={() => navigate(n.view)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative rounded-md px-3 py-2 text-sm transition-colors',
                        active
                          ? 'font-medium text-neon'
                          : 'text-text-2 hover:text-foreground'
                      )}
                    >
                      {VIEW_LABEL[n.view]}
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-neon shadow-[0_0_10px_rgba(0,255,163,.8)]"
                        />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <p className="hidden items-center gap-1.5 text-[11px] leading-tight text-text-3 lg:flex">
            <Siren className="size-3.5 shrink-0 text-danger/90" aria-hidden />
            In an emergency, call your local emergency services.
          </p>
        </div>
      </header>

      {/* ---------- main ---------- */}
      <main id="main" className="flex-1 pb-24 md:pb-0">
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

      {/* ---------- footer ---------- */}
      <Footer onNavigate={navigate} />

      {/* ---------- mobile bottom nav ---------- */}
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/90 backdrop-blur-md md:hidden"
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

/* ---------- footer ---------- */

function Footer({ onNavigate }: { onNavigate: (v: View) => void }) {
  const liveLinks: { view: View; label: string }[] = [
    { view: 'home', label: 'Home' },
    { view: 'dashboard', label: 'Dashboard' },
    { view: 'symptoms', label: 'Symptom Check' },
    { view: 'body', label: 'Body Analysis' },
    { view: 'history', label: 'History' },
  ]
  const planned = ['Report Explainer', 'Smart Reminders', 'Doctor Finder']

  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 md:pb-10">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-lg border border-neon/40 bg-neon/10 p-1.5">
                <Activity className="size-4 text-neon" aria-hidden />
              </span>
              <span className="text-base font-semibold tracking-tight">
                DiagnoraX<span className="text-neon"> AI</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-2">
              Your personal AI health companion. Information you can act on — not a diagnosis.
            </p>
            <p className="mt-4 max-w-md text-[11px] leading-relaxed text-text-3">
              {MEDICAL_DISCLAIMER}
            </p>
          </div>

          <nav aria-label="Live modules">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-3">
              Live modules
            </h3>
            <ul className="mt-4 space-y-2.5">
              {liveLinks.map((l) => (
                <li key={l.view}>
                  <button
                    onClick={() => onNavigate(l.view)}
                    className="text-sm text-text-2 transition-colors hover:text-neon"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-text-3">Roadmap</h3>
            <ul className="mt-4 space-y-2.5">
              {planned.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-text-3">
                  {p}
                  <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                    Planned
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-text-3">
              Roadmap items ship when they meet the same quality bar as the live modules.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-text-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DiagnoraX AI · Built by Somesh M</p>
          <p>Not a medical device · No data leaves your device</p>
        </div>
      </div>
    </footer>
  )
}
