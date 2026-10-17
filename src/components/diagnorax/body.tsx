'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Info, RotateCcw, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  ApiError,
  api,
  type BodyAnalyzeResponse,
  type CategoryKey,
} from './api'
import {
  DisclaimerNote,
  ErrorState,
  FieldError,
  LoadingState,
  ViewHeader,
  fmtDate,
  relTime,
  type View,
} from './ui-bits'

const CATEGORY_CHIP: Record<CategoryKey, string> = {
  underweight: 'border-cyan/45 bg-cyan/10 text-cyan',
  normal: 'border-neon/45 bg-neon/10 text-neon',
  overweight: 'border-warn/45 bg-warn/10 text-warn',
  obese: 'border-danger/45 bg-danger/10 text-danger',
}

const GAUGE_MIN = 14
const GAUGE_MAX = 40
const pct = (bmi: number) =>
  Math.min(100, Math.max(0, ((bmi - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100))

export function BodyAnalysisView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { toast } = useToast()
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BodyAnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastInput = useRef<{ heightCm: number; weightKg: number } | null>(null)

  const heightNum = Number(height)
  const weightNum = Number(weight)
  const heightErr =
    height.trim() !== '' && (!Number.isFinite(heightNum) || heightNum < 90 || heightNum > 250)
      ? 'Enter a height between 90 and 250 cm.'
      : null
  const weightErr =
    weight.trim() !== '' && (!Number.isFinite(weightNum) || weightNum < 25 || weightNum > 400)
      ? 'Enter a weight between 25 and 400 kg.'
      : null

  const run = async (input: { heightCm: number; weightKg: number }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.analyzeBody(input)
      setResult(res)
      toast({ title: 'BMI calculated', description: 'Saved to your local history.' })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || heightErr || weightErr || !height.trim() || !weight.trim()) return
    const input = { heightCm: heightNum, weightKg: weightNum }
    lastInput.current = input
    setResult(null)
    void run(input)
  }

  const r = result?.result
  const last = lastInput.current

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ViewHeader
        title="Body Analysis"
        sub="BMI with healthy weight ranges — deterministic arithmetic, no AI involved."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[5fr_7fr]">
        {/* ---------- form ---------- */}
        <form onSubmit={onSubmit} className="neon-card neon-inset h-fit p-5 sm:p-6">
          <div className="space-y-5">
            <div>
              <Label htmlFor="height">
                Height <span className="text-text-3">(cm)</span>
              </Label>
              <Input
                id="height"
                type="number"
                inputMode="numeric"
                min={90}
                max={250}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="mt-2"
                aria-invalid={!!heightErr}
              />
              <FieldError msg={heightErr} />
              <p className="mt-1.5 text-[11px] text-text-3">
                5&apos;7&quot; ≈ 170 cm · 6&apos;0&quot; ≈ 183 cm
              </p>
            </div>

            <div>
              <Label htmlFor="weight">
                Weight <span className="text-text-3">(kg)</span>
              </Label>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                min={25}
                max={400}
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65"
                className="mt-2"
                aria-invalid={!!weightErr}
              />
              <FieldError msg={weightErr} />
              <p className="mt-1.5 text-[11px] text-text-3">140 lb ≈ 63.5 kg · 180 lb ≈ 81.6 kg</p>
            </div>

            <Button
              type="submit"
              disabled={loading || !!heightErr || !!weightErr || !height.trim() || !weight.trim()}
              className="glow-primary glow-primary-hover h-11 w-full text-base"
              title="Enter both height and weight to enable calculation."
            >
              {loading ? 'Calculating…' : 'Calculate BMI'}
            </Button>

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-text-3">
              <Info className="mt-0.5 size-3 shrink-0 text-neon/70" aria-hidden />
              For adults only. BMI is a screening number, not a measure of health or body
              composition.
            </p>
          </div>
        </form>

        {/* ---------- result / placeholder ---------- */}
        <section aria-live="polite" className="neon-card neon-inset p-5 sm:p-6">
          {loading ? (
            <LoadingState label="Crunching numbers…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => lastInput.current && void run(lastInput.current)} />
          ) : r && result ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-3">
                    Your BMI
                  </p>
                  <p className="mt-1 text-5xl font-semibold leading-none text-glow">
                    {r.bmi.toFixed(1)}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                    CATEGORY_CHIP[r.categoryKey]
                  )}
                >
                  <Scale className="size-3.5" aria-hidden />
                  {r.category}
                </span>
              </div>

              {/* gauge */}
              <div className="mt-7" aria-hidden>
                <div className="relative">
                  <div className="flex h-2.5 overflow-hidden rounded-full">
                    <div className="bg-cyan/60" style={{ width: '17.31%' }} />
                    <div className="bg-neon/70" style={{ width: '25%' }} />
                    <div className="bg-warn/70" style={{ width: '19.23%' }} />
                    <div className="bg-danger/70" style={{ width: '38.46%' }} />
                  </div>
                  <div
                    className="absolute -bottom-1 h-[calc(100%+8px)] w-[3px] -translate-x-1/2 rounded-full bg-foreground shadow-[0_0_10px_rgba(242,255,248,.9)]"
                    style={{ left: `${pct(r.bmi)}%` }}
                  />
                </div>
                <div className="relative mt-2 h-4 text-[10px] text-text-3">
                  <span className="absolute -translate-x-1/2" style={{ left: '17.31%' }}>
                    18.5
                  </span>
                  <span className="absolute -translate-x-1/2" style={{ left: '42.31%' }}>
                    25
                  </span>
                  <span className="absolute -translate-x-1/2" style={{ left: '61.54%' }}>
                    30
                  </span>
                </div>
              </div>

              {/* healthy range */}
              <div className="mt-6 rounded-lg border border-border/80 bg-elevated/40 p-4">
                <p className="text-sm leading-relaxed">
                  For {last?.heightCm ?? 'your'} cm, a healthy weight is{' '}
                  <span className="font-semibold text-neon">
                    {r.healthyWeight.min}–{r.healthyWeight.max} kg
                  </span>
                  .
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-text-2">
                  You are {Math.abs(r.bmi - 22.1).toFixed(1)} BMI points from the middle of the
                  healthy band.
                </p>
              </div>

              {/* formula transparency */}
              <div className="mt-4 rounded-lg border border-border/80 bg-muted/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm">BMI = weight (kg) ÷ height² (m²)</p>
                  <span className="chip-neon rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                    Deterministic — no AI
                  </span>
                </div>
                {last ? (
                  <p className="mt-2 font-mono text-xs text-text-2">
                    You: {last.weightKg} kg ÷ ({(last.heightCm / 100).toFixed(2)} m)² ={' '}
                    <span className="font-semibold text-neon">{r.bmi.toFixed(1)}</span>
                  </p>
                ) : null}
              </div>

              {/* recommendations */}
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-text-3">
                General pointers
              </h3>
              <ul className="mt-3 space-y-2">
                {r.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon" aria-hidden />
                    {rec}
                  </li>
                ))}
              </ul>

              {/* caveats */}
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-text-3">
                Caveats
              </h3>
              <ul className="mt-3 space-y-1.5">
                {r.caveats.map((c, i) => (
                  <li key={i} className="text-xs leading-relaxed text-text-3">
                    · {c}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-3">
                <span>{fmtDate(result.createdAt)}</span>
                <span>Saved to history {relTime(result.createdAt)}</span>
              </div>

              <DisclaimerNote compact className="mt-6" />

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button variant="outline" onClick={() => setResult(null)}>
                  <RotateCcw className="size-3.5" aria-hidden />
                  Run another
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('history')}
                  className="text-neon hover:bg-neon/10 hover:text-neon"
                >
                  View in history
                </Button>
              </div>
            </motion.div>
          ) : (
            <BodyPlaceholder />
          )}
        </section>
      </div>
    </div>
  )
}

