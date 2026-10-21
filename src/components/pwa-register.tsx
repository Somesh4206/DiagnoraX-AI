'use client'

/* Registers the service worker in production builds only (never during
 * development, and never inside the phone-frame iframe on wide screens). */

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    try {
      if (window.self !== window.top) return // inside the device-frame iframe
    } catch {
      return
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // registration is best-effort — the app works without it
    })
  }, [])

  return null
}
