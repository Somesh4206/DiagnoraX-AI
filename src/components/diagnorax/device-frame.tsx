'use client'

/* DiagnoraX AI — device frame (Dark Neon Medical).
 * Desktop (lg+): the app runs inside a realistic phone mockup — same-origin
 *   iframe at phone width, so the app's own mobile layout (bottom tab nav,
 *   stacked sections) is what you see. It must ALWAYS read as a mobile app.
 * Mobile: this frame is never rendered; the app takes the full viewport.
 */

import * as React from 'react'
import Image from 'next/image'
import {
  Activity,
  BatteryFull,
  Signal,
  Wifi,
  Stethoscope,
  Scale,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'

function StatusBar() {
  const [time, setTime] = React.useState<string | null>(null)

  React.useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        })
      )
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative z-30 flex h-11 shrink-0 items-center justify-between px-8 pt-1 text-[13px] font-semibold tabular-nums text-foreground">
      <span className="w-16">{time ?? '--:--'}</span>
      <span className="flex items-center gap-1.5 text-foreground/80">
        <Signal className="h-3.5 w-3.5" aria-hidden />
        <Wifi className="h-3.5 w-3.5" aria-hidden />
        <BatteryFull className="h-4 w-4" aria-hidden />
      </span>
    </div>
  )
}

function ShowcasePanel() {
  return (
    <aside className="hidden max-w-sm select-none lg:flex lg:flex-col lg:gap-6">
      <div className="flex items-center gap-3">
        <Image
          src="/icon-1024.png"
          alt="DiagnoraX AI app icon"
          width={56}
          height={56}
          className="rounded-[14px] border border-neon/30 shadow-[0_0_24px_rgba(0,255,163,.25)]"
          priority
        />
        <div>
          <p className="text-lg font-bold tracking-tight">
            DiagnoraX<span className="text-neon"> AI</span>
          </p>
          <p className="text-sm text-text-2">Your Personal AI Health Companion</p>
        </div>
      </div>

      <h1 className="text-4xl font-bold leading-[1.12] tracking-tight">
        A pocket <span className="gradient-neon-text">AI health companion</span> that
        respects your privacy.
      </h1>

      <ul className="flex flex-col gap-3">
        {[
          {
            icon: Stethoscope,
            title: 'AI Symptom Checker',
            desc: 'Describe how you feel in plain language — get urgency guidance, possible causes and self-care steps.',
          },
          {
            icon: Scale,
            title: 'Body Metrics',
            desc: 'BMI with healthy weight range and honest caveats. Deterministic math, never an LLM guess.',
          },
          {
            icon: ShieldCheck,
            title: 'Private by Design',
            desc: 'Your history lives on this device — export or delete it anytime.',
          },
        ].map((f) => (
          <li key={f.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neon/30 bg-neon/10 text-neon shadow-[0_0_14px_rgba(0,255,163,.18)]">
              <f.icon className="h-4.5 w-4.5" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="font-semibold leading-tight text-foreground">{f.title}</p>
              <p className="mt-0.5 text-sm leading-snug text-text-2">{f.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="neon-card flex items-center gap-2 px-4 py-3 text-sm text-text-2">
        <Smartphone className="h-4 w-4 shrink-0 text-neon" aria-hidden />
        <span>
          You&apos;re previewing the mobile app. On a phone, open this link and{' '}
          <span className="font-semibold text-neon">Add to Home Screen</span> to install it.
        </span>
      </div>

      <p className="text-xs leading-relaxed text-text-3">
        DiagnoraX AI provides health information, not medical advice. In an emergency,
        contact your local emergency services immediately.
      </p>
    </aside>
  )
}

export function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg hero-fade relative flex min-h-dvh w-full items-center justify-center gap-16 overflow-hidden bg-background p-10">
      <ShowcasePanel />

      {/* ambient neon glow behind the device */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[560px] w-[560px] -translate-x-[38%] -translate-y-1/2 rounded-full bg-neon/[0.05] blur-3xl lg:block"
      />

      {/* The device */}
      <div className="relative z-10 flex h-[860px] w-[400px] shrink-0 flex-col overflow-hidden rounded-[3.1rem] border-[11px] border-[#0a0f0c] bg-background shadow-[0_50px_120px_-20px_rgba(0,0,0,.8),0_0_0_1px_rgba(0,255,163,.14),0_0_60px_rgba(0,255,163,.07)]">
        {/* Dynamic island */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-2.5 z-40 h-[27px] w-[104px] -translate-x-1/2 rounded-full bg-black"
        />
        <StatusBar />
        {children}
      </div>

      {/* subtle corner brand watermark */}
      <p className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 text-[11px] text-text-3 lg:flex">
        <Activity className="h-3 w-3 text-neon/70" aria-hidden />
        DiagnoraX AI · mobile app preview
      </p>
    </div>
  )
}
