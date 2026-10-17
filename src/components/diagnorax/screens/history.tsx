'use client'

/* DiagnoraX AI — History screen (timeline of saved checks) */

import * as React from 'react'
import {
  ChevronDown,
  ClipboardList,
  HeartPulse,
  Search,
  SearchX,
  Trash2,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { api, ApiError, type HealthRecordItem } from '../api'
import type { TabId } from '../tab-bar'
import {
  Chip,
  clockTime,
  dayGroupLabel,
  EmptyState,
  IconBadge,
  ScreenSection,
  SelectChips,
  timeAgo,
  urgencyMeta,
  bodyCategoryTone,
} from '../ui-bits'
import type { ToastTone } from '../app'

type Filter = 'ALL' | 'SYMPTOM_CHECK' | 'BODY_ANALYSIS'
const FILTERS = ['All', 'Symptoms', 'Body'] as const

export function HistoryScreen({
  records,
  loading,
  go,
  notify,
  onRefresh,
}: {
  records: HealthRecordItem[]
  loading: boolean
  go: (tab: TabId) => void
  notify: (message: string, tone?: ToastTone) => void
  onRefresh: () => void
}) {
  const [query, setQuery] = React.useState('')
  const [debounced, setDebounced] = React.useState('')
  const [filter, setFilter] = React.useState<Filter>('ALL')
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<HealthRecordItem | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim().toLowerCase()), 220)
    return () => clearTimeout(id)
  }, [query])

  const filtered = React.useMemo(() => {
    return records.filter((r) => {
      if (filter !== 'ALL' && r.type !== filter) return false
      if (debounced) {
        const hay = `${r.title} ${r.summary}`.toLowerCase()
        if (!hay.includes(debounced)) return false
      }
      return true
    })
  }, [records, filter, debounced])

  const groups = React.useMemo(() => {
    const map = new Map<string, HealthRecordItem[]>()
    for (const r of filtered) {
      const key = dayGroupLabel(r.createdAt)
      const arr = map.get(key) ?? []
      arr.push(r)
      map.set(key, arr)
    }
    return [...map.entries()]
  }, [filtered])

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await api.deleteRecord(pendingDelete.id)
      notify('Record deleted.')
      onRefresh()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Delete failed. Try again.', 'error')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  const hasFilters = filter !== 'ALL' || debounced.length > 0

  return (
    <div className="flex flex-col gap-4 pt-4">
      {/* Search + filters */}
      <ScreenSection className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your checks…"
            aria-label="Search history"
            className="h-11 rounded-full pl-10 pr-4"
          />
        </div>
        <SelectChips
          options={[...FILTERS]}
          value={FILTERS[filter === 'ALL' ? 0 : filter === 'SYMPTOM_CHECK' ? 1 : 2]}
          onChange={(label) => {
            if (label === 'All') setFilter('ALL')
            else if (label === 'Symptoms') setFilter('SYMPTOM_CHECK')
            else setFilter('BODY_ANALYSIS')
          }}
        />
      </ScreenSection>

      {/* List */}
      {loading ? (
        <ScreenSection>
          <div className="app-card divide-y divide-border/60">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </ScreenSection>
      ) : filtered.length === 0 ? (
        <ScreenSection>
          <div className="app-card">
            {hasFilters ? (
              <EmptyState
                icon={SearchX}
                title="Nothing matches"
                hint="No saved checks match your search or filter."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setFilter('ALL')
                    }}
                    className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground active:scale-95 transition-transform"
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No history yet"
                hint="Everything you check is saved here — privately, on your device."
                action={
                  <button
                    type="button"
                    onClick={() => go('check')}
                    className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground active:scale-95 transition-transform"
                  >
                    Run a check
                  </button>
                }
              />
            )}
          </div>
        </ScreenSection>
      ) : (
        groups.map(([day, items]) => (
          <ScreenSection key={day}>
            <p className="sticky top-0 z-10 bg-background/90 py-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur">
              {day}
            </p>
            <div className="app-card divide-y divide-border/60">
              {items.map((r) => (
                <Collapsible
                  key={r.id}
                  open={expandedId === r.id}
                  onOpenChange={(open) => setExpandedId(open ? r.id : null)}
                >
                  <CollapsibleTrigger className="w-full px-4 py-3.5 text-left outline-none focus-visible:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {r.type === 'SYMPTOM_CHECK' ? (
                        <IconBadge icon={ClipboardList} tone="emerald" />
                      ) : (
                        <IconBadge icon={HeartPulse} tone="amber" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold leading-tight">{r.title}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {timeAgo(r.createdAt)} · {clockTime(r.createdAt)}
                        </p>
                      </div>
                      {r.type === 'SYMPTOM_CHECK' && r.severity ? (
                        <Chip className={cn('hidden shrink-0 xs:inline-flex', urgencyMeta(r.severity).chip)}>
                          {urgencyMeta(r.severity).label}
                        </Chip>
                      ) : r.severity ? (
                        <Chip className="hidden shrink-0 sm:inline-flex">{r.severity}</Chip>
                      ) : null}
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border/60 bg-muted/30 px-4 py-3">
                      <p className="text-[13px] leading-relaxed text-foreground/85">{r.summary}</p>

                      {/* Symptom details */}
                      {r.type === 'SYMPTOM_CHECK' && r.data?.analysis && (
                        <div className="mt-3 flex flex-col gap-2">
                          {r.data.analysis.possibleConditions.slice(0, 3).map((c) => (
                            <div key={c.name} className="flex items-center gap-2 text-[12.5px]">
                              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground">· {c.likelihood}</span>
                            </div>
                          ))}
                          {r.data.engine === 'emergency-triage' && (
                            <p className="mt-1 text-[11px] font-semibold text-destructive">
                              Emergency triage applied (no AI involved)
                            </p>
                          )}
                        </div>
                      )}

                      {/* Body details */}
                      {r.type === 'BODY_ANALYSIS' && r.data?.result && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-card p-2.5 text-center">
                            <p className="text-[17px] font-extrabold tabular-nums leading-none">
                              {r.data.result.bmi.toFixed(1)}
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-muted-foreground">BMI</p>
                          </div>
                          <div className="rounded-xl bg-card p-2.5 text-center">
                            <p className="text-[13px] font-bold leading-tight">{r.data.result.category}</p>
                            <p className="mt-1 text-[10px] font-medium text-muted-foreground">Category</p>
                          </div>
                          <div className="rounded-xl bg-card p-2.5 text-center">
                            <p className="text-[13px] font-bold leading-tight tabular-nums">
                              {r.data.result.healthyWeight.min}–{r.data.result.healthyWeight.max}
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-muted-foreground">Healthy kg</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        {r.type === 'BODY_ANALYSIS' && r.severity ? (
                          <Chip className={bodyCategoryTone(r.severity)}>{r.severity}</Chip>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() => setPendingDelete(r)}
                          className="flex items-center gap-1.5 rounded-full border border-destructive/25 px-3.5 py-1.5 text-[12.5px] font-semibold text-destructive active:scale-95 transition-transform"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScreenSection>
        ))
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2.5rem)] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” will be removed permanently. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1 rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              disabled={deleting}
              className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