function BodyPlaceholder() {
  return (
    <div>
      <h3 className="text-lg font-semibold">Why BMI?</h3>
      <p className="mt-3 text-sm leading-relaxed text-text-2">
        BMI is a quick screening number that pairs your weight with your height. On its own it
        proves nothing — as a <span className="text-foreground">trend over time</span> it becomes
        genuinely useful.
      </p>
      <ul className="mt-6 space-y-4">
        {[
          {
            t: 'A screening tool, not a verdict',
            d: 'It flags ranges worth a conversation with a professional — nothing more.',
          },
          {
            t: 'Not body composition',
            d: 'It cannot tell muscle from fat. Athletes often read “overweight” on BMI alone.',
          },
          {
            t: 'Trend beats any single value',
            d: 'Log it a few times; the Dashboard charts your trajectory automatically.',
          },
        ].map((r) => (
          <li key={r.t} className="rounded-lg border border-border/80 bg-elevated/40 p-4">
            <p className="text-sm font-semibold">{r.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-text-2">{r.d}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-text-3">
        <Info className="mt-0.5 size-3 shrink-0 text-neon/70" aria-hidden />
        This module uses deterministic arithmetic on the server. No AI model is involved, and the
        exact formula is shown with your result.
      </p>
      <DisclaimerNote compact className="mt-6" />
    </div>
  )
}
