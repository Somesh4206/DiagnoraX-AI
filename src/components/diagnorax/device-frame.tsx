'use client'

/* DiagnoraX AI — device frame (fresh rebuild).
 * Renders ONLY the phone: dark bezel, dynamic island, status bar, ambient
 * neon glow. No marketing copy, no showcase panel — the presentation must
 * read as "a mobile app", never as a website. Used at ≥640px viewports;
 * on real phones the app runs raw and this frame is never rendered. */

import * as React from 'react'
import { BatteryFull, Signal, Wifi } from 'lucide-react'

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

export function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid-bg hero-fade relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background p-6">
      {/* ambient neon glow behind the device */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/[0.05] blur-3xl"
      />

      {/* The device — just the phone, nothing else */}
      <div className="relative z-10 flex h-[min(860px,calc(100dvh-3rem))] w-[400px] shrink-0 flex-col overflow-hidden rounded-[3.1rem] border-[11px] border-[#0a0f0c] bg-background shadow-[0_50px_120px_-20px_rgba(0,0,0,.8),0_0_0_1px_rgba(0,255,163,.14),0_0_60px_rgba(0,255,163,.07)]">
        {/* Dynamic island */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-2.5 z-40 h-[27px] w-[104px] -translate-x-1/2 rounded-full bg-black"
        />
        <StatusBar />
        {children}
      </div>
    </div>
  )
}
