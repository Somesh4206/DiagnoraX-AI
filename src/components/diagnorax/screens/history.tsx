'use client'

/* DiagnoraX AI — History screen (fresh rebuild):
 * debounced search, type filter chips, day-grouped timeline, expandable
 * details and per-record delete. */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  History as HistoryIcon,
  Scale,
  Search,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { api, recordData, type HealthRecordItem } from '../api'
import { useApp } from '../app'
import { EmptyState, URGENCY, UrgencyBadge, dayKey, fmtDateTime, relTime } from '../ui'
import type { UrgencyLevel } from '../api'

type Filter = 'all' | 'SYMPTOM_CHECK' | 'BODY_ANALYSIS'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'SYMPTOM_CHECK', label: 'Symptom checks' },
  { key: 'BODY_ANALYSIS', label: 'Body analyses' },
]

function RecordRow({
  record,
  onDeleted,
}: {
  record: HealthRecordItem
  onDeleted: (id: string) => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeletinging] = useState(false)

  const data = recordData(record)
  const urgency = record.type === 'SYMPTOM_CHECK' && record.severity
    ? (record.severity as UrgencyLevel)
    : null

  async function del() {
    setDeletinging(true)
    try {
      await api.deleteRecord(record.id)
      onDeleted(record.id)
      toast({ title: 'Deleted', description: 'The record was removed from your history.' })
    } catch {
      toast({ title: 'Could not delete', description: 'Please try again.', variant: 'destructive' })
      setDeletinging(false)
      setConfirmOpen(false)
    }
  }

  return (
    <li className="neon-card overflow-hidden rounded-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated',
            record.type === 'SYMPTOM_CHECK' ? 'text-cyan' : 'text-neon'
          )}
        >
          {record.type === 'SYMPTOM_CHECK' ? (
            <Stethoscope className="size-4" aria-hidden />
          ) : (
            <Scale className="size-4" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium leading-tight">
            {record.title}
          </span>
          <span className="mt-0.5 block text-[11px] text-text-3">
            {fmtDateTime(record.createdAt)} · {relTime(record.createdAt)}
          </span>
        </span>
        {urgency ? <UrgencyBadge level={urgency} className="hidden xs:inline-flex" /> : null}
        <ChevronDown
          className={cn('size-4 shrink-0 text-text-3 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3.5 border-t border-border/60 px-4 pb-4 pt-3.5">
              {urgency ? (
                <p className="text-[12px] text-text-2">
                  <span className="font-semibold text-foreground">Urgency:</span>{' '}
                  {URGENCY[urgency].label}
                </p>
              ) : null}
              <p className="text-[12.5px] leading-relaxed text-text-2">{record.summary}</p>

              {data.analysis ? (
                <>
                  {data.analysis.selfCare.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-3">
                        Self-care
                      </p>
                      <ul className="mt-1.5 flex flex-col gap-1.5">
                        {data.analysis.selfCare.slice(0, 4).map((s, i) => (
                          <li key={i} className="text-[12px] leading-snug text-text-2">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {data.analysis.redFlags.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-danger/80">
                        Red flags
                      </p>
                      <ul className="mt-1.5 flex flex-col gap-1.5">
                        {data.analysis.redFlags.slice(0, 4).map((s, i) => (
                          <li key={i} className="text-[12px] leading-snug text-text-2">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {data.result ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-border/70 bg-secondary/40 p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-text-3">BMI</p>
                    <p className="mt-0.5 text-[15px] font-bold tabular-nums">{data.result.bmi.toFixed(1)}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-secondary/40 p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-text-3">Healthy</p>
                    <p className="mt-0.5 text-[12px] font-semibold leading-tight">
                      {data.result.healthyRangeKg.min}–{data.result.healthyRangeKg.max} kg
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-secondary/40 p-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-text-3">Category</p>
                    <p className="mt-0.5 text-[12px] font-semibold leading-tight">
                      {data.result.category}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-1.5 text-[11.5px] font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  <Trash2 className="size-3.5" aria-hidden /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[340px] border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              “{record.title.slice(0, 80)}
              {record.title.length > 80 ? '…' : ''}” will be removed permanently. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1 border-border bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void del()
              }}
              disabled={deleting}
              className="flex-1 bg-danger text-destructive-foreground hover:bg-danger/85"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

export function HistoryScreen() {
  const { records, recordsLoading, refreshRecords } = useApp()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 250)
    return () => clearTimeout(t)
  }, [query])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filter !== 'all' && r.type !== filter) return false
      if (debounced) {
        const hay = `${r.title} ${r.summary}`.toLowerCase()
        if (!hay.includes(debounced)) return false
      }
      return true
    })
  }, [records, filter, debounced])

  const groups = useMemo(() => {
    const map = new Map<string, HealthRecordItem[]>()
    for (const r of filtered) {
      const k = dayKey(r.createdAt)
      const arr = map.get(k) ?? []
      arr.push(r)
      map.set(k, arr)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 pt-5">
      {/* header */}
      <div>
        <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl border border-neon/30 bg-neon/10">
            <HistoryIcon className="size-4.5 text-neon" aria-hidden />
          </span>
          History
        </h1>
        <p className="mt-1.5 text-[13px] leading-snug text-text-2">
          Every check is saved locally. Search, review or delete — your data never leaves this
          device.
        </p>
      </div>

      {/* search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-3"
          aria-hidden
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your history…"
          aria-label="Search history"
          className="h-12 w-full rounded-xl border border-input bg-secondary/60 pl-10 pr-10 text-[14px] outline-none transition-colors placeholder:text-text-3 focus:border-neon/50 focus:ring-2 focus:ring-neon/20"
        />
        {query ? (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-3 hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* filter chips */}
      <div className="flex gap-2" role="group" aria-label="Filter by type">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors',
                active
                  ? 'border-neon/60 bg-neon/15 text-neon shadow-[0_0_12px_rgba(0,255,163,.15)]'
                  : 'border-border bg-transparent text-text-2 hover:border-neon/30'
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* list */}
      {recordsLoading ? (
        <div className="flex flex-col gap-3">
          <div className="neon-card h-16 animate-pulse rounded-2xl" />
          <div className="neon-card h-16 animate-pulse rounded-2xl" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title={debounced || filter !== 'all' ? 'No matching records' : 'Your history is empty'}
          hint={
            debounced || filter !== 'all'
              ? 'Try a different search or filter.'
              : 'Run a symptom check or body analysis and it will appear here.'
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([day, items]) => (
            <section key={day} className="flex flex-col gap-2.5">
              <p className="sticky top-14 z-10 -mx-1 bg-background/85 px-1 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-3 backdrop-blur-sm">
                {day}
              </p>
              <ul className="flex flex-col gap-2.5">
                {items.map((r) => (
                  <RecordRow
                    key={r.id}
                    record={r}
                    onDeleted={() => {
                      void refreshRecords()
                    }}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="pb-2 text-center text-[10.5px] text-text-3">
        {filtered.length} record{filtered.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}
