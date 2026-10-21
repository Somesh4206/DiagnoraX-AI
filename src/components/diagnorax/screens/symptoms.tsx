'use client'

/* DiagnoraX AI — Symptom Checker screen (fresh rebuild):
 * plain-language form → deterministic emergency triage or English-only LLM
 * analysis → structured result saved to history. */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  History as HistoryIcon,
  RotateCcw,
  Sparkles,
  Stethoscope,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { api, ApiError, engineLabel, type SymptomAnalysis } from '../api'
import { useApp } from '../app'
import { AIThinking, MEDICAL_DISCLAIMER, SectionTitle, URGENCY, UrgencyBadge, fmtDateTime, relTime } from '../ui'

const EXAMPLES = [
  'Throbbing headache behind my right eye for three days, worse in bright light.',
  'Mild sore throat and runny nose since yesterday, no fever.',
  'Sharp lower-back pain after lifting boxes, better when I lie down.',
]

const DURATIONS = ['hours', '1-3 days', '4-7 days', '1-4 weeks', 'over a month', 'not sure'] as const

const SEVERITY_LABEL = (v: number) => (v <= 3 ? 'Mild' : v <= 6 ? 'Moderate' : v <= 8 ? 'Severe' : 'Very severe')

export function SymptomsScreen() {
  const { navigate, refreshRecords, aiMode } = useApp()
  const { toast } = useToast()

  const [symptoms, setSymptoms] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<string>('prefer-not-to-say')
  const [duration, setDuration] = useState<string>('not sure')
  const [severity, setSeverity] = useState(4)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ analysis: SymptomAnalysis; engine: string; savedAt: string } | null>(null)

  const valid = symptoms.trim().length >= 10

  async function analyze() {
    if (!valid || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.analyzeSymptoms({
        symptoms: symptoms.trim(),
        age: age ? Number(age) : undefined,
        sex: sex as 'male' | 'female' | 'other' | 'prefer-not-to-say',
        duration: duration as (typeof DURATIONS)[number],
        severity,
      })
      setResult({ analysis: res.analysis, engine: res.engine, savedAt: res.savedAt })
      await refreshRecords()
      if (res.fellBackToOffline && aiMode === 'cloud') {
        toast({
          title: 'Server unreachable',
          description: 'Answered with the on-device engine instead.',
        })
      } else {
        toast({ title: 'Analysis complete', description: 'Saved to your history.' })
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setError(msg)
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
            <Stethoscope className="size-4.5 text-neon" aria-hidden />
          </span>
          Symptom Checker
        </h1>
        <p className="mt-1.5 text-[13px] leading-snug text-text-2">
          Describe how you feel in plain words. Get urgency guidance, commonly reported
          possibilities and self-care — <span className="text-foreground">not a diagnosis</span>.
        </p>
      </div>

      {/* offline notice */}
      {aiMode === 'offline' ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-warn/40 bg-warn/10 p-3.5">
          <WifiOff className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <p className="text-[12px] leading-relaxed text-text-2">
            <span className="font-semibold text-warn">Offline mode.</span> No cloud AI reachable —
            your check runs on the built-in on-device engine. Same emergency triage, pre-written
            guidance, slightly less specific.
          </p>
        </div>
      ) : null}

      {/* form */}
      <section className="neon-card flex flex-col gap-5 rounded-2xl p-5" aria-label="Symptom form">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="symptoms">Describe your symptoms *</Label>
            <span className="text-[10.5px] tabular-nums text-text-3">
              {symptoms.length}/2000
            </span>
          </div>
          <Textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value.slice(0, 2000))}
            placeholder="e.g. Mild fever and dry cough for three days, feeling tired…"
            className="min-h-[110px] resize-none border-input bg-secondary/60 placeholder:text-text-3"
            aria-describedby="symptoms-hint"
          />
          <p id="symptoms-hint" className="text-[10.5px] text-text-3">
            At least 10 characters. Mention when it started and how it feels.
          </p>
        </div>

        {/* example chips */}
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-text-3">
            <Sparkles className="size-3 text-neon/80" aria-hidden /> Try an example
          </p>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setSymptoms(ex)}
                className="rounded-xl border border-neon/25 bg-neon/5 px-3.5 py-2.5 text-left text-[12px] leading-snug text-text-2 transition-colors hover:border-neon/50 hover:text-foreground"
              >
                “{ex}”
              </button>
            ))}
          </div>
        </div>

        {/* age / sex / duration */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="—"
              className="border-input bg-secondary/60 placeholder:text-text-3"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Sex</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger className="w-full border-input bg-secondary/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-full border-input bg-secondary/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* severity */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Label>Severity</Label>
            <span className="rounded-full border border-border bg-elevated px-2 py-0.5 text-[11px] font-semibold tabular-nums">
              {severity}/10 · {SEVERITY_LABEL(severity)}
            </span>
          </div>
          <Slider
            value={[severity]}
            min={1}
            max={10}
            step={1}
            onValueChange={(v) => setSeverity(v[0] ?? severity)}
            aria-label="Severity from 1 to 10"
          />
          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-text-3">
            <span>Mild</span>
            <span>Severe</span>
          </div>
        </div>

        <Button
          onClick={analyze}
          disabled={!valid || loading}
          className="glow-primary glow-primary-hover h-12 w-full rounded-xl bg-neon text-[15px] font-bold text-primary-foreground hover:bg-neon-dim disabled:opacity-40"
        >
          {loading
            ? 'Analyzing…'
            : aiMode === 'offline'
              ? 'Analyze on device'
              : 'Analyze with AI'}
        </Button>

        <p className="text-center text-[10.5px] leading-relaxed text-text-3">
          Saved to your local history only. You can delete it anytime — no cloud, no account.
        </p>
      </section>

      {/* loading */}
      {loading ? (
        <AIThinking
          label={
            aiMode === 'offline'
              ? 'Running the on-device check…'
              : 'AI is analyzing your symptoms…'
          }
        />
      ) : null}

      {/* error */}
      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangle className="size-4 shrink-0" aria-hidden /> {error}
          </p>
          <Button
            variant="outline"
            onClick={analyze}
            className="h-10 rounded-xl border-danger/40 text-danger hover:bg-danger/10 hover:text-danger"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Try again
          </Button>
        </div>
      ) : null}

      {/* result */}
      {result ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
          aria-label="Analysis result"
        >
          {/* urgency banner */}
          <div className={cn('rounded-2xl border p-4', URGENCY[result.analysis.urgencyLevel].banner)}>
            <UrgencyBadge level={result.analysis.urgencyLevel} />
            <p className="mt-2 text-[13px] font-semibold">
              {URGENCY[result.analysis.urgencyLevel].label}
            </p>
            <p className="mt-0.5 text-[12px] text-text-2">
              {URGENCY[result.analysis.urgencyLevel].sub}
            </p>
            <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-text-3">
              {engineLabel(result.engine)}
              <span aria-hidden>·</span>
              <Clock className="size-3" aria-hidden />
              {fmtDateTime(result.savedAt)}
            </p>
          </div>

          {/* summary */}
          <div className="neon-card rounded-2xl p-4">
            <SectionTitle>Summary</SectionTitle>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-2">
              {result.analysis.summary}
            </p>
          </div>

          {/* conditions */}
          {result.analysis.possibleConditions.length > 0 ? (
            <div className="neon-card rounded-2xl p-4">
              <SectionTitle>Commonly reported with these symptoms</SectionTitle>
              <ul className="mt-3 flex flex-col gap-3">
                {result.analysis.possibleConditions.map((c) => (
                  <li key={c.name} className="rounded-xl border border-border/70 bg-secondary/40 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13.5px] font-semibold">{c.name}</p>
                      <span className="shrink-0 rounded-full border border-cyan/30 bg-cyan/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-cyan">
                        {c.likelihood}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-text-2">{c.note}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10.5px] leading-relaxed text-text-3">
                These are commonly reported possibilities, not a diagnosis. Likelihood wording
                reflects how often patients report these — it is not a statistical risk score.
              </p>
            </div>
          ) : null}

          {/* self-care */}
          {result.analysis.selfCare.length > 0 ? (
            <div className="neon-card rounded-2xl p-4">
              <SectionTitle icon={CheckCircle2}>Self-care you can start now</SectionTitle>
              <ul className="mt-3 flex flex-col gap-2.5">
                {result.analysis.selfCare.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-text-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* red flags */}
          {result.analysis.redFlags.length > 0 ? (
            <div className="rounded-2xl border border-danger/40 bg-danger/5 p-4">
              <SectionTitle icon={AlertTriangle}>Seek immediate care if any of these appear</SectionTitle>
              <ul className="mt-3 flex flex-col gap-2.5">
                {result.analysis.redFlags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-text-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* when to seek help */}
          <div className="neon-card rounded-2xl border-cyan/25 p-4">
            <SectionTitle icon={Stethoscope}>When to seek professional help</SectionTitle>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-2">
              {result.analysis.whenToSeekHelp}
            </p>
          </div>

          <p className="px-1 text-[10.5px] leading-relaxed text-text-3">{MEDICAL_DISCLAIMER}</p>

          {/* actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null)
                setSymptoms('')
                window.scrollTo({ top: 0, behavior: 'instant' })
              }}
              className="h-11 rounded-xl border-border bg-transparent hover:bg-elevated"
            >
              <RotateCcw className="size-3.5" aria-hidden /> New check
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('history')}
              className="h-11 rounded-xl border-neon/40 bg-neon/10 text-neon hover:bg-neon/15 hover:text-neon"
            >
              <HistoryIcon className="size-3.5" aria-hidden /> View history
            </Button>
          </div>
        </motion.section>
      ) : null}
    </div>
  )
}
