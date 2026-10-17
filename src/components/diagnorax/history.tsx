'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Search, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ApiError, api, type HealthRecordItem, type HealthRecordType } from './api'
import {
  DisclaimerNote,
  RECORD_TYPE_META,
  EmptyState,
  ErrorState,
  LoadingState,
  UrgencyBadge,
  ViewHeader,
  fmtDate,
  relTime,
  type UrgencyLevel,
  type View,
} from './ui-bits'

type Tab = 'all' | HealthRecordType

export function HistoryView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { toast } = useToast()
  const [records, setRecords] = useState<HealthRecordItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await api.listRecords({
        q: q.trim() || undefined,
        type: tab === 'all' ? undefined : tab,
        limit: 200,
      })
      setRecords(res.records)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your history.')
    }
  }, [q, tab])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 300) // debounce search
    return () => window.clearTimeout(t)
  }, [load])

  const confirmDelete = async () => {
    if (!deleteId || deleting) return
    setDeleting(true)
    try {
      await api.deleteRecord(deleteId)
      setRecords((prev) => (prev ? prev.filter((r) => r.id !== deleteId) : prev))
      toast({ title: 'Record deleted', description: 'Removed from your local database.' })
      setDeleteId(null)
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof ApiError ? e.message : 'Unexpected error.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const list = records ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ViewHeader
        title="Health History"
        sub="Every analysis, saved locally. Search it, expand it, delete it — it's yours."
        right={
          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-text-2">
            {records === null ? '…' : `${list.length} record${list.length === 1 ? '' : 's'}`}
          </span>
        }
      />

      <div className="mt-8 space-y-4">
        {/* controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="SYMPTOM_CHECK">Symptom checks</TabsTrigger>
              <TabsTrigger value="BODY_ANALYSIS">Body analyses</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles and summaries…"
              className="pl-9"
              aria-label="Search history"
            />
          </div>
        </div>

        {/* list */}
        {records === null && error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : records === null ? (
          <div className="neon-card p-5">
            <LoadingState label="Loading your history…" />
          </div>
        ) : list.length === 0 ? (
          <div className="neon-card px-6 py-10">
            <EmptyState
              title={q ? 'No matches' : 'No records yet'}
              hint={
                q
                  ? 'Try a different search term, or clear the search.'
                  : 'Run your first AI symptom check or body analysis — it will appear here automatically.'
              }
              action={
                q
                  ? { label: 'Clear search', onClick: () => setQ('') }
                  : { label: 'Run your first check', onClick: () => onNavigate('symptoms') }
              }
            />
          </div>
        ) : (
          <ul className="max-h-[32rem] space-y-3 overflow-y-auto pr-1 scrollbar-neon">
            {list.map((r, i) => {
              const meta = RECORD_TYPE_META[r.type]
              return (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
                >
                  <div className="neon-card neon-inset p-4">
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg border border-neon/25 bg-neon/10 p-2">
                        <meta.icon className="size-4 text-neon" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{r.title}</p>
                        <p className="mt-0.5 text-[11px] text-text-3">
                          {meta.label} · {fmtDate(r.createdAt)} · {relTime(r.createdAt)}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-text-2 line-clamp-2-fix">
                          {r.summary}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {r.type === 'SYMPTOM_CHECK' && r.severity ? (
                          <UrgencyBadge level={(r.severity as UrgencyLevel) ?? 'routine'} />
                        ) : r.severity ? (
                          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] text-text-2">
                            {r.severity}
                          </span>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete record: ${r.title}`}
                          onClick={() => setDeleteId(r.id)}
                          className="size-8 text-text-3 hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </div>

                    <RecordDetails record={r} />
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}

        <DisclaimerNote compact />
      </div>

      {/* delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="size-5 text-danger" aria-hidden />
              Delete this record?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes it from your local database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              className="bg-danger text-destructive-foreground hover:bg-danger/90"
            >
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ---------- expandable details ---------- */

function RecordDetails({ record }: { record: HealthRecordItem }) {
  const [open, setOpen] = useState(false)
  const a = record.data?.analysis
  const b = record.data?.result

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="mt-3 border-t border-border/60 pt-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-neon hover:bg-neon/10 hover:text-neon">
            {open ? 'Hide details' : 'Details'}
            <ChevronDown
              className={cn('size-3.5 transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 p-4 text-xs leading-relaxed">
            {record.type === 'SYMPTOM_CHECK' && a ? (
              <div className="space-y-3">
                {a.summary ? <p className="text-foreground/90">{a.summary}</p> : null}
                {a.possibleConditions?.length ? (
                  <div>
                    <p className="mb-1.5 font-semibold uppercase tracking-wider text-text-3">
                      Commonly reported possibilities
                    </p>
                    <ul className="space-y-1.5">
                      {a.possibleConditions.map((c, i) => (
                        <li key={i} className="flex flex-wrap items-baseline gap-2">
                          <span className="text-foreground/90">{c.name}</span>
                          <span className="text-text-3">— {c.likelihood}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {a.redFlags?.length ? (
                  <div>
                    <p className="mb-1.5 font-semibold uppercase tracking-wider text-warn">
                      Red flags
                    </p>
                    <ul className="space-y-1 text-text-2">
                      {a.redFlags.map((f, i) => (
                        <li key={i}>· {f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {a.whenToSeekHelp ? (
                  <p className="text-text-2">
                    <span className="font-semibold text-foreground/90">When to seek help: </span>
                    {a.whenToSeekHelp}
                  </p>
                ) : null}
              </div>
            ) : record.type === 'BODY_ANALYSIS' && b ? (
              <div className="space-y-3">
                <p className="text-foreground/90">
                  BMI <span className="font-semibold text-neon">{b.bmi.toFixed(1)}</span> ·{' '}
                  {b.category} · healthy range for this height:{' '}
                  {b.healthyWeight.min}–{b.healthyWeight.max} kg
                </p>
                {b.recommendations?.length ? (
                  <ul className="space-y-1.5 text-text-2">
                    {b.recommendations.map((rec, i) => (
                      <li key={i}>· {rec}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-text-3">No structured data available for this record.</p>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-[11px] text-text-3 hover:text-text-2">
                Raw record (JSON)
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md bg-background/70 p-3 font-mono text-[10px] leading-relaxed text-text-3 scrollbar-neon">
                {JSON.stringify(record.data, null, 2)}
              </pre>
            </details>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
