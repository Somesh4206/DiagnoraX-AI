'use client'

/* DiagnoraX AI — Home screen (fresh rebuild):
 * greeting, wellness ring, quick stats, quick actions, recent activity,
 * emergency strip. Mobile-first, dark neon. */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  ClipboardList,
  Flame,
  HeartPulse,
  History as HistoryIcon,
  Phone,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '../app'
import { recordData, type HealthRecordItem } from '../api'
import { EmptyState, MEDICAL_DISCLAIMER, SectionTitle, StatTile, TYPE_META, relTime } from '../ui'

/* ---------- wellness ring ---------- */

function WellnessRing({ score }: { score: number }) {
  const R = 52
  const C = 2 * Math.PI * R
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div className="relative flex size-[132px] items-center justify-center">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={R} fill="none" stroke="#122019" strokeWidth="10" />
        <motion.circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke="#00ffa3"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (C * pct) / 100 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,163,.55))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold tabular-nums text-glow">{pct}</p>
        <p className="text-[9.5px] font-semibold uppercase tracking-widest text-text-3">
          wellness
        </p>
      </div>
    </div>
  )
}

/* ---------- helpers ---------- */

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function dayStreak(records: HealthRecordItem[]): number {
  const days = new Set(records.map((r) => new Date(r.createdAt).toDateString()))
  let streak = 0
  const d = new Date()
  // today counts only if there is an entry; otherwise start from yesterday
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1)
  while (days.has(d.toDateString())) {
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function latestBmi(records: HealthRecordItem[]): number | null {
  const body = records.find((r) => r.type === 'BODY_ANALYSIS')
  if (!body) return null
  const bmi = recordData(body).result?.bmi
  return typeof bmi === 'number' ? bmi : null
}

function wellnessScore(records: HealthRecordItem[]): number {
  const week = records.filter(
    (r) => Date.now() - new Date(r.createdAt).getTime() < 7 * 86_400_000
  ).length
  const bmi = latestBmi(records)
  const score = 42 + Math.min(28, week * 7) + (bmi === null ? 0 : bmi >= 18.5 && bmi < 25 ? 22 : 9)
  return Math.max(5, Math.min(100, score))
}

/* ---------- screen ---------- */

export function HomeScreen() {
  const { navigate, records, recordsLoading } = useApp()

  const name = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('diagnorax.name') ?? ''
  }, [])

  const weekCount = records.filter(
    (r) => Date.now() - new Date(r.createdAt).getTime() < 7 * 86_400_000
  ).length
  const streak = dayStreak(records)
  const bmi = latestBmi(records)
  const score = wellnessScore(records)
  const recent = records.slice(0, 3)

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const quickActions = [
    { view: 'symptoms' as const, icon: Stethoscope, title: 'Symptom Check', desc: 'AI guidance in plain language' },
    { view: 'body' as const, icon: Scale, title: 'Body Analysis', desc: 'BMI & healthy range' },
    { view: 'history' as const, icon: HistoryIcon, title: 'History', desc: 'Everything you saved' },
    { view: 'profile' as const, icon: User, title: 'Profile', desc: 'Name, data & settings' },
  ]

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-5">
      {/* greeting + date */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-3">
          {dateStr}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {greeting()}
          {name ? (
            <span className="gradient-neon-text">, {name}</span>
          ) : (
            <span className="text-neon"> 👋</span>
          )}
        </h1>
      </div>

      {/* wellness ring + stats */}
      <section className="neon-card flex items-center gap-5 rounded-2xl p-5" aria-label="Wellness overview">
        <WellnessRing score={score} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-[13px] leading-snug text-text-2">
            A simple heuristic from your recent activity and latest BMI —{' '}
            <span className="text-foreground">not a medical score</span>.
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-text-3">
            <ShieldCheck className="size-3.5 shrink-0 text-neon/80" aria-hidden />
            Data stays on this device
          </p>
        </div>
      </section>

      {/* stat tiles */}
      <div className="grid grid-cols-4 gap-2.5">
        <StatTile icon={ClipboardList} label="checks" value={String(records.length)} tone="cyan" />
        <StatTile icon={Zap} label="this week" value={String(weekCount)} tone="neon" />
        <StatTile icon={Scale} label="last BMI" value={bmi === null ? '—' : bmi.toFixed(1)} />
        <StatTile icon={Flame} label="day streak" value={String(streak)} tone="warn" />
      </div>

      {/* quick actions */}
      <section className="flex flex-col gap-3" aria-label="Quick actions">
        <SectionTitle icon={Sparkles}>Quick actions</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.view}
              onClick={() => navigate(a.view)}
              className="neon-card neon-card-hover flex min-h-[92px] flex-col items-start gap-1.5 rounded-2xl p-4 text-left"
            >
              <span className="flex size-9 items-center justify-center rounded-xl border border-neon/25 bg-neon/10">
                <a.icon className="size-4.5 text-neon" strokeWidth={2.2} aria-hidden />
              </span>
              <p className="mt-0.5 text-sm font-semibold leading-tight">{a.title}</p>
              <p className="text-[11px] leading-snug text-text-3">{a.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* recent activity */}
      <section className="flex flex-col gap-3" aria-label="Recent activity">
        <SectionTitle
          icon={HeartPulse}
          action={
            records.length > 0 ? (
              <button
                onClick={() => navigate('history')}
                className="flex items-center gap-0.5 text-[11px] font-medium text-neon transition-colors hover:text-neon-dim"
              >
                View all <ChevronRight className="size-3" aria-hidden />
              </button>
            ) : undefined
          }
        >
          Recent activity
        </SectionTitle>
        {recordsLoading ? (
          <div className="neon-card h-16 animate-pulse rounded-2xl" />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={HeartPulse}
            title="Nothing here yet"
            hint="Run your first symptom check or body analysis — it will appear here."
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recent.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => navigate('history')}
                  className="neon-card neon-card-hover flex w-full items-center gap-3 rounded-2xl p-3.5 text-left"
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated text-[11px] font-bold',
                      r.type === 'SYMPTOM_CHECK' ? 'text-cyan' : 'text-neon'
                    )}
                  >
                    {r.type === 'SYMPTOM_CHECK' ? 'AI' : 'BMI'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium leading-tight">
                      {r.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-text-3">
                      {TYPE_META[r.type].label} · {relTime(r.createdAt)}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* emergency strip */}
      <section aria-label="Emergency numbers">
        <SectionTitle icon={Phone}>Emergency</SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <a
            href="tel:112"
            className="neon-card neon-card-hover flex items-center gap-3 rounded-2xl border-danger/30 p-4"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-danger/40 bg-danger/10">
              <Phone className="size-4 text-danger" aria-hidden />
            </span>
            <span>
              <span className="block text-base font-bold text-danger">112</span>
              <span className="block text-[10.5px] text-text-3">All emergencies (India)</span>
            </span>
          </a>
          <a
            href="tel:108"
            className="neon-card neon-card-hover flex items-center gap-3 rounded-2xl border-warn/30 p-4"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-warn/40 bg-warn/10">
              <HeartPulse className="size-4 text-warn" aria-hidden />
            </span>
            <span>
              <span className="block text-base font-bold text-warn">108</span>
              <span className="block text-[10.5px] text-text-3">Ambulance (India)</span>
            </span>
          </a>
        </div>
      </section>

      {/* disclaimer */}
      <p className="px-1 pb-2 text-[10.5px] leading-relaxed text-text-3">{MEDICAL_DISCLAIMER}</p>
    </div>
  )
}
