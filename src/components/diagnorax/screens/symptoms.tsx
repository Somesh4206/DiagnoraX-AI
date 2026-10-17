'use client'

/* DiagnoraX AI — Symptom Check screen (AI triage) */

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Info,
  Leaf,
  Loader2,
  Sparkles,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { api, ApiError, type Sex, type SymptomAnalyzeResponse } from '../api'
import type { TabId } from '../tab-bar'
import { Chip, ScreenSection, SectionTitle, SegmentedControl, SelectChips, urgencyMeta } from '../ui-bits'
import type { ToastTone } from '../app'

const DURATIONS = ['Today', 'A few days', 'About a week', 'A few weeks', 'Months'] as const
type Duration = (typeof DURATIONS)[number]

const EXAMPLES = [
  'Sore throat and mild fever since two days, hurts to swallow',
  'Throbbing headache with light sensitivity, worst in the morning',
  'Sudden chest pain and shortness of breath',
] as const

const LIKELIHOOD_CHIP: Record<string, string> = {
  'commonly reported': 'bg-primary/10 text-primary border-primary/25',
  possible: 'bg-warning/15 text-amber-700 dark:text-amber-400 border-warning/40',
  'less common': 'bg-muted text-muted-foreground border-border',
}

function severityLabel(v: number) {
  if (v <= 3) return { label: 'Mild', cls: 'text-primary' }
  if (v <= 6) return { label: 'Moderate', cls: 'text-amber-600 dark:text-amber-400' }
  return { label: 'Severe', cls: 'text-destructive' }
}

