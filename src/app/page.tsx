'use client'

import { useSyncExternalStore } from 'react'
import { Activity } from 'lucide-react'
import { DiagnoraXApp } from '@/components/diagnorax/app'
import { DeviceFrame } from '@/components/diagnorax/device-frame'

type Mode = 'boot' | 'embedded' | 'phone' | 'app'

/* Presentation mode, hydration-safe:
 *  - 'embedded' : running inside the device frame's same-origin iframe
 *                 → render the raw app so it fills the phone screen.
 *  - 'phone'    : viewport ≥ 640px → the app runs inside the phone frame,
 *                 exactly like a handset. There is NO wide "website" layout
 *                 at any viewport size — this is a mobile application.
 *  - 'app'      : real phone (< 640px) → the app takes over edge-to-edge.
 *  - 'boot'     : server snapshot → neon launch splash. */
let mqCache: MediaQueryList | null = null
function getMq(): MediaQueryList {
  if (!mqCache) mqCache = window.matchMedia('(min-width: 640px)')
  return mqCache
}

function subscribe(onChange: () => void) {
  const mq = getMq()
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSnapshot(): Mode {
  if (window.self !== window.top) return 'embedded'
  return getMq().matches ? 'phone' : 'app'
}

function getServerSnapshot(): Mode {
  return 'boot'
}

/* App launch splash — doubles as the app's boot animation. */
function BootSplash() {
  return (
    <div className="grid-bg flex min-h-dvh flex-col items-center justify-center gap-5 bg-background">
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-neon/20 blur-2xl"
        />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-neon/40 bg-neon/10 shadow-[0_0_28px_rgba(0,255,163,.35)]">
          <Activity className="h-8 w-8 text-neon" aria-hidden />
        </span>
      </div>
      <div className="text-center">
        <p className="text-xl font-bold tracking-tight">
          DiagnoraX<span className="text-neon"> AI</span>
        </p>
        <p className="mt-1 text-xs text-text-3">Your Personal AI Health Companion</p>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-neon" />
        <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-neon" />
        <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-neon" />
      </div>
    </div>
  )
}

export default function Home() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (mode === 'boot') return <BootSplash />

  if (mode === 'phone') {
    return (
      <DeviceFrame>
        <iframe
          src="/"
          title="DiagnoraX AI — mobile app"
          className="h-full w-full flex-1 border-0 bg-background"
        />
      </DeviceFrame>
    )
  }

  // Real phone, or embedded inside the device frame → the app itself.
  return <DiagnoraXApp />
}
