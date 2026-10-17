'use client'

/* DiagnoraX AI — app shell (fresh rebuild).
 * A pure mobile app shell: compact app header, animated screen stack and a
 * fixed bottom tab bar (the ONLY navigation). No desktop nav, no footer,
 * no website chrome — at any viewport. */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  History as HistoryIcon,
  Home,
  Scale,
  Stethoscope,
  User,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, type HealthRecordItem } from './api'
import { LogoMark } from './ui'
import { HomeScreen } from './screens/home'
import { SymptomsScreen } from './screens/symptoms'
import { BodyScreen } from './screens/body'
import { HistoryScreen } from './screens/history'
import { ProfileScreen } from './screens/profile'

export type View = 'home' | 'symptoms' | 'body' | 'history' | 'profile'

const TABS: { view: View; icon: LucideIcon; label: string }[] = [
  { view: 'home', icon: Home, label: 'Home' },
  { view: 'symptoms', icon: Stethoscope, label: 'Check' },
  { view: 'body', icon: Scale, label: 'Body' },
  { view: 'history', icon: HistoryIcon, label: 'History' },
  { view: 'profile', icon: User, label: 'Profile' },
]

/* ---------- shared app context ---------- */

interface AppCtx {
  view: View
  navigate: (v: View) => void
  records: HealthRecordItem[]
  recordsLoading: boolean
  refreshRecords: () => Promise<void>
}

const AppContext = createContext<AppCtx | null>(null)

export function useApp(): AppCtx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside DiagnoraXApp')
  return ctx
}

/* ---------- shell ---------- */

export function DiagnoraXApp() {
  const [view, setView] = useState<View>('home')
  const [records, setRecords] = useState<HealthRecordItem[]>([])
  const [recordsLoading, setRecordsLoading] = useState(true)

  const navigate = useCallback((v: View) => setView(v), [])

  const refreshRecords = useCallback(async () => {
    try {
      const { records } = await api.getRecords({ limit: 100 })
      setRecords(records)
    } catch {
      // keep last known records; screens surface their own errors
    } finally {
      setRecordsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshRecords()
  }, [refreshRecords])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view])

  const ctx: AppCtx = { view, navigate, records, recordsLoading, refreshRecords }

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex min-h-dvh flex-col bg-background">
        <a
          href="#app-main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-neon focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>

        {/* ---------- app header ---------- */}
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <button
              onClick={() => navigate('home')}
              className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 text-left"
              aria-label="DiagnoraX AI — go to home"
            >
              <LogoMark />
              <span className="text-[15px] font-semibold tracking-tight">
                DiagnoraX<span className="text-neon"> AI</span>
              </span>
            </button>
            <p className="flex items-center gap-1.5 text-[10.5px] font-medium text-text-3">
              <span
                aria-hidden
                className="inline-block size-1.5 rounded-full bg-neon shadow-[0_0_8px_rgba(0,255,163,.9)]"
              />
              Private · on-device history
            </p>
          </div>
        </header>

        {/* ---------- screens ---------- */}
        <main id="app-main" className="flex-1 pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {view === 'home' ? <HomeScreen /> : null}
              {view === 'symptoms' ? <SymptomsScreen /> : null}
              {view === 'body' ? <BodyScreen /> : null}
              {view === 'history' ? <HistoryScreen /> : null}
              {view === 'profile' ? <ProfileScreen /> : null}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ---------- bottom tab bar (the only navigation) ---------- */}
        <nav
          aria-label="App navigation"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/92 backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <ul className="grid max-w-md grid-cols-5 mx-auto">
            {TABS.map((t) => {
              const active = view === t.view
              return (
                <li key={t.view}>
                  <button
                    onClick={() => navigate(t.view)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-[52px] w-full flex-col items-center justify-center gap-1 px-1 pb-1.5 pt-2 text-[10px] font-medium transition-colors',
                      active ? 'text-neon' : 'text-text-3'
                    )}
                  >
                    <t.icon
                      className={cn(
                        'size-5',
                        active && 'drop-shadow-[0_0_8px_rgba(0,255,163,.9)]'
                      )}
                      aria-hidden
                    />
                    {t.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </AppContext.Provider>
  )
}