export function SymptomsScreen({
  go,
  notify,
  onSaved,
}: {
  go: (tab: TabId) => void
  notify: (message: string, tone?: ToastTone) => void
  onSaved: () => void
}) {
  const [symptoms, setSymptoms] = React.useState('')
  const [age, setAge] = React.useState('')
  const [sex, setSex] = React.useState<Sex | null>(null)
  const [duration, setDuration] = React.useState<Duration | null>(null)
  const [severity, setSeverity] = React.useState(4)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<SymptomAnalyzeResponse | null>(null)
  const resultRef = React.useRef<HTMLDivElement>(null)
  const analyzeBtnRef = React.useRef<HTMLButtonElement>(null)

  const tooShort = symptoms.trim().length > 0 && symptoms.trim().length < 10
  const sev = severityLabel(severity)

  async function analyze() {
    if (symptoms.trim().length < 10) {
      setError('Describe your symptoms in at least 10 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.analyzeSymptoms({
        symptoms: symptoms.trim(),
        age: age ? Number(age) : undefined,
        sex: sex ?? undefined,
        duration: duration ?? undefined,
        severity,
      })
      setResult(res)
      onSaved()
      notify(res.engine === 'emergency-triage' ? 'Emergency triage applied — saved to history.' : 'Analysis saved to history.', 'success')
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      // The error banner grows the form — bring the button back above the tab bar.
      requestAnimationFrame(() =>
        analyzeBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      )
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setSymptoms('')
    setAge('')
    setSex(null)
    setDuration(null)
    setSeverity(4)
    setResult(null)
    setError(null)
  }

  return (
    <div className="flex flex-col gap-6 pt-5">
      {/* Intro */}
      <ScreenSection>
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="text-[13px] leading-snug text-foreground/80">
            Describe how you feel in plain words. AI suggests what it might commonly be,
            how urgent it looks, and what to do next.
          </p>
        </div>
      </ScreenSection>

      {/* Form */}
      <ScreenSection>
        <div className="app-card flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="symptoms" className="text-[14px] font-semibold">
                What are you feeling?
              </Label>
              <span
                className={cn(
                  'text-[11px] font-medium tabular-nums',
                  tooShort ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {symptoms.trim().length}/2000
              </span>
            </div>
            <Textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value.slice(0, 2000))}
              placeholder="e.g. Sore throat and mild fever since two days, hurts to swallow…"
              className="min-h-[96px] resize-none rounded-xl text-[15px]"
              aria-describedby={tooShort ? 'symptoms-hint' : undefined}
            />
            {tooShort && (
              <p id="symptoms-hint" className="text-[12px] font-medium text-destructive">
                A little more detail helps — at least 10 characters.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[12px] text-muted-foreground">Try an example</Label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setSymptoms(ex)}
                  className="max-w-full truncate rounded-full border border-border bg-muted/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground active:scale-95 transition-transform"
                >
                  {ex.length > 34 ? ex.slice(0, 34) + '…' : ex}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="age" className="text-[12px] text-muted-foreground">
                Age (optional)
              </Label>
              <Input
                id="age"
                type="number"
                inputMode="numeric"
                min={1}
                max={120}
                placeholder="e.g. 28"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-[12px] text-muted-foreground">Duration</Label>
              <SelectChips
                options={[...DURATIONS]}
                value={duration}
                onChange={setDuration}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[12px] text-muted-foreground">Sex (optional)</Label>
            <SegmentedControl<Sex>
              ariaLabel="Sex"
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'other', label: 'Other' },
              ]}
              value={sex}
              onChange={setSex}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-[12px] text-muted-foreground">How bad is it?</Label>
              <span className={cn('text-[13px] font-bold', sev.cls)}>
                {severity}/10 · {sev.label}
              </span>
            </div>
            <Slider
              value={[severity]}
              min={1}
              max={10}
              step={1}
              onValueChange={(v) => setSeverity(v[0] ?? 4)}
              aria-label="Symptom severity"
            />
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>1 · barely noticeable</span>
              <span>10 · worst ever</span>
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
            ref={analyzeBtnRef}
            onClick={() => void analyze()}
            disabled={loading || symptoms.trim().length < 10}
            className="h-12 rounded-full text-[15px] font-bold shadow-lg shadow-primary/25"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" /> Analyze symptoms
              </>
            )}
          </Button>
        </div>
      </ScreenSection>

      {/* Result */}
      <div ref={resultRef}>
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              <ResultCard result={result} />
              <ScreenSection>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={reset}
                    className="h-11 flex-1 rounded-full border-border font-semibold"
                  >
                    Check new symptoms
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => go('history')}
                    className="h-11 flex-1 rounded-full font-semibold text-primary"
                  >
                    View history
                  </Button>
                </div>
              </ScreenSection>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ResultCard({ result }: { result: SymptomAnalyzeResponse }) {
  const a = result.analysis
  const meta = urgencyMeta(a.urgencyLevel)
  const Icon = meta.icon

  return (
    <div className="flex flex-col gap-5 pt-1">
      {/* Urgency banner */}
      <ScreenSection>
        <div className={cn('rounded-2xl border p-4', meta.banner)}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/70">
              <Icon className={cn('h-5 w-5', a.urgencyLevel === 'emergency' ? 'text-destructive' : a.urgencyLevel === 'urgent' ? 'text-amber-600 dark:text-amber-400' : a.urgencyLevel === 'routine' ? 'text-primary' : 'text-teal-accent')} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-extrabold leading-tight">{meta.label}</p>
              <p className="text-[11px] font-medium text-muted-foreground">
                {result.engine === 'emergency-triage' ? 'Emergency triage · no AI involved' : 'AI analysis · informational only'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-foreground/85">{a.summary}</p>
        </div>
      </ScreenSection>

      {/* Possible conditions */}
      {a.possibleConditions.length > 0 && (
        <ScreenSection>
          <SectionTitle>Commonly reported with</SectionTitle>
          <div className="app-card divide-y divide-border/60">
            {a.possibleConditions.map((c) => (
              <div key={c.name} className="flex items-start gap-3 p-4">
                <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold leading-tight">{c.name}</p>
                    <Chip className={LIKELIHOOD_CHIP[c.likelihood] ?? LIKELIHOOD_CHIP.possible}>
                      {c.likelihood}
                    </Chip>
                  </div>
                  {c.note && (
                    <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{c.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScreenSection>
      )}

      {/* Self care */}
      {a.selfCare.length > 0 && (
        <ScreenSection>
          <SectionTitle>Self-care you can start now</SectionTitle>
          <div className="app-card flex flex-col gap-3 p-4">
            {a.selfCare.map((s) => (
              <div key={s} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                <p className="text-[13.5px] leading-snug">{s}</p>
              </div>
            ))}
          </div>
        </ScreenSection>
      )}

      {/* Red flags */}
      {a.redFlags.length > 0 && (
        <ScreenSection>
          <SectionTitle>Go for help immediately if</SectionTitle>
          <div className="flex flex-col gap-2.5 rounded-2xl border border-destructive/25 bg-destructive/[0.06] p-4">
            {a.redFlags.map((f) => (
              <div key={f} className="flex items-start gap-2.5">
                <TriangleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-destructive" />
                <p className="text-[13.5px] leading-snug">{f}</p>
              </div>
            ))}
          </div>
        </ScreenSection>
      )}

      {/* When to seek help */}
      <ScreenSection>
        <div className="flex items-start gap-2.5 rounded-2xl bg-muted/70 p-4">
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-[13px] font-bold">When to seek professional help</p>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{a.whenToSeekHelp}</p>
          </div>
        </div>
      </ScreenSection>

      {/* Disclaimer + raw */}
      <ScreenSection>
        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-[12px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5" /> {result.disclaimer}
            </span>
            <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 max-h-44 overflow-auto rounded-xl bg-muted/70 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
              {JSON.stringify(a, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </ScreenSection>
    </div>
  )
}
