'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BellRing,
  Cpu,
  FileSearch,
  Heart,
  HeartPulse,
  History as HistoryIcon,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Scale,
  Sparkles,
  Stethoscope,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedECG } from './ecg'
import { DisclaimerNote, SectionHead, TrustRow, type View } from './ui-bits'
import { cn } from '@/lib/utils'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-70px' },
  transition: { duration: 0.45, ease: 'easeOut' as const },
}

export function LandingView({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <div>
      {/* ---------- hero ---------- */}
      <section className="grid-bg hero-fade relative overflow-hidden border-b border-border/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:pb-24 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="chip-neon inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
              <Sparkles className="size-3.5" aria-hidden />
              AI-powered health companion
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
              Your personal{' '}
              <span className="gradient-neon-text text-glow">AI health companion</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-text-2 sm:text-lg">
              Describe how you feel in plain language. DiagnoraX AI structures it, explains
              commonly reported causes, and tells you what to do next — information you can act
              on, not a diagnosis.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => onNavigate('symptoms')}
                className="glow-primary glow-primary-hover h-12 px-6 text-base"
              >
                Check your symptoms
                <ArrowRight className="size-4" aria-hidden />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                className="h-12 px-6 text-base"
              >
                <LayoutDashboard className="size-4" aria-hidden />
                Open dashboard
              </Button>
            </div>
            <TrustRow className="mt-7" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
          >
            <EcgCard />
          </motion.div>
        </div>
      </section>

      {/* ---------- stats ---------- */}
      <motion.section {...fadeUp} className="border-b border-border/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
          {[
            { v: '3', l: 'live modules today' },
            { v: '<30s', l: 'typical AI analysis' },
            { v: '100%', l: 'data stays local' },
            { v: '24/7', l: 'always available' },
          ].map((s, i) => (
            <div
              key={s.l}
              className={cn(
                'px-6 py-7',
                i % 2 === 1 && 'border-l border-border/60',
                i >= 2 && 'border-t border-border/60 lg:border-t-0',
                i > 0 && 'lg:border-l',
                i >= 2 && 'lg:border-l'
              )}
            >
              <p className="text-2xl font-semibold text-neon text-glow sm:text-3xl">{s.v}</p>
              <p className="mt-1 text-xs text-text-2">{s.l}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ---------- features ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div {...fadeUp}>
          <SectionHead
            eyebrow="Modules"
            title="Everything you need to stay informed"
            sub="Three modules are live today. More are on the roadmap — every planned card says so, no dead buttons."
          />
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            >
              <FeatureCard feature={f} onNavigate={onNavigate} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <motion.div {...fadeUp}>
            <SectionHead
              eyebrow="How it works"
              title="Three steps. No forms from 1998."
              sub="No insurance numbers, no waiting rooms. Just describe, analyze, act."
            />
          </motion.div>
          <div className="relative mt-12 grid gap-6 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
                className="neon-card neon-card-hover relative p-6 pt-8"
              >
                <span className="absolute -top-3.5 left-6 inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-background px-3 py-1 text-[11px] font-semibold tracking-widest text-neon">
                  0{i + 1}
                </span>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-neon/25 bg-neon/10 p-2.5">
                    <s.icon className="size-5 text-neon" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-text-2">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div {...fadeUp} className="neon-card hero-fade px-6 py-12 text-center sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop guessing. <span className="gradient-neon-text text-glow">Start understanding.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-text-2">
            Run your first AI symptom check in under a minute — no account, no cloud, no judgement.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => onNavigate('symptoms')}
              className="glow-primary glow-primary-hover h-12 px-6 text-base"
            >
              Check your symptoms
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNavigate('body')} className="h-12 px-6 text-base">
              Calculate my BMI
            </Button>
          </div>
          <DisclaimerNote className="mx-auto mt-8 max-w-2xl" />
        </motion.div>
      </section>
    </div>
  )
}

/* ---------- ECG hero card ---------- */

