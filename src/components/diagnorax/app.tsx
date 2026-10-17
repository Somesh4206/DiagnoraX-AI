'use client'

/* DiagnoraX AI — mobile app shell.
 * Single-route app (platform rule): screens are switched client-side,
 * rendered inside a phone frame (desktop) or full-screen (mobile).
 */

import * as React from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CircleCheck } from 'lucide-react'
import { PhoneFrame } from './phone-frame'
import { TabBar, type TabId } from './tab-bar'
import { api, ApiError, type HealthRecordItem } from './api'
import { HomeScreen } from './screens/home'
import { SymptomsScreen } from './screens/symptoms'
import { BodyScreen } from './screens/body'
import { HistoryScreen } from './screens/history'
import { ProfileScreen } from './screens/profile'

/* ---------- toast (in-app, native style) ---------- */

export type ToastTone = 'default' | 'success' | 'error'
interface AppToast {
  id: number
  message: string
  tone: ToastTone
}

/* ---------- per-screen header config ---------- */

const HEADERS: Record<TabId, { title: string; subtitle: string }> = {
  home: { title: '', subtitle: '' },
  check: { title: 'Symptom Check', subtitle: 'AI-powered guidance in seconds' },
  body: { title: 'Body Lab', subtitle: 'BMI & healthy weight range' },
  history: { title: 'History', subtitle: 'Your past checks' },
  profile: { title: 'Profile', subtitle: 'Preferences & your data' },
}

export function DiagnoraXApp() {
  const [tab, setTab] = React.useState<TabId>('home')
  const [records, setRecords] = React.useState<HealthRecordItem[]>([])
  const [recordsLoading, setRecordsLoading] = React.useState(true)
  const [toast, setToast] = React.useState<AppToast | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const notify = React.useCallback((message: string, tone: ToastTone = 'default') => {
    setToast({ id: Date.now(), message, tone })
  }, [])

  React.useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(id)
  }, [toast])

  const refreshRecords = React.useCallback(async () => {
    try {
      const { records } = await api.listRecords({ limit: 100 })
      setRecords(records)
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Could not load history.', 'error')
    } finally {
      setRecordsLoading(false)
    }
  }, [notify])

  React.useEffect(() => {
    void refreshRecords()
  }, [refreshRecords])

  // Reset scroll to top on every tab change, like a native app.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [tab])

  const go = React.useCallback((next: TabId) => setTab(next), [])

  const header = HEADERS[tab]

  return (
    <PhoneFrame>
      {/* ------- App header (fixed above scrolling content) ------- */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/90 px-5 backdrop-blur">
        {tab === 'home' ? (
          <>
            <div className="flex items-center gap-2.5">
              <Image
                src="/icon-1024.png"
                alt="DiagnoraX AI"
                width={30}
                height={30}
                className="rounded-[9px]"
                priority
              />
              <div className="leading-tight">
                <p className="text-[15px] font-extrabold tracking-tight">DiagnoraX</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                  Health Companion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => notify("You're all caught up — no new alerts.")}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted outline-none transition-transform active:scale-90"
              >
                <Bell className="h-[18px] w-[18px] text-foreground/70" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              </button>
              <button
                type="button"
                aria-label="Open profile"
                onClick={() => go('profile')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[13px] font-bold text-white outline-none transition-transform active:scale-90"
              >
                Y
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="leading-tight">
              <h1 className="text-[17px] font-extrabold tracking-tight">{header.title}</h1>
              <p className="text-[11px] text-muted-foreground">{header.subtitle}</p>
            </div>
            <button
              type="button"
              aria-label="Open profile"
              onClick={() => go('profile')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[13px] font-bold text-white outline-none transition-transform active:scale-90"
            >
              Y
            </button>
          </>
        )}
      </header>

      {/* ------- Screens (scrollable app content) ------- */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.19, ease: 'easeOut' }}
            className="min-h-full"
          >
            {tab === 'home' && (
              <HomeScreen records={records} loading={recordsLoading} go={go} notify={notify} />
            )}
            {tab === 'check' && (
              <SymptomsScreen go={go} notify={notify} onSaved={() => void refreshRecords()} />
            )}
            {tab === 'body' && (
              <BodyScreen notify={notify} onSaved={() => void refreshRecords()} />
            )}
            {tab === 'history' && (
              <HistoryScreen
                records={records}
                loading={recordsLoading}
                go={go}
                notify={notify}
                onRefresh={() => void refreshRecords()}
              />
            )}
            {tab === 'profile' && (
              <ProfileScreen records={records} notify={notify} onRefresh={() => void refreshRecords()} />
            )}
          </motion.div>
        </AnimatePresence>
        {/* clearance so content is never hidden behind the tab bar */}
        <div className="h-28" aria-hidden />
      </div>

      {/* ------- Bottom tab navigation ------- */}
      <TabBar active={tab} onChange={go} />

      {/* ------- In-app toast (inside the phone, native style) ------- */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-[92px] z-40 flex justify-center px-6"
      >
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="flex max-w-full items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-medium text-background shadow-xl"
            >
              {toast.tone === 'success' && <CircleCheck className="h-4 w-4 shrink-0 text-emerald-400" />}
              <span className="truncate">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PhoneFrame>
  )
}
