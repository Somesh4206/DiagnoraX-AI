'use client'

/* DiagnoraX AI — device frame.
 * Desktop (lg+): renders the app inside a realistic phone mockup with a
 *   showcase panel beside it, so it's obvious this is a MOBILE app.
 * Mobile: the app takes over the full viewport, edge to edge.
 */

import * as React from 'react'
import Image from 'next/image'
import { BatteryFull, Signal, Wifi, Sparkles, ShieldCheck, HeartPulse, Smartphone } from 'lucide-react'

function StatusBar() {
  const [time, setTime] = React.useState<string | null>(null)

  React.useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false }))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative z-30 hidden h-11 shrink-0 items-center justify-between px-8 pt-1 text-[13px] font-semibold tabular-nums lg:flex">
      <span className="w-16">{time ?? '--:--'}</span>
      <span className="flex items-center gap-1.5 text-foreground/80">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
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
          className="rounded-[14px] shadow-lg shadow-emerald-900/20"
          priority
        />
        <div>
          <p className="text-lg font-extrabold tracking-tight">DiagnoraX AI</p>
          <p className="text-sm text-muted-foreground">Your Personal AI Health Companion</p>
        </div>
      </div>

      <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight">
        A pocket health companion that actually respects your privacy.
      </h1>

      <ul className="flex flex-col gap-3">
        {[
          {
            icon: Sparkles,
            title: 'AI Symptom Checker',
            desc: 'Describe how you feel — get urgency guidance, possible causes and self-care steps.',
          },
          {
            icon: HeartPulse,
            title: 'Body Metrics',
            desc: 'BMI with healthy weight range, trends and honest caveats. No AI, just math.',
          },
          {
            icon: ShieldCheck,
            title: 'Private by Design',
            desc: 'Your history lives in this app — export or wipe it anytime.',
          },
        ].map((f) => (
          <li key={f.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <f.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
            <div>
              <p className="font-semibold leading-tight">{f.title}</p>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{f.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
        <Smartphone className="h-4 w-4 shrink-0" />
        You&apos;re previewing the mobile app. On a phone, open this link and
        <span className="font-semibold text-foreground">Add to Home Screen</span> to install it.
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground/70">
        DiagnoraX AI provides health information, not medical advice. In an emergency,
        contact your local emergency services immediately.
      </p>
    </aside>
  )
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="dot-grid relative min-h-dvh w-full bg-background lg:flex lg:items-center lg:justify-center lg:gap-16 lg:overflow-hidden lg:p-10">
      <ShowcasePanel />

      {/* The device: full-screen on mobile, phone mockup on desktop */}
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-background lg:h-[860px] lg:w-[400px] lg:rounded-[3.1rem] lg:border-[11px] lg:border-neutral-900 lg:shadow-[0_50px_100px_-20px_rgb(0_0_0/0.4),0_0_0_1px_rgb(0_0_0/0.1)] dark:lg:border-neutral-800">
        {/* Dynamic island (desktop mockup only) */}
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-40 hidden h-[27px] w-[104px] -translate-x-1/2 rounded-full bg-black lg:block" />
        <StatusBar />
        {children}
      </div>
    </div>
  )
}