function EcgCard() {
  const [bpm, setBpm] = useState(72)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      setBpm(68 + Math.floor(Math.random() * 9)) // 68–76
    }, 4000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="neon-card neon-inset p-4 sm:p-5" aria-label="Demo cardiac monitor">
      <div className="flex items-center justify-between gap-3 pb-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-text-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-neon/60" />
            <span className="relative inline-flex size-2 rounded-full bg-neon" />
          </span>
          LIVE · Cardiac monitor
        </span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-text-3">
          Demo — not a real reading
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/70 bg-[#071009]">
        <AnimatedECG height={170} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { icon: Heart, label: `${bpm} BPM`, sub: 'Heart rate' },
          { icon: Activity, label: 'SpO₂ 98%', sub: 'Oxygen' },
          { icon: Zap, label: 'Sinus', sub: 'Rhythm · Normal' },
        ].map((c) => (
          <div key={c.sub} className="rounded-lg border border-border/70 bg-elevated/60 px-3 py-2.5">
            <c.icon className="size-4 text-neon" aria-hidden />
            <p className="mt-1.5 text-sm font-semibold leading-none">{c.label}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-text-3">{c.sub}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-text-3">
        Illustrative visualization rendered on canvas. DiagnoraX AI does not measure any vital
        sign.
      </p>
    </div>
  )
}

/* ---------- features ---------- */

interface Feature {
  title: string
  desc: string
  icon: LucideIcon
  live: boolean
  view?: View
}

const FEATURES: Feature[] = [
  {
    title: 'AI Symptom Checker',
    desc: 'Describe symptoms in plain language and get a structured informational analysis with clear next steps.',
    icon: Stethoscope,
    live: true,
    view: 'symptoms',
  },
  {
    title: 'Body Analysis',
    desc: 'BMI with healthy weight ranges for your height — deterministic math, no AI involved.',
    icon: Scale,
    live: true,
    view: 'body',
  },
  {
    title: 'Health History',
    desc: 'Every analysis is saved in your local database. Search it, review it, delete it anytime.',
    icon: HistoryIcon,
    live: true,
    view: 'history',
  },
  {
    title: 'Report Explainer',
    desc: 'Lab reports translated into plain language with flagged values.',
    icon: FileSearch,
    live: false,
  },
  {
    title: 'Smart Reminders',
    desc: 'Medication and appointment nudges that actually respect your time.',
    icon: BellRing,
    live: false,
  },
  {
    title: 'Doctor Finder',
    desc: 'Find nearby care when it matters, with urgency-aware suggestions.',
    icon: HeartPulse,
    live: false,
  },
]

function FeatureCard({
  feature: f,
  onNavigate,
}: {
  feature: Feature
  onNavigate: (v: View) => void
}) {
  return (
    <div className={cn('neon-card h-full p-5', f.live && 'neon-card-hover')}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg border border-neon/25 bg-neon/10 p-2.5">
          <f.icon className="size-5 text-neon" aria-hidden />
        </div>
        {f.live ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neon">
            Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-text-3">
            Planned
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug">{f.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-2">{f.desc}</p>
      <div className="mt-5">
        {f.live && f.view ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(f.view as View)}
            className="gap-1.5 px-2 text-neon hover:bg-neon/10 hover:text-neon"
          >
            Open module
            <ArrowRight className="size-3.5" aria-hidden />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            title="This module is planned for a future release."
            className="opacity-60"
          >
            In development
          </Button>
        )}
      </div>
    </div>
  )
}

/* ---------- steps ---------- */

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Describe it plainly',
    desc: '“Sharp pain behind my left eye for two days, worse when I bend over.” That is enough — no medical vocabulary required.',
  },
  {
    icon: Cpu,
    title: 'AI structures it',
    desc: 'The model maps your description to commonly reported conditions, self-care steps, and red flags — always hedged, never a diagnosis.',
  },
  {
    icon: ListChecks,
    title: 'Act with clarity',
    desc: 'You leave with an urgency level, concrete next steps, and a saved record you can search or delete anytime.',
  },
]
