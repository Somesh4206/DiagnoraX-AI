'use client'

/* DiagnoraX AI — Body Lab screen (BMI, deterministic) */

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, HeartPulse, Info, Loader2, Ruler, Scale, Weight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { api, ApiError, type BodyAnalysisResult } from '../api'
import { Chip, ScreenSection, SectionTitle } from '../ui-bits'
import type { ToastTone } from '../app'

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', cls: 'bg-teal-accent/12 text-teal-accent border-teal-accent/30', bar: 'text-teal-accent' }
  if (bmi < 25) return { label: 'Normal weight', cls: 'bg-primary/10 text-primary border-primary/25', bar: 'text-primary' }
  if (bmi < 30) return { label: 'Overweight', cls: 'bg-warning/15 text-amber-700 dark:text-amber-400 border-warning/40', bar: 'text-amber-600 dark:text-amber-400' }
  return { label: 'Obesity range', cls: 'bg-destructive/12 text-destructive border-destructive/25', bar: 'text-destructive' }
}

/* BMI scale: 14 → 40, segments by clinical range */
function BmiScale({ bmi }: { bmi: number }) {
  const pos = Math.min(100, Math.max(0, ((bmi - 14) / 26) * 100))
  return (
    <div className="mt-1">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full">
        <div className="absolute inset-0 flex">
          <span className="h-full bg-teal-accent/45" style={{ width: `${(4.5 / 26) * 100}%` }} />
          <span className="h-full bg-primary/70" style={{ width: `${(6.5 / 26) * 100}%` }} />
          <span className="h-full bg-warning/70" style={{ width: `${(5 / 26) * 100}%` }} />
          <span className="h-full bg-destructive/60" style={{ width: `${(10 / 26) * 100}%` }} />
        </div>
      </div>
      <div className="relative h-4">
        <motion.span
          layout
          className="absolute top-0 -translate-x-1/2 rounded-full border-2 border-background bg-foreground px-1.5 text-[9px] font-bold leading-4 text-background tabular-nums"
          style={{ left: `${pos}%` }}
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {bmi.toFixed(1)}
        </motion.span>
      </div>
      <div className="flex justify-between text-[9.5px] font-medium text-muted-foreground">
        <span>14</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>40</span>
      </div>
    </div>
  )
}

export function BodyScreen({
  notify,
  onSaved,
}: {
  notify: (message: string, tone?: ToastTone) => void
  onSaved: () => void
}) {
  const [height, setHeight] = React.useState(170)
  const [weight, setWeight] = React.useState(65)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<BodyAnalysisResult | null>(null)

  const liveBmi = weight / (height / 100) ** 2
  const live = bmiCategory(liveBmi)

  async function save() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.analyzeBody({ heightCm: height, weightKg: weight })
      setResult(res.result)
      onSaved()
      notify('BMI analysis saved to history.', 'success')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-5">
      <ScreenSection>
        <div className="app-card flex flex-col gap-6 p-4">
          {/* Height */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-[14px] font-semibold">
                <Ruler className="h-4 w-4 text-muted-foreground" /> Height
              </Label>
              <span className="rounded-lg bg-muted px-2.5 py-1 text-[15px] font-bold tabular-nums">
                {height} <span className="text-[11px] font-medium text-muted-foreground">cm</span>
              </span>
            </div>
            <Slider
              value={[height]}
              min={120}
              max={210}
              step={1}
              onValueChange={(v) => setHeight(v[0] ?? 170)}
              aria-label="Height in centimetres"
            />
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>120 cm</span>
              <span>210 cm</span>
            </div>
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-[14px] font-semibold">
                <Weight className="h-4 w-4 text-muted-foreground" /> Weight
              </Label>
              <span className="rounded-lg bg-muted px-2.5 py-1 text-[15px] font-bold tabular-nums">
                {weight} <span className="text-[11px] font-medium text-muted-foreground">kg</span>
              </span>
            </div>
            <Slider
              value={[weight]}
              min={30}
              max={160}
              step={1}
              onValueChange={(v) => setWeight(v[0] ?? 65)}
              aria-label="Weight in kilograms"
            />
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>30 kg</span>
              <span>160 kg</span>
            </div>
          </div>

          {/* Live preview */}
          <div className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <HeartPulse className={cn('h-4 w-4', live.bar)} />
              <span className="text-[13px] font-medium text-muted-foreground">Live BMI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-extrabold tabular-nums">{liveBmi.toFixed(1)}</span>
              <Chip className={live.cls}>{live.label}</Chip>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-[13px] font-medium text-destructive"
                role="alert"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={() => void save()}
            disabled={loading}
            className="h-12 rounded-full text-[15px] font-bold shadow-lg shadow-primary/25"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Scale className="h-4.5 w-4.5" /> Save BMI analysis
              </>
            )}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            BMI is computed with plain math — no AI involved.
          </p>
        </div>
      </ScreenSection>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ResultView result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ResultView({ result }: { result: BodyAnalysisResult }) {
  const cat = bmiCategory(result.bmi)
  return (
    <div className="flex flex-col gap-5">
      {/* Big number */}
      <ScreenSection>
        <div className="app-card p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Your BMI
              </p>
              <p className="mt-1 text-5xl font-extrabold tabular-nums leading-none">
                {result.bmi.toFixed(1)}
              </p>
            </div>
            <Chip className={cn(cat.cls, 'px-3 py-1 text-[12px]')}>{result.category}</Chip>
          </div>
          <BmiScale bmi={result.bmi} />
          <p className="mt-4 text-[13px] text-muted-foreground">
            At your height, a healthy weight is{' '}
            <span className="font-bold text-foreground">
              {result.healthyWeight.min}–{result.healthyWeight.max} kg
            </span>
            .
          </p>
        </div>
      </ScreenSection>

      {/* Recommendations */}
      <ScreenSection>
        <SectionTitle>What tends to help</SectionTitle>
        <div className="app-card flex flex-col gap-3 p-4">
          {result.recommendations.map((r) => (
            <div key={r} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <p className="text-[13.5px] leading-snug">{r}</p>
            </div>
          ))}
        </div>
      </ScreenSection>

      {/* Formula */}
      <ScreenSection>
        <div className="flex items-start gap-2.5 rounded-2xl bg-muted/70 p-4">
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-[13px] font-bold">How this was computed</p>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              BMI = kg ÷ m² = {result.bmi.toFixed(1)}
            </p>
          </div>
        </div>
      </ScreenSection>

      {/* Caveats */}
      <ScreenSection>
        <SectionTitle>Honest caveats</SectionTitle>
        <div className="app-card flex flex-col gap-2.5 p-4">
          {result.caveats.map((c) => (
            <p key={c} className="text-[12.5px] leading-snug text-muted-foreground">
              · {c}
            </p>
          ))}
        </div>
      </ScreenSection>
    </div>
  )
}
