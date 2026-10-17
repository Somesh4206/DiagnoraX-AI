'use client'

/* DiagnoraX AI — shared mobile app widgets */

import * as React from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  Siren,
  AlarmClock,
  Stethoscope,
  Leaf,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UrgencyLevel } from './api'

/* ---------- urgency + category metadata ---------- */

export const URGENCY_META: Record<
  UrgencyLevel,
  { label: string; icon: LucideIcon; chip: string; banner: string }
> = {
  emergency: {
    label: 'Emergency',
    icon: Siren,
    chip: 'bg-destructive/12 text-destructive border-destructive/25',
    banner: 'bg-destructive/8 border-destructive/30',
  },
  urgent: {
    label: 'See a doctor soon',
    icon: AlarmClock,
    chip: 'bg-warning/15 text-amber-700 dark:text-amber-400 border-warning/40',
    banner: 'bg-warning/10 border-warning/40',
  },
  routine: {
    label: 'Routine care',
    icon: Stethoscope,
    chip: 'bg-primary/10 text-primary border-primary/25',
    banner: 'bg-primary/8 border-primary/25',
  },
  low: {
    label: 'Self-care likely fine',
    icon: Leaf,
    chip: 'bg-teal-accent/12 text-teal-accent border-teal-accent/30',
    banner: 'bg-teal-accent/8 border-teal-accent/25',
  },
}

export function urgencyMeta(level: string) {
  return URGENCY_META[level as UrgencyLevel] ?? URGENCY_META.routine
}

export function bodyCategoryTone(category: string | null | undefined) {
  if (!category) return 'bg-muted text-muted-foreground border-border'
  if (category.startsWith('Normal')) return 'bg-primary/10 text-primary border-primary/25'
  if (category.startsWith('Underweight')) return 'bg-teal-accent/12 text-teal-accent border-teal-accent/30'
  if (category.startsWith('Overweight')) return 'bg-warning/15 text-amber-700 dark:text-amber-400 border-warning/40'
  return 'bg-destructive/12 text-destructive border-destructive/25'
}

/* ---------- chips & badges ---------- */

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function IconBadge({
  icon: Icon,
  tone = 'emerald',
  className,
  iconClassName,
}: {
  icon: LucideIcon
  tone?: 'emerald' | 'amber' | 'red' | 'teal' | 'slate'
  className?: string
  iconClassName?: string
}) {
  const tones: Record<string, string> = {
    emerald: 'bg-primary/12 text-primary',
    amber: 'bg-warning/18 text-amber-700 dark:text-amber-400',
    red: 'bg-destructive/12 text-destructive',
    teal: 'bg-teal-accent/14 text-teal-accent',
    slate: 'bg-muted text-muted-foreground',
  }
  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
        tones[tone],
        className,
      )}
    >
      <Icon className={cn('h-5 w-5', iconClassName)} strokeWidth={2.2} />
    </span>
  )
}

/* ---------- layout helpers ---------- */

export function ScreenSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <section className={cn('px-5', className)}>{children}</section>
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  )
}

export function TapButton({
  children,
  onClick,
  className,
  ariaLabel,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  ariaLabel?: string
  disabled?: boolean
}) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded-2xl disabled:opacity-50',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon
  title: string
  hint: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" strokeWidth={1.8} />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">{hint}</p>
      </div>
      {action}
    </div>
  )
}

export function ListRow({
  icon: Icon,
  iconTone = 'slate',
  title,
  subtitle,
  right,
  onClick,
  href,
  className,
}: {
  icon: LucideIcon
  iconTone?: 'emerald' | 'amber' | 'red' | 'teal' | 'slate'
  title: string
  subtitle?: string
  right?: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
}) {
  const inner = (
    <>
      <IconBadge icon={Icon} tone={iconTone} className="h-9 w-9 rounded-[10px]" iconClassName="h-4 w-4" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {right ?? (onClick && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />)}
    </>
  )
  const cls = cn(
    'flex w-full items-center gap-3 px-4 py-3 text-left',
    className,
  )
  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

/* ---------- segmented control (iOS style) ---------- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1"
    >
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-lg py-2 text-[13px] font-semibold transition-colors',
              active
                ? 'bg-card text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.1)]'
                : 'text-muted-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- selection chips ---------- */

export function SelectChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- time formatting ---------- */

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function dayGroupLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(d, today)) return 'Today'
  if (sameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}
