'use client'

/* DiagnoraX AI — shared UI primitives (fresh rebuild).
 * Everything renders mobile-first: single column, touch targets ≥44px,
 * dark neon tokens only. */

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Activity } from 'lucide-react'
import type { UrgencyLevel } from './api'

/* ---------- urgency ---------- */

export const URGENCY: Record<
  UrgencyLevel,
  { label: string; sub: string; badge: string; banner: string }
> = {
  emergency: {
    label: 'Emergency — act now',
    sub: 'This needs immediate professional care.',
    badge: 'border-danger/50 bg-danger/15 text-danger',
    banner: 'border-danger/50 bg-danger/10',
  },
  urgent: {
    label: 'Urgent — see a doctor soon',
    sub: 'Within hours, not days.',
    badge: 'border-warn/50 bg-warn/15 text-warn',
    banner: 'border-warn/50 bg-warn/10',
  },
  routine: {
    label: 'Routine — non-urgent care',
    sub: 'A routine appointment is fine — within days, not hours.',
    badge: 'border-cyan/50 bg-cyan/15 text-cyan',
    banner: 'border-cyan/40 bg-cyan/10',
  },
  low: {
    label: 'Low — self-care is reasonable',
    sub: 'Monitor at home; see a doctor if it worsens.',
    badge: 'border-neon/50 bg-neon/15 text-neon',
    banner: 'border-neon/40 bg-neon/10',
  },
}

export function UrgencyBadge({ level, className }: { level: UrgencyLevel; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
        URGENCY[level].badge,
        className
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {URGENCY[level].label.split(' — ')[0]}
    </span>
  )
}

/* ---------- record type ---------- */

export const TYPE_META = {
  SYMPTOM_CHECK: { label: 'Symptom check', tone: 'text-cyan' },
  BODY_ANALYSIS: { label: 'Body analysis', tone: 'text-neon' },
} as const

/* ---------- logo ---------- */

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-neon/40 bg-neon/10 p-1.5 shadow-[0_0_14px_rgba(0,255,163,.25)]',
        className
      )}
    >
      <Activity className="size-4 text-neon" aria-hidden />
    </span>
  )
}

/* ---------- layout bits ---------- */

export function SectionTitle({
  icon: Icon,
  children,
  action,
}: {
  icon?: LucideIcon
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
        {Icon ? <Icon className="size-3.5 text-neon/80" aria-hidden /> : null}
        {children}
      </h2>
      {action}
    </div>
  )
}

export function StatTile({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'default' | 'neon' | 'cyan' | 'warn'
}) {
  const toneCls =
    tone === 'neon'
      ? 'text-neon'
      : tone === 'cyan'
        ? 'text-cyan'
        : tone === 'warn'
          ? 'text-warn'
          : 'text-foreground'
  return (
    <div className="neon-card neon-inset flex flex-col gap-1.5 rounded-xl p-3.5">
      <Icon className={cn('size-4 shrink-0', toneCls)} aria-hidden />
      <p className={cn('text-xl font-bold leading-none tabular-nums', toneCls)}>{value}</p>
      <p className="text-[10.5px] font-medium uppercase tracking-wider text-text-3">{label}</p>
    </div>
  )
}

export function AIThinking({ label = 'AI is analyzing…' }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-neon/25 bg-neon/5 px-4 py-3.5"
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1" aria-hidden>
        <span className="dot-pulse size-1.5 rounded-full bg-neon" />
        <span className="dot-pulse size-1.5 rounded-full bg-neon" />
        <span className="dot-pulse size-1.5 rounded-full bg-neon" />
      </span>
      <p className="text-sm text-text-2">{label}</p>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon
  title: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl border border-border bg-elevated">
        <Icon className="size-5 text-text-3" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-text-3">{hint}</p> : null}
      </div>
    </div>
  )
}

/* ---------- time helpers ---------- */

export function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function dayKey(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(d, today)) return 'Today'
  if (same(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

/* ---------- disclaimer ---------- */

export const MEDICAL_DISCLAIMER =
  'DiagnoraX AI provides health information, not medical advice. It is not a substitute for professional diagnosis or treatment. In an emergency, contact your local emergency services immediately.'
