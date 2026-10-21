'use client'

/* DiagnoraX AI — typed API client with a full offline layer.
 *
 * One codebase, two runtimes:
 *  - Web (Next.js server present)  → cloud AI + Prisma-backed history.
 *  - Android APK (no server at all) → the same deterministic triage engine
 *    runs ON-DEVICE and history is stored in localStorage.
 * A user-deployed server URL can optionally be set in Profile to get full
 * cloud AI even inside the APK. */

import {
  computeBodyAnalysis,
  localSymptomAnalysis,
  type BodyResult,
  type SymptomAnalysis,
  type SymptomInput,
  type UrgencyLevel,
} from '@/lib/engine'

export type { BodyResult, SymptomAnalysis, SymptomInput, UrgencyLevel }

export type EngineKind = 'emergency-triage' | 'ai-llm' | 'offline-triage'

export interface PossibleCondition {
  name: string
  likelihood: 'commonly reported' | 'possible' | 'less common'
  note: string
}

export interface SymptomAnalyzeResponse {
  analysis: SymptomAnalysis
  engine: EngineKind
  recordId: string | null
  savedAt: string
  /** true when a configured remote server was unreachable and the
   *  on-device engine answered instead */
  fellBackToOffline?: boolean
}

export interface BodyAnalyzeResponse {
  result: BodyResult
  recordId: string | null
  savedAt: string
  fellBackToOffline?: boolean
}

export interface HealthRecordItem {
  id: string
  type: 'SYMPTOM_CHECK' | 'BODY_ANALYSIS'
  title: string
  summary: string
  severity: string | null
  data: string
  createdAt: string
}

export type AiMode = 'cloud' | 'offline'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/* ---------- remote server setting (optional, powers cloud AI in the APK) ---------- */

const REMOTE_KEY = 'diagnorax.remoteServer'

