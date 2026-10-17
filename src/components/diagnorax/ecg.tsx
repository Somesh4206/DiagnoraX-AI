'use client'

import { useEffect, useRef } from 'react'

/**
 * AnimatedECG — synthetic cardiac monitor trace on canvas.
 * Draws a glowing neon-green PQRST waveform over a faint measurement grid.
 * Honors prefers-reduced-motion (renders a single static frame).
 */
export function AnimatedECG({ height = 168 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const parent = canvas.parentElement
    if (!parent) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0
    let disposed = false

    const resize = () => {
      const w = parent.clientWidth
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = '100%'
      canvas.style.height = `${height}px`
    }

    // one cardiac cycle per `period` seconds (~66 bpm visual cadence)
    const period = 0.92
    const gauss = (p: number, c: number, w: number, a: number) =>
      a * Math.exp(-((p - c) * (p - c)) / (2 * w * w))

    const wave = (p: number): number => {
      let v = 0
      v += gauss(p, 0.16, 0.028, 0.12) // P
      v += -gauss(p, 0.3, 0.009, 0.16) // Q
      v += gauss(p, 0.325, 0.012, 1.0) // R spike
      v += -gauss(p, 0.352, 0.01, 0.3) // S
      v += gauss(p, 0.56, 0.05, 0.24) // T
      v += 0.01 * Math.sin(p * 38) // baseline tremor
      return v
    }

    const grid = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.strokeStyle = 'rgba(0,255,163,0.07)'
      ctx.lineWidth = 1
      const step = 22 * dpr
      ctx.beginPath()
      for (let x = step; x < w; x += step) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
      }
      for (let y = step; y < h; y += step) {
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
      }
      ctx.stroke()
    }

    const draw = (nowMs: number) => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      grid()

      const windowSec = 3.2 // seconds of trace visible
      const t0 = nowMs / 1000 - windowSec
      const mid = h * 0.58
      const amp = h * 0.34

      ctx.lineWidth = 2 * dpr
      ctx.strokeStyle = '#00ffa3'
      ctx.lineJoin = 'round'
      ctx.shadowColor = 'rgba(0,255,163,0.85)'
      ctx.shadowBlur = 12 * dpr
      ctx.beginPath()
      const steps = Math.max(2, Math.floor(w / 2))
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w
        const t = t0 + (i / steps) * windowSec
        const phase = (t / period) % 1
        const y = mid - wave(phase < 0 ? phase + 1 : phase) * amp
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      if (reduceMotion) draw(performance.now())
    })
    ro.observe(parent)

    if (reduceMotion) {
      draw(performance.now())
    } else {
      const loop = () => {
        if (disposed) return
        draw(performance.now())
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [height])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Animated electrocardiogram illustration (not a real reading)"
      className="block w-full"
    />
  )
}
