'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Cpu,
  ListChecks,
  Lock,
  MessageSquareText,
  RotateCcw,
  Siren,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  ApiError,
  api,
  type Sex,
  type SymptomAnalyzeInput,
  type SymptomAnalyzeResponse,
} from './api'
import {
  AIThinking,
  DisclaimerNote,
  ErrorState,
  FieldError,
  URGENCY,
  UrgencyBadge,
  ViewHeader,
  fmtDate,
  relTime,
  type UrgencyLevel,
  type View,
} from './ui-bits'

const MIN_LEN = 10
const EXAMPLES = [
  'Throbbing headache behind my right eye for three days, worse in bright light.',
  'Mild sore throat and runny nose since yesterday, no fever.',
  'Sharp lower-back pain after lifting boxes, better when I lie down.',
]
const DURATIONS = ['Not sure', 'A few hours', '1–2 days', '3–7 days', '1–4 weeks', 'Over a month']
const LIKELIHOOD_CHIP: Record<string, string> = {
  'commonly reported': 'border-neon/40 bg-neon/10 text-neon',
  possible: 'border-cyan/40 bg-cyan/10 text-cyan',
  'less common': 'border-border bg-muted text-text-3',
}

const URGENCY_GUIDANCE: Record<UrgencyLevel, string> = {
  emergency: 'Treat this as a medical emergency. Contact your local emergency services now — do not drive yourself.',
  urgent: 'Arrange to see a doctor within the next 24 hours.',
  routine: 'A routine appointment is fine — within days, not hours.',
  low: 'Self-care is reasonable. Monitor for changes and re-check if anything worsens.',
}

