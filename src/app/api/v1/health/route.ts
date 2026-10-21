import { corsJson, preflight } from '@/lib/http'

export const runtime = 'nodejs'

/* Liveness probe — the client uses this to detect whether the cloud AI
 * backend is reachable (web version) or the app should run its offline
 * on-device engine (Android APK / no connection). */
export function GET() {
  return corsJson({
    ok: true,
    service: 'diagnorax-api',
    capabilities: ['symptom-ai', 'body-analysis', 'records'],
    time: new Date().toISOString(),
  })
}

export function OPTIONS() {
  return preflight()
}
