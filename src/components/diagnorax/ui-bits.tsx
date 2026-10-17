'use client'

import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle2,
  CircleAlert,
  Inbox,
  Info,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Siren,
  Stethoscope,
  Scale,
  TriangleAlert,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* ---------- app navigation ---------- */

export type View = 'home' | 'dashboard' | 'symptoms' | 'body' | 'history'

export const VIEW_LABEL: Record<View, string> = {
  home: 'Home',
  dashboard: 'Dashboard',
  symptoms: 'Symptom Check',
  body: 'Body Analysis',
  history: 'History',
}

/* ---------- urgency system ---------- */

export type UrgencyLevel = 'emergency' | 'urgent' | 'routine' | 'low'

export const URGENCY: Record<
  UrgencyLevel,
  { label: string; short: string; icon: LucideIcon; chip: string; bar: string; dot: string }
> = {
  emergency: {
    label: 'Emergency — act now',
    short: 'Emergency',
    icon: Siren,
    chip: 'border-danger/45 bg-danger/10 text-danger',
    bar: 'bg-danger',
    dot: 'bg-danger',
  },
  urgent: {
    label: 'Urgent — see a doctor soon',
    short: 'Urgent',
    icon: TriangleAlert,
    chip: 'border-warn/45 bg-warn/10 text-warn',
    bar: 'bg-warn',
    dot: 'bg-warn',
  },
  routine: {
    label: 'Routine — non-urgent care',
    short: 'Routine',
    icon: CircleAlert,
    chip: 'border-cyan/40 bg-cyan/10 text-cyan',
    bar: 'bg-cyan',
    dot: 'bg-cyan',
  },
  low: {
    label: 'Low — self-care likely fine',
    short: 'Low',
    icon: CheckCircle2,
    chip: 'border-neon/40 bg-neon/10 text-neon',
    bar: 'bg-neon',
    dot: 'bg-neon',
  },
}

export function UrgencyBadge({ level, className }: { level: UrgencyLevel; className?: string }) {
  const u = URGENCY[level] ?? URGENCY.routine
  const Icon = u.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        u.chip,
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {u.short}
    </span>
  )
}

/* ---------- record helpers ---------- */

export type RecordType = 'SYMPTOM_CHECK' | 'BODY_ANALYSIS'

export const RECORD_TYPE_META: Record<RecordType, { label: string; icon: LucideIcon }> = {
  SYMPTOM_CHECK: { label: 'Symptom check', icon: Stethoscope },
  BODY_ANALYSIS: { label: 'Body analysis', icon: Scale },
}

export function relTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  if (diff < 45_000) return 'just now'
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ---------- layout blocks ---------- */

export function ViewHeader({
  title,
  sub,
  right,
}: {
  title: string
  sub?: string
  right?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {sub ? <p className="mt-1 text-sm text-text-2">{sub}</p> : null}
      </div>
      {right}
    </div>
  )
}

export function SectionHead({
  eyebrow,
  title,
  sub,
  className,
}: {
  eyebrow: string
  title: string
  sub?: string
  className?: string
}) {
  return (
    <div className={cn('mx-auto max-w-2xl text-center', className)}>
      <span className="chip-neon inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {sub ? <p className="mt-3 text-base text-text-2">{sub}</p> : null}
    </div>
  )
}

/* ---------- states ---------- */

export function AIThinking({ label = 'AI is analyzing your symptoms…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14 text-center" role="status" aria-live="polite">
      <div className="flex items-center gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="dot-pulse size-2 rounded-full bg-neon shadow-[0_0_10px_rgba(0,255,163,.7)]" />
        ))}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-text-3">Typically under 30 seconds.</p>
      </div>
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-14 text-sm text-text-2" role="status">
      <Loader2 className="size-4 animate-spin text-neon" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-danger/30 bg-danger/5 px-6 py-12 text-center"
    >
      <TriangleAlert className="size-8 text-danger" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-foreground">Something went wrong</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-text-2">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-danger/40 hover:border-danger/70">
          <RotateCcw className="size-3.5" aria-hidden /> Try again
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <div className="rounded-xl border border-border bg-elevated p-3">
        <Inbox className="size-6 text-text-3" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {hint ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-text-2">{hint}</p> : null}
      </div>
      {action ? (
        <Button size="sm" onClick={action.onClick} className="glow-primary glow-primary-hover">
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}

/* ---------- safety / trust ---------- */

export const MEDICAL_DISCLAIMER =
  'DiagnoraX AI provides health information, not medical advice. It is not a substitute for professional diagnosis or treatment. In an emergency, contact your local emergency services immediately.'

export function DisclaimerNote({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border border-border bg-muted/40 text-text-2',
        compact ? 'px-3 py-2 text-[11px] leading-relaxed' : 'px-4 py-3 text-xs leading-relaxed',
        className
      )}
    >
      <Info className={cn('mt-0.5 shrink-0 text-neon/80', compact ? 'size-3' : 'size-3.5')} aria-hidden />
      <span>{MEDICAL_DISCLAIMER}</span>
    </p>
  )
}

export function TrustRow({ className }: { className?: string }) {
  const items = ['Informational only', 'Not a medical device', 'Data stays local']
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-2', className)}>
      {items.map((t) => (
        <li key={t} className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-neon/80" aria-hidden />
          {t}
        </li>
      ))}
    </ul>
  )
}

export function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null
  return (
    <p role="alert" className="mt-1.5 text-xs text-danger">
      {msg}
    </p>
  )
}
