/* DiagnoraX AI — typed API client (frontend).
 * All endpoints are same-origin relative paths served by this Next.js app. */

import type { UrgencyLevel } from './ui-bits'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    })
  } catch {
    throw new ApiError(0, 'Network error — could not reach the server.')
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status}).`
    try {
      const body = (await res.json()) as { error?: string; message?: string }
      if (body && (body.error || body.message)) msg = body.error ?? body.message ?? msg
    } catch {
      /* keep default message */
    }
    throw new ApiError(res.status, msg)
  }
  return (await res.json()) as T
}

/* ---------- shared types ---------- */

export type Sex = 'male' | 'female' | 'other' | 'unspecified'

export interface PossibleCondition {
  name: string
  likelihood: 'commonly reported' | 'possible' | 'less common'
  note?: string
}

export interface SymptomAnalysis {
  urgencyLevel: UrgencyLevel
  summary: string
  possibleConditions: PossibleCondition[]
  selfCare: string[]
  redFlags: string[]
  whenToSeekHelp: string
}

export interface SymptomAnalyzeInput {
  symptoms: string
  age?: number
  sex?: Sex
  duration?: string
  severity?: number
}

export interface SymptomAnalyzeResponse {
  recordId: string
  engine: 'emergency-triage' | 'ai-llm'
  analysis: SymptomAnalysis
  disclaimer: string
  createdAt: string
}

export type CategoryKey = 'underweight' | 'normal' | 'overweight' | 'obese'

export interface BodyAnalysisInput {
  heightCm: number
  weightKg: number
  age?: number
  sex?: Sex
}

export interface BodyAnalysisResult {
  bmi: number
  category: string
  categoryKey: CategoryKey
  healthyWeight: { min: number; max: number }
  recommendations: string[]
  caveats: string[]
}

export interface BodyAnalyzeResponse {
  recordId: string
  result: BodyAnalysisResult
  createdAt: string
}

export type HealthRecordType = 'SYMPTOM_CHECK' | 'BODY_ANALYSIS'

export interface HealthRecordItem {
  id: string
  type: HealthRecordType
  title: string
  summary: string
  severity: string | null
  createdAt: string
  data: Record<string, unknown> & {
    analysis?: SymptomAnalysis
    result?: BodyAnalysisResult
  }
}

/* ---------- endpoints ---------- */

export const api = {
  analyzeSymptoms(input: SymptomAnalyzeInput) {
    return jsonFetch<SymptomAnalyzeResponse>('/api/v1/symptoms/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  analyzeBody(input: BodyAnalysisInput) {
    return jsonFetch<BodyAnalyzeResponse>('/api/v1/body/analysis', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  listRecords(params: { type?: HealthRecordType; q?: string; limit?: number } = {}) {
    const qs = new URLSearchParams()
    if (params.type) qs.set('type', params.type)
    if (params.q) qs.set('q', params.q)
    if (params.limit) qs.set('limit', String(params.limit))
    return jsonFetch<{ records: HealthRecordItem[] }>(`/api/v1/records?${qs.toString()}`)
  },

  deleteRecord(id: string) {
    return jsonFetch<{ ok: true }>(`/api/v1/records?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
