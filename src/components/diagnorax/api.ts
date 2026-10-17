'use client'

/* DiagnoraX AI — typed API client (fresh rebuild). */

export type UrgencyLevel = 'emergency' | 'urgent' | 'routine' | 'low'

export interface PossibleCondition {
  name: string
  likelihood: 'commonly reported' | 'possible' | 'less common'
  note: string
}

export interface SymptomAnalysis {
  urgencyLevel: UrgencyLevel
  summary: string
  possibleConditions: PossibleCondition[]
  selfCare: string[]
  redFlags: string[]
  whenToSeekHelp: string
}

export interface SymptomInput {
  symptoms: string
  age?: number
  sex?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  duration?: 'hours' | '1-3 days' | '4-7 days' | '1-4 weeks' | 'over a month' | 'not sure'
  severity?: number
}

export interface BodyResult {
  bmi: number
  category: string
  tone: 'ok' | 'warn' | 'danger'
  healthyRangeKg: { min: number; max: number }
  midBandBmi: number
  deltaToMid: number
  formula: string
  caveats: string[]
  recommendations: string[]
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

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError('Network error — the app server is unreachable.', 0)
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

export const api = {
  analyzeSymptoms(input: SymptomInput) {
    return request<{
      analysis: SymptomAnalysis
      engine: 'emergency-triage' | 'ai-llm'
      recordId: string | null
      savedAt: string
    }>('/api/v1/symptoms/analyze', { method: 'POST', body: JSON.stringify(input) })
  },

  analyzeBody(input: { heightCm: number; weightKg: number }) {
    return request<{
      result: BodyResult
      recordId: string | null
      savedAt: string
    }>('/api/v1/body/analysis', { method: 'POST', body: JSON.stringify(input) })
  },

  getRecords(params?: { type?: 'SYMPTOM_CHECK' | 'BODY_ANALYSIS'; q?: string; limit?: number }) {
    const sp = new URLSearchParams()
    if (params?.type) sp.set('type', params.type)
    if (params?.q) sp.set('q', params.q)
    sp.set('limit', String(params?.limit ?? 100))
    return request<{ records: HealthRecordItem[] }>(`/api/v1/records?${sp.toString()}`)
  },

  deleteRecord(id: string) {
    return request<{ ok: boolean }>(`/api/v1/records?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  clearAllRecords() {
    return request<{ ok: boolean; deleted: number }>('/api/v1/records?all=true', {
      method: 'DELETE',
    })
  },
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