export function SymptomCheckerView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const { toast } = useToast()
  const [symptoms, setSymptoms] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('unspecified')
  const [duration, setDuration] = useState('Not sure')
  const [severity, setSeverity] = useState(4)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SymptomAnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastPayload = useRef<SymptomAnalyzeInput | null>(null)

  const trimmed = symptoms.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LEN

  const buildPayload = (): SymptomAnalyzeInput | null => {
    const ageNum = Number(age)
    return {
      symptoms: trimmed,
      age: age.trim() !== '' && Number.isFinite(ageNum) ? ageNum : undefined,
      sex: (sex === 'unspecified' ? undefined : sex) as Sex | undefined,
      duration: duration === 'Not sure' ? undefined : duration,
      severity,
    }
  }

  const run = async (payload: SymptomAnalyzeInput) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.analyzeSymptoms(payload)
      setResult(res)
      toast({
        title: 'Analysis complete',
        description: 'Saved to your local history — you can delete it anytime.',
      })
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Unexpected error. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (trimmed.length < MIN_LEN || loading) return
    const payload = buildPayload()
    if (!payload) return
    lastPayload.current = payload
    setResult(null)
    void run(payload)
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setSymptoms('')
  }

  const level = result?.analysis.urgencyLevel
  const u = level ? URGENCY[level] : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <ViewHeader
        title="AI Symptom Checker"
        sub="Plain language in. Structured guidance out — with an honest urgency level."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[5fr_7fr]">
        {/* ---------- form ---------- */}
        <form onSubmit={onSubmit} className="neon-card neon-inset h-fit p-5 sm:p-6">
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <Label htmlFor="symptoms">
                  Describe your symptoms <span className="text-danger">*</span>
                </Label>
                <span
                  className={cn(
                    'text-[11px]',
                    trimmed.length > 2000 ? 'text-danger' : 'text-text-3'
                  )}
                >
                  {symptoms.length}/2000
                </span>
              </div>
              <Textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value.slice(0, 2000))}
                placeholder="e.g. Sharp pain behind my left eye for two days, worse when I bend over. Some light sensitivity."
                rows={5}
                className="resize-none"
                aria-describedby="symptoms-err"
              />
              <FieldError
                msg={
                  tooShort
                    ? `Please add a little more detail (at least ${MIN_LEN} characters).`
                    : null
                }
              />
              <p id="symptoms-err" className="sr-only">
                Describe your symptoms in at least {MIN_LEN} characters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Optional"
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="mb-2">Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger className="w-full" aria-label="Sex">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Prefer not to say</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-full" aria-label="Duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <Label>Severity</Label>
                  <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-neon">
                    {severity}/10
                  </span>
                </div>
                <Slider
                  value={[severity]}
                  onValueChange={(v) => setSeverity(v[0] ?? 4)}
                  min={1}
                  max={10}
                  step={1}
                  aria-label="Severity from 1 to 10"
                />
                <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wider text-text-3">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || trimmed.length < MIN_LEN}
              className="glow-primary glow-primary-hover h-11 w-full text-base"
              title={
                trimmed.length < MIN_LEN
                  ? 'Describe your symptoms (at least 10 characters) to enable analysis.'
                  : undefined
              }
            >
              {loading ? 'Analyzing…' : 'Analyze with AI'}
            </Button>

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-text-3">
              <Lock className="mt-0.5 size-3 shrink-0 text-neon/70" aria-hidden />
              The analysis is saved to your local history only. You can delete it anytime — no
              cloud, no account.
            </p>
          </div>
        </form>

        {/* ---------- result / placeholder ---------- */}
        <section aria-live="polite" className="neon-card neon-inset p-5 sm:p-6">
          {loading ? (
            <AIThinking />
          ) : error ? (
            <ErrorState message={error} onRetry={() => lastPayload.current && void run(lastPayload.current)} />
          ) : result && u && level ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* urgency banner */}
              <div
                role="alert"
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4',
                  level === 'emergency' && 'border-danger/50 bg-danger/10',
                  level === 'urgent' && 'border-warn/50 bg-warn/10',
                  level === 'routine' && 'border-cyan/40 bg-cyan/5',
                  level === 'low' && 'border-neon/40 bg-neon/5'
                )}
              >
                <u.icon
                  className={cn(
                    'mt-0.5 size-5 shrink-0',
                    level === 'emergency' && 'text-danger',
                    level === 'urgent' && 'text-warn',
                    level === 'routine' && 'text-cyan',
                    level === 'low' && 'text-neon'
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{u.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-2">
                    {URGENCY_GUIDANCE[level]}
                  </p>
                </div>
                <UrgencyBadge level={level} className="ml-auto hidden shrink-0 sm:inline-flex" />
              </div>

              {/* engine + meta */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-text-3">
                <span className="inline-flex items-center gap-1.5">
                  {result.engine === 'emergency-triage' ? (
                    <>
                      <Siren className="size-3 text-danger" aria-hidden />
                      Emergency triage — deterministic guidance, no AI call needed
                    </>
                  ) : (
                    <>
                      <Cpu className="size-3 text-neon" aria-hidden />
                      AI analysis · large language model
                    </>
                  )}
                </span>
                <span>{fmtDate(result.createdAt)}</span>
                <span>Saved to history {relTime(result.createdAt)}</span>
              </div>

              {/* summary */}
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-text-3">
                Summary
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {result.analysis.summary}
              </p>

              {/* conditions */}
              {result.analysis.possibleConditions.length > 0 ? (
                <>
                  <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-text-3">
                    Commonly reported with these symptoms
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {result.analysis.possibleConditions.map((c, i) => (
                      <li
                        key={`${c.name}-${i}`}
                        className="rounded-lg border border-border/80 bg-elevated/40 p-3.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{c.name}</p>
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              LIKELIHOOD_CHIP[c.likelihood] ?? LIKELIHOOD_CHIP['less common']
                            )}
                          >
                            {c.likelihood}
                          </span>
                        </div>
                        {c.note ? (
                          <p className="mt-1.5 text-xs leading-relaxed text-text-2">{c.note}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] leading-relaxed text-text-3">
                    These are commonly reported possibilities, not a diagnosis. Likelihood wording
                    reflects how often patients report these — it is not a statistical risk score.
                  </p>
                </>
              ) : null}

              {/* self care */}
              {result.analysis.selfCare.length > 0 ? (
                <>
                  <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-text-3">
                    Self-care you can start now
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {result.analysis.selfCare.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon" aria-hidden />
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {/* red flags */}
              {result.analysis.redFlags.length > 0 ? (
                <div className="mt-6 rounded-lg border border-warn/40 bg-warn/5 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-warn">
                    <TriangleAlert className="size-3.5" aria-hidden />
                    Seek immediate care if any of these appear
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {result.analysis.redFlags.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warn" aria-hidden />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* when to seek help */}
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-text-3">
                When to seek professional help
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {result.analysis.whenToSeekHelp}
              </p>

              <DisclaimerNote compact className="mt-6" />

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="size-3.5" aria-hidden />
                  Run another check
                </Button>
                <Button variant="ghost" onClick={() => onNavigate('history')} className="text-neon hover:bg-neon/10 hover:text-neon">
                  View in history
                </Button>
              </div>
            </motion.div>
          ) : (
            <Placeholder onPrefill={setSymptoms} />
          )}
        </section>
      </div>
    </div>
  )
}

/* ---------- placeholder ---------- */

function Placeholder({ onPrefill }: { onPrefill: (text: string) => void }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">What happens here</h3>
      <ul className="mt-5 space-y-4">
        {[
          {
            icon: MessageSquareText,
            t: 'Describe it plainly',
            d: 'Everyday words are fine. More detail → better structure.',
          },
          {
            icon: Cpu,
            t: 'AI structures it',
            d: 'Possible causes (hedged, never certain), self-care, red flags, urgency level.',
          },
          {
            icon: ListChecks,
            t: 'Act with clarity',
            d: 'You leave with concrete next steps and a saved, deletable record.',
          },
        ].map((r) => (
          <li key={r.t} className="flex items-start gap-3.5">
            <div className="rounded-lg border border-neon/25 bg-neon/10 p-2">
              <r.icon className="size-4 text-neon" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold">{r.t}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-text-2">{r.d}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-xs font-semibold uppercase tracking-widest text-text-3">
        Try an example
      </h3>
      <p className="mt-2 text-xs text-text-2">Tap to prefill the form.</p>
      <div className="mt-3 space-y-2">
        {EXAMPLES.map((ex) => (
          <ExampleChip key={ex} text={ex} onPrefill={onPrefill} />
        ))}
      </div>

      <DisclaimerNote compact className="mt-8" />
    </div>
  )
}

function ExampleChip({
  text,
  onPrefill,
}: {
  text: string
  onPrefill: (text: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onPrefill(text)
        document.getElementById('symptoms')?.focus()
      }}
      className="w-full rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 text-left text-xs leading-relaxed text-text-2 transition-colors hover:border-neon/40 hover:text-foreground"
    >
      “{text}”
    </button>
  )
}
