'use client'

/* DiagnoraX AI — Body Analysis screen (fresh rebuild):
 * height/weight → deterministic BMI, category scale, healthy weight range,
 * formula transparency and honest caveats. Never an AI guess. */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, CheckCircle2, Info, Scale, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api, ApiError, type BodyResult } from '../api'
import { useApp } from '../app'
import { SectionTitle, relTime } from '../ui'

/* ---------- BMI scale bar ---------- */

const SCALE = [
  { until: 18.5, label: 'Under', cls: 'bg-warn/30' },
  { until: 25, label: 'Normal', cls: 'bg-neon/50' },
  { until: 30, label: 'Over', cls: 'bg-warn/40' },
  { until: 35, label: 'Ob I', cls: 'bg-danger/35' },
  { until: 40, label: 'Ob II', cls: 'bg-danger/50' },
  { until: Infinity, label: 'Ob III', cls: 'bg-danger/70' },
]

function bmiToPct(bmi: number): number {
  return Math.max(0, Math.min(100, ((bmi - 12) / (45 - 12)) * 100))
}

function BmiScale({ bmi, tone }: { bmi: number; tone: BodyResult['tone'] }) {
  const pct = bmiToPct(bmi)
  return (
    <div className="flex flex-col gap-2" aria-label="BMI scale">
      <div className="relative h-3.5 w-full overflow-hidden rounded-full border border-border/70">
        <div className="flex h-full w-full">
          {SCALE.map((s, i) => (
            <div
              key={s.label}
              className={cn('h-full', s.cls)}
              style={{ width: `${bmiToPct(s.until) - bmiToPct(i === 0 ? 12 : SCALE[i - 1].until)}%` }}
            />
          ))}
        </div>
        <motion.div
          initial={{ left: '50%', opacity: 0 }}
          animate={{ left: `${pct}%`, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className={cn(
            'absolute top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg',
            tone === 'ok'
              ? 'border-neon bg-neon/40 shadow-[0_0_12px_rgba(0,255,163,.7)]'
              : tone === 'warn'
                ? 'border-warn bg-warn/40 shadow-[0_0_12px_rgba(255,191,71,.7)]'
                : 'border-danger bg-danger/40 shadow-[0_0_12px_rgba(255,77,109,.7)]'
          )}
          aria-hidden
        />
      </div>
      <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider text-text-3">
        <span>12</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>40</span>
      </div>
    </div>
  )
}

/* ---------- screen ---------- */

export function BodyScreen() {
  const { records, refreshRecords } = useApp()
  const { toast } = useToast()

  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BodyResult | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const valid =
    Number(height) >= 80 && Number(height) <= 250 && Number(weight) >= 25 && Number(weight) <= 300

  const lastBody = records.find((r) => r.type === 'BODY_ANALYSIS')

  async function calculate() {
    if (!valid || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.analyzeBody({ heightCm: Number(height), weightKg: Number(weight) })
      setResult(res.result)
      setSavedAt(res.savedAt)
      await refreshRecords()
      toast({ title: 'Analysis saved', description: 'Added to your history.' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-5">
      {/* header */}
      <div>
        <h1 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl border border-neon/30 bg-neon/10">
            <Scale className="size-4.5 text-neon" aria-hidden />
          </span>
          Body Analysis
        </h1>
        <p className="mt-1.5 text-[13px] leading-snug text-text-2">
          BMI with a healthy weight range — deterministic arithmetic, no AI involved.
        </p>
      </div>

      {/* form */}
      <section className="neon-card flex flex-col gap-5 rounded-2xl p-5" aria-label="Body form">
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="175"
              className="border-input bg-secondary/60 placeholder:text-text-3"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
              className="border-input bg-secondary/60 placeholder:text-text-3"
            />
          </div>
        </div>

        <Button
          onClick={calculate}
          disabled={!valid || loading}
          className="glow-primary glow-primary-hover h-12 w-full rounded-xl bg-neon text-[15px] font-bold text-primary-foreground hover:bg-neon-dim disabled:opacity-40"
        >
          {loading ? 'Calculating…' : 'Calculate BMI'}
        </Button>

        <p className="text-center text-[10.5px] leading-relaxed text-text-3">
          For adults only. BMI is a screening number, not a measure of health or body composition.
        </p>
      </section>

      {/* error */}
      {error ? (
        <div role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-danger">
            <TriangleAlert className="size-4 shrink-0" aria-hidden /> {error}
          </p>
        </div>
      ) : null}

      {/* result */}
      {result ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
          aria-label="BMI result"
        >
          <div className="neon-card flex flex-col items-center gap-1 rounded-2xl p-6">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-text-3">
              Your BMI
            </p>
            <p
              className={cn(
                'text-5xl font-bold tabular-nums',
                result.tone === 'ok'
                  ? 'text-neon text-glow'
                  : result.tone === 'warn'
                    ? 'text-warn'
                    : 'text-danger'
              )}
            >
              {result.bmi.toFixed(1)}
            </p>
            <p
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
                result.tone === 'ok'
                  ? 'border-neon/50 bg-neon/10 text-neon'
                  : result.tone === 'warn'
                    ? 'border-warn/50 bg-warn/10 text-warn'
                    : 'border-danger/50 bg-danger/10 text-danger'
              )}
            >
              {result.category}
            </p>
            <div className="mt-4 w-full">
              <BmiScale bmi={result.bmi} tone={result.tone} />
            </div>
          </div>

          {/* healthy range */}
          <div className="neon-card rounded-2xl p-4">
            <SectionTitle icon={Calculator}>Healthy weight range</SectionTitle>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-2">
              For your height, a healthy weight is{' '}
              <span className="font-bold text-neon">
                {result.healthyRangeKg.min}–{result.healthyRangeKg.max} kg
              </span>
              .
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-text-3">
              You are {Math.abs(result.deltaToMid).toFixed(1)} BMI points{' '}
              {result.deltaToMid > 0 ? 'above' : 'below'} the middle of the healthy band.
            </p>
          </div>

          {/* formula */}
          <div className="neon-card rounded-2xl p-4">
            <SectionTitle icon={Info}>How this is calculated</SectionTitle>
            <code className="mt-2.5 block rounded-xl border border-border/70 bg-secondary/60 px-3.5 py-2.5 text-center text-[13px] font-mono text-cyan">
              {result.formula}
            </code>
          </div>

          {/* recommendations */}
          <div className="neon-card rounded-2xl p-4">
            <SectionTitle icon={CheckCircle2}>What you can do</SectionTitle>
            <ul className="mt-3 flex flex-col gap-2.5">
              {result.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-text-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* caveats */}
          <div className="rounded-2xl border border-warn/30 bg-warn/5 p-4">
            <SectionTitle icon={TriangleAlert}>Honest caveats</SectionTitle>
            <ul className="mt-3 flex flex-col gap-2.5">
              {result.caveats.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-text-2">
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-warn" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {savedAt ? (
            <p className="text-center text-[10.5px] text-text-3">
              Saved to history · {relTime(savedAt)}
            </p>
          ) : null}
        </motion.section>
      ) : null}

      {/* last analysis hint */}
      {!result && lastBody ? (
        <p className="text-center text-[11px] text-text-3">
          Last analysis: {lastBody.title} · {relTime(lastBody.createdAt)}
        </p>
      ) : null}
    </div>
  )
}
