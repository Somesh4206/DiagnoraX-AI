'use client'

/* DiagnoraX AI — Home screen (app dashboard) */

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  ClipboardList,
  HeartPulse,
  History as HistoryIcon,
  LockKeyhole,
  Phone,
  Scale,
  Siren,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabId } from '../tab-bar'
import type { HealthRecordItem } from '../api'
import { Chip, IconBadge, ScreenSection, SectionTitle, TapButton, timeAgo, urgencyMeta, bodyCategoryTone, EmptyState } from '../ui-bits'
import type { ToastTone } from '../app'

/* ---------- wellness ring ---------- */

function WellnessRing({ score }: { score: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  const target = c * (1 - score / 100)
  return (
    <div className="relative h-[104px] w-[104px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="9" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: target }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold leading-none tabular-nums">{score}</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/70">
          score
        </span>
      </div>
    </div>
  )
}

/* ---------- screen ---------- */

export function HomeScreen({
  records,
  loading,
  go,
  notify,
}: {
  records: HealthRecordItem[]
  loading: boolean
  go: (tab: TabId) => void
  notify: (message: string, tone?: ToastTone) => void
}) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const thisMonth = records.filter(
    (r) => new Date(r.createdAt).getMonth() === now.getMonth(),
  )
  const latestBody = records.find((r) => r.type === 'BODY_ANALYSIS')
  const latestBmi = latestBody?.data?.result?.bmi ?? null

  const score = React.useMemo(() => {
    let s = 58 + thisMonth.length * 4
    if (latestBmi !== null) s += latestBmi >= 18.5 && latestBmi < 25 ? 14 : 5
    return Math.min(98, s)
  }, [thisMonth.length, latestBmi])

  const recent = records.slice(0, 3)

  const quickActions: {
    label: string
    desc: string
    icon: typeof Stethoscope
    tone: 'emerald' | 'amber' | 'teal' | 'slate'
    tab: TabId
  }[] = [
    { label: 'Symptom Check', desc: 'AI guidance', icon: Stethoscope, tone: 'emerald', tab: 'check' },
    { label: 'BMI Check', desc: 'Body metrics', icon: Scale, tone: 'amber', tab: 'body' },
    { label: 'History', desc: `${records.length} saved`, icon: HistoryIcon, tone: 'teal', tab: 'history' },
    { label: 'Profile', desc: 'Settings & data', icon: UserRound, tone: 'slate', tab: 'profile' },
  ]

  return (
    <div className="flex flex-col gap-6 pt-5">
      {/* Greeting */}
      <ScreenSection>
        <p className="text-[13px] font-medium text-muted-foreground" suppressHydrationWarning>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h2 className="mt-0.5 text-[22px] font-extrabold tracking-tight" suppressHydrationWarning>
          {greeting} 👋
        </h2>
        <p className="mt-0.5 text-[14px] text-muted-foreground">How are you feeling today?</p>
      </ScreenSection>

      {/* Wellness snapshot */}
      <ScreenSection>
        <div className="relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-600/25">
          <div
            aria-hidden
            className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative flex items-center gap-5">
            <WellnessRing score={score} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/75">
                Health Snapshot
              </p>
              <p className="mt-1 text-[13px] leading-snug text-white/90">
                {thisMonth.length > 0
                  ? `${thisMonth.length} check${thisMonth.length > 1 ? 's' : ''} this month — keep it up.`
                  : 'Run your first check to start tracking.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                  {records.length} total
                </span>
                {latestBmi !== null && (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                    BMI {latestBmi.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScreenSection>

      {/* Quick actions */}
      <ScreenSection>
        <SectionTitle>Quick actions</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((qa, i) => (
            <motion.div
              key={qa.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              className="h-full"
            >
              <TapButton
                onClick={() => go(qa.tab)}
                ariaLabel={`Open ${qa.label}`}
                className="app-card h-full w-full p-4"
              >
                <div className="flex items-center justify-between">
                  <IconBadge icon={qa.icon} tone={qa.tone} className="h-11 w-11 rounded-[14px]" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <p className="mt-3 text-[15px] font-bold leading-tight">{qa.label}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{qa.desc}</p>
              </TapButton>
            </motion.div>
          ))}
        </div>
      </ScreenSection>

      {/* Recent activity */}
      <ScreenSection>
        <SectionTitle
          action={
            records.length > 0 ? (
              <button
                type="button"
                onClick={() => go('history')}
                className="text-[13px] font-semibold text-primary"
              >
                See all
              </button>
            ) : undefined
          }
        >
          Recent activity
        </SectionTitle>

        {loading ? (
          <div className="app-card divide-y divide-border/60">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="app-card">
            <EmptyState
              icon={Activity}
              title="No checks yet"
              hint="Run a symptom check or a BMI analysis — it lands here."
              action={
                <TapButton
                  onClick={() => go('check')}
                  className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground"
                >
                  Run your first check
                </TapButton>
              }
            />
          </div>
        ) : (
          <div className="app-card divide-y divide-border/60">
            {recent.map((r) => (
              <TapButton
                key={r.id}
                onClick={() => go('history')}
                ariaLabel={`Open history: ${r.title}`}
                className="w-full"
              >
                <div className="flex items-center gap-3 p-4">
                  {r.type === 'SYMPTOM_CHECK' ? (
                    <IconBadge icon={ClipboardList} tone="emerald" />
                  ) : (
                    <IconBadge icon={HeartPulse} tone="amber" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold leading-tight">{r.title}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{timeAgo(r.createdAt)}</p>
                  </div>
                  {r.type === 'SYMPTOM_CHECK' && r.severity ? (
                    <Chip className={cn(urgencyMeta(r.severity).chip)}>
                      {urgencyMeta(r.severity).label}
                    </Chip>
                  ) : r.severity ? (
                    <Chip className={bodyCategoryTone(r.severity)}>{r.severity}</Chip>
                  ) : null}
                </div>
              </TapButton>
            ))}
          </div>
        )}
      </ScreenSection>

      {/* Emergency */}
      <ScreenSection>
        <div className="rounded-2xl border border-destructive/25 bg-destructive/[0.06] p-4">
          <div className="flex items-start gap-3">
            <IconBadge icon={Siren} tone="red" className="h-9 w-9 rounded-[10px]" iconClassName="h-4 w-4" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-tight">In an emergency, call now</p>
              <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                DiagnoraX is not for emergencies. Real humans, right now:
              </p>
              <div className="mt-2.5 flex gap-2">
                <a
                  href="tel:112"
                  className="flex items-center gap-1.5 rounded-full bg-destructive px-3.5 py-2 text-[13px] font-bold text-destructive-foreground active:scale-95 transition-transform"
                >
                  <Phone className="h-3.5 w-3.5" /> 112
                </a>
                <a
                  href="tel:108"
                  className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-card px-3.5 py-2 text-[13px] font-bold text-destructive active:scale-95 transition-transform"
                >
                  <Phone className="h-3.5 w-3.5" /> 108 Ambulance
                </a>
              </div>
            </div>
          </div>
        </div>
      </ScreenSection>

      {/* Privacy strip */}
      <ScreenSection>
        <div className="flex items-center justify-center gap-1.5 pb-1 text-[12px] font-medium text-muted-foreground">
          <LockKeyhole className="h-3.5 w-3.5" />
          Private by design — your data never leaves this device
        </div>
      </ScreenSection>
    </div>
  )
}
