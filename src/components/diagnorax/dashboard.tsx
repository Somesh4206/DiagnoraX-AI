'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  FileHeart,
  Plus,
  Scale,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ApiError, api, type HealthRecordItem } from './api'
import {
  DisclaimerNote,
  RECORD_TYPE_META,
  EmptyState,
  ErrorState,
  LoadingState,
  UrgencyBadge,
  ViewHeader,
  relTime,
  type UrgencyLevel,
  type View,
} from './ui-bits'

export function DashboardView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [records, setRecords] = useState<HealthRecordItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await api.listRecords({ limit: 100 })
      setRecords(res.records)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your history.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    const list = records ?? []
    const body = list.filter((r) => r.type === 'BODY_ANALYSIS')
    const symptoms = list.filter((r) => r.type === 'SYMPTOM_CHECK')
    const latestBody = body[0] ?? null
    const latestBmi = latestBody?.data?.result?.bmi ?? null
    const latestCategory = latestBody?.data?.result?.category ?? null
    const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
    const thisWeek = list.filter((r) => new Date(r.createdAt).getTime() > weekAgo).length
    return { total: list.length, symptomCount: symptoms.length, latestBmi, latestCategory, thisWeek }
  }, [records])

  const bmiTrend = useMemo(() => {
    const body = (records ?? [])
      .filter((r) => r.type === 'BODY_ANALYSIS' && typeof r.data?.result?.bmi === 'number')
      .map((r) => ({
        label: relTime(r.createdAt),
        bmi: r.data.result.bmi as number,
        sortKey: new Date(r.createdAt).getTime(),
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
    return body
  }, [records])

  const recent = (records ?? []).slice(0, 5)

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 5) return 'Up late'
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  )

  if (error && !records) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ViewHeader title="Health Dashboard" />
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => void load()} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ViewHeader
        title={`${greeting} 👋`}
        sub="Here's what your local health data says today."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs text-text-2">
            <CalendarCheck className="size-3.5 text-neon/80" aria-hidden />
            {today}
          </span>
        }
      />

      {records === null ? (
        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="neon-card p-5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-3 h-7 w-16" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      ) : records.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-10"
        >
          <div className="neon-card px-6 py-12 text-center">
            <EmptyState
              title="Your dashboard is waiting"
              hint="Run your first AI symptom check or body analysis — everything you log appears here as trends and recent activity."
              action={{ label: 'Run your first check', onClick: () => onNavigate('symptoms') }}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* stats */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard
              icon={FileHeart}
              label="Total analyses"
              value={String(stats.total)}
              sub="all time"
            />
            <StatCard
              icon={Stethoscope}
              label="Symptom checks"
              value={String(stats.symptomCount)}
              sub="AI-assisted"
            />
            <StatCard
              icon={Scale}
              label="Latest BMI"
              value={stats.latestBmi !== null ? stats.latestBmi.toFixed(1) : '—'}
              sub={stats.latestCategory ?? 'not logged yet'}
            />
            <StatCard
              icon={CalendarCheck}
              label="This week"
              value={String(stats.thisWeek)}
              sub="records added"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[7fr_5fr]">
            {/* left column */}
            <div className="space-y-6">
              {/* BMI trend */}
              <div className="neon-card neon-inset p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-text-3">
                    BMI trend
                  </h2>
                  {bmiTrend.length >= 2 ? (
                    <span className="text-xs text-text-3">
                      last {bmiTrend.length} analyses
                    </span>
                  ) : null}
                </div>
                {bmiTrend.length >= 2 ? (
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bmiTrend} margin={{ top: 8, right: 10, bottom: 0, left: -18 }}>
                        <CartesianGrid stroke="#1c3529" strokeDasharray="3 4" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#607369', fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: '#1c3529' }}
                        />
                        <YAxis
                          domain={['dataMin - 2', 'dataMax + 2']}
                          tick={{ fill: '#607369', fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#0d1712',
                            border: '1px solid #1c3529',
                            borderRadius: 10,
                            fontSize: 12,
                          }}
                          labelStyle={{ color: '#91a79b' }}
                          itemStyle={{ color: '#00ffa3' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="bmi"
                          stroke="#00ffa3"
                          strokeWidth={2.5}
                          dot={{ fill: '#0d1712', stroke: '#00ffa3', r: 3.5, strokeWidth: 2 }}
                          activeDot={{ r: 5, fill: '#00ffa3' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-sm text-text-2">
                      Log at least two body analyses to unlock the trend chart.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4"
                      onClick={() => onNavigate('body')}
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Log a body analysis
                    </Button>
                  </div>
                )}
              </div>

              {/* recent activity */}
              <div className="neon-card neon-inset p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-text-3">
                    Recent activity
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate('history')}
                    className="h-7 gap-1 px-2 text-xs text-neon hover:bg-neon/10 hover:text-neon"
                  >
                    Full history
                    <ArrowRight className="size-3" aria-hidden />
                  </Button>
                </div>
                {recent.length === 0 ? (
                  <LoadingState label="Nothing here yet." />
                ) : (
                  <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1 scrollbar-neon">
                    {recent.map((r) => {
                      const meta = RECORD_TYPE_META[r.type]
                      return (
                        <li key={r.id}>
                          <button
                            onClick={() => onNavigate('history')}
                            className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-elevated/30 p-3 text-left transition-colors hover:border-neon/40"
                          >
                            <span className="rounded-lg border border-neon/25 bg-neon/10 p-2">
                              <meta.icon className="size-4 text-neon" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {r.title}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-text-3">
                                {meta.label} · {relTime(r.createdAt)}
                              </span>
                            </span>
                            {r.type === 'SYMPTOM_CHECK' && r.severity ? (
                              <UrgencyBadge
                                level={(r.severity as UrgencyLevel) ?? 'routine'}
                                className="hidden sm:inline-flex"
                              />
                            ) : r.severity ? (
                              <span className="hidden rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] text-text-2 sm:inline-flex">
                                {r.severity}
                              </span>
                            ) : null}
                            <ChevronRight className="size-4 shrink-0 text-text-3" aria-hidden />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* right column */}
            <div className="space-y-6">
              <div className="neon-card neon-inset p-5">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-3">
                  Quick actions
                </h2>
                <div className="mt-4 space-y-2.5">
                  {[
                    {
                      icon: Stethoscope,
                      label: 'New symptom check',
                      desc: 'AI-assisted, under a minute',
                      view: 'symptoms' as View,
                    },
                    {
                      icon: Scale,
                      label: 'Calculate BMI',
                      desc: 'Deterministic, instant',
                      view: 'body' as View,
                    },
                    {
                      icon: FileHeart,
                      label: 'Browse full history',
                      desc: 'Search, review, delete',
                      view: 'history' as View,
                    },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={() => onNavigate(a.view)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-elevated/30 p-3.5 text-left transition-all hover:border-neon/40 hover:shadow-[0_0_18px_rgba(0,255,163,.08)]"
                    >
                      <span className="rounded-lg border border-neon/25 bg-neon/10 p-2">
                        <a.icon className="size-4 text-neon" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{a.label}</span>
                        <span className="block text-[11px] text-text-3">{a.desc}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-text-3" aria-hidden />
                    </button>
                  ))}
                </div>
              </div>

              <div className="neon-card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-3">
                  Safety first
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-text-2">
                  In an emergency, call your local emergency services before anything else. This
                  dashboard is information, not a diagnosis.
                </p>
                <DisclaimerNote compact className="mt-4" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Stethoscope
  label: string
  value: string
  sub: string
}) {
  return (
    <div className={cn('neon-card neon-card-hover p-4 sm:p-5')}>
      <div className="flex items-center gap-2.5">
        <span className="rounded-lg border border-neon/25 bg-neon/10 p-1.5">
          <Icon className="size-4 text-neon" aria-hidden />
        </span>
        <p className="text-xs text-text-2">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold leading-none sm:text-3xl">{value}</p>
      <p className="mt-1.5 text-[11px] text-text-3">{sub}</p>
    </div>
  )
}