export function getRemoteServer(): string {
  try {
    return window.localStorage.getItem(REMOTE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setRemoteServer(url: string) {
  try {
    if (url) window.localStorage.setItem(REMOTE_KEY, url)
    else window.localStorage.removeItem(REMOTE_KEY)
  } catch {
    // storage unavailable — ignore
  }
  // re-probe with the new configuration next time
  backendState = 'unknown'
}

function baseUrl(): string {
  const remote = getRemoteServer()
  return remote ? remote.replace(/\/+$/, '') : ''
}

/* ---------- backend probe ---------- */

let backendState: 'unknown' | 'online' | 'offline' = 'unknown'

/** Detect whether a DiagnoraX backend (built-in or remote) is reachable.
 *  Cached after the first answer; pass force to re-check. */
export async function probeBackend(force = false): Promise<boolean> {
  if (!force && backendState !== 'unknown') return backendState === 'online'
  const root = baseUrl()
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 3500)
    const res = await fetch(`${root}/api/v1/health`, {
      signal: ctl.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    backendState = res.ok ? 'online' : 'offline'
  } catch {
    backendState = 'offline'
  }
  return backendState === 'online'
}

export async function currentAiMode(force = false): Promise<AiMode> {
  return (await probeBackend(force)) ? 'cloud' : 'offline'
}

/* ---------- transport ---------- */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError('Network error — the server is unreachable.', 0)
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new ApiError(
      typeof body.error === 'string' ? body.error : `Request failed (${res.status}).`,
      res.status
    )
  }
  return body as T
}

/* ---------- offline history store (localStorage) ---------- */

const LS_RECORDS = 'diagnorax.records.v1'

function lsRecords(): HealthRecordItem[] {
  try {
    const raw = window.localStorage.getItem(LS_RECORDS)
    const parsed = raw ? (JSON.parse(raw) as HealthRecordItem[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function lsSave(records: HealthRecordItem[]) {
  try {
    window.localStorage.setItem(LS_RECORDS, JSON.stringify(records))
  } catch {
    // storage full/unavailable — analyses still work, just not saved
  }
}

function lsPut(record: HealthRecordItem): HealthRecordItem {
  const next = [record, ...lsRecords()]
  lsSave(next)
  return record
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/* ---------- public API ---------- */

export const api = {
  async analyzeSymptoms(input: SymptomInput): Promise<SymptomAnalyzeResponse> {
    const online = await probeBackend()
    if (online) {
      try {
        const res = await request<{
          analysis: SymptomAnalysis
          engine: EngineKind
          recordId: string | null
          savedAt: string
        }>('/api/v1/symptoms/analyze', { method: 'POST', body: JSON.stringify(input) })
        return { ...res, fellBackToOffline: false }
      } catch (err) {
        // A configured remote server failed → answer on-device instead of
        // leaving the user stranded.
        if (!getRemoteServer()) throw err
        const local = localSymptomAnalysis(input)
        return offlineSymptomResponse(input, local)
      }
    }
    const local = localSymptomAnalysis(input)
    return offlineSymptomResponse(input, local)
  },

  async analyzeBody(input: { heightCm: number; weightKg: number }): Promise<BodyAnalyzeResponse> {
    const online = await probeBackend()
    if (online) {
      try {
        const res = await request<{
          result: BodyResult
          recordId: string | null
          savedAt: string
        }>('/api/v1/body/analysis', { method: 'POST', body: JSON.stringify(input) })
        return { ...res, fellBackToOffline: false }
      } catch (err) {
        if (!getRemoteServer()) throw err
        return offlineBodyResponse(input)
      }
    }
    return offlineBodyResponse(input)
  },

  async getRecords(params?: {
    type?: 'SYMPTOM_CHECK' | 'BODY_ANALYSIS'
    q?: string
    limit?: number
  }): Promise<{ records: HealthRecordItem[] }> {
    const online = await probeBackend()
    if (online) {
      try {
        const sp = new URLSearchParams()
        if (params?.type) sp.set('type', params.type)
        if (params?.q) sp.set('q', params.q)
        sp.set('limit', String(params?.limit ?? 100))
        return await request<{ records: HealthRecordItem[] }>(`/api/v1/records?${sp.toString()}`)
      } catch (err) {
        if (!getRemoteServer()) throw err
      }
    }
    // offline store (client-side filtering)
    const limit = params?.limit ?? 100
    const q = params?.q?.toLowerCase() ?? ''
    const records = lsRecords()
      .filter((r) => (params?.type ? r.type === params.type : true))
      .filter((r) =>
        q
          ? r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q)
          : true
      )
      .slice(0, limit)
    return { records }
  },

  async deleteRecord(id: string): Promise<{ ok: boolean }> {
    const online = await probeBackend()
    if (online) {
      try {
        return await request<{ ok: boolean }>(`/api/v1/records?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        })
      } catch (err) {
        if (!getRemoteServer()) throw err
      }
    }
    lsSave(lsRecords().filter((r) => r.id !== id))
    return { ok: true }
  },

  async clearAllRecords(): Promise<{ ok: boolean; deleted: number }> {
    const online = await probeBackend()
    if (online) {
      try {
        return await request<{ ok: boolean; deleted: number }>('/api/v1/records?all=true', {
          method: 'DELETE',
        })
      } catch (err) {
        if (!getRemoteServer()) throw err
      }
    }
    const deleted = lsRecords().length
    lsSave([])
    return { ok: true, deleted }
  },
}

/* ---------- offline response builders ---------- */

function offlineSymptomResponse(
  input: SymptomInput,
  local: ReturnType<typeof localSymptomAnalysis>
): SymptomAnalyzeResponse {
  const record: HealthRecordItem = {
    id: newId(),
    type: 'SYMPTOM_CHECK',
    title: input.symptoms.slice(0, 120),
    summary: local.analysis.summary.slice(0, 300),
    severity: local.analysis.urgencyLevel,
    data: JSON.stringify({ input, analysis: local.analysis, engine: local.engine }),
    createdAt: new Date().toISOString(),
  }
  lsPut(record)
  return {
    analysis: local.analysis,
    engine: local.engine,
    recordId: record.id,
    savedAt: record.createdAt,
    fellBackToOffline: true,
  }
}

function offlineBodyResponse(input: { heightCm: number; weightKg: number }): BodyAnalyzeResponse {
  const result = computeBodyAnalysis(input.heightCm, input.weightKg)
  const now = new Date().toISOString()
  const record: HealthRecordItem = {
    id: newId(),
    type: 'BODY_ANALYSIS',
    title: `BMI ${result.bmi.toFixed(1)} · ${result.category}`,
    summary: `For ${input.heightCm} cm and ${input.weightKg} kg. Healthy weight range: ${result.healthyRangeKg.min}–${result.healthyRangeKg.max} kg.`,
    severity: result.category,
    data: JSON.stringify({ input, result }),
    createdAt: now,
  }
  lsPut(record)
  return { result, recordId: record.id, savedAt: now, fellBackToOffline: true }
}

/** Human label for the engine that produced a result. */
export function engineLabel(engine: string): string {
  switch (engine) {
    case 'emergency-triage':
      return 'Emergency triage · deterministic, no AI call'
    case 'ai-llm':
      return 'AI analysis · large language model'
    case 'offline-triage':
      return 'On-device analysis · offline rule engine'
    default:
      return engine
  }
}

/** Parse a record's embedded JSON payload defensively. */
export function recordData(record: HealthRecordItem): {
  input?: SymptomInput & { heightCm?: number; weightKg?: number }
  analysis?: SymptomAnalysis
  result?: BodyResult
  engine?: string
} {
  try {
    return JSON.parse(record.data)
  } catch {
    return {}
  }
}
