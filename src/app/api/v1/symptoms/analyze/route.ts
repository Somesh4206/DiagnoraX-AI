import { NextRequest } from 'next/server'
import { z } from 'zod'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { corsJson, preflight } from '@/lib/http'
import {
  detectEmergency,
  emergencyAnalysis,
  type SymptomAnalysis,
  type SymptomInput,
} from '@/lib/engine'

export const runtime = 'nodejs'
export const maxDuration = 60

/* ---------- input ---------- */

const inputSchema = z.object({
  symptoms: z
    .string()
    .trim()
    .min(10, 'Describe your symptoms in at least 10 characters.')
    .max(2000),
  age: z.coerce.number().int().min(1).max(120).optional(),
  sex: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  duration: z
    .enum(['hours', '1-3 days', '4-7 days', '1-4 weeks', 'over a month', 'not sure'])
    .optional(),
  severity: z.coerce.number().int().min(1).max(10).optional(),
})

type Input = z.infer<typeof inputSchema>

/* ---------- output ---------- */

const analysisSchema = z.object({
  urgencyLevel: z.enum(['emergency', 'urgent', 'routine', 'low']),
  summary: z.string().min(1).max(1200),
  possibleConditions: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        likelihood: z.enum(['commonly reported', 'possible', 'less common']),
        note: z.string().max(400),
      })
    )
    .max(6),
  selfCare: z.array(z.string().min(1).max(300)).max(8),
  redFlags: z.array(z.string().min(1).max(300)).max(8),
  whenToSeekHelp: z.string().min(1).max(800),
})

type Analysis = SymptomAnalysis

/* ---------- LLM path ---------- */

function buildPrompt(input: Input): string {
  const lines = [
    `Symptoms: ${input.symptoms}`,
    input.age ? `Age: ${input.age}` : null,
    input.sex ? `Sex: ${input.sex}` : null,
    input.duration ? `Duration: ${input.duration}` : null,
    input.severity ? `Self-reported severity (1-10): ${input.severity}` : null,
  ].filter(Boolean)
  return lines.join('\n')
}

async function llmAnalysis(input: Input): Promise<Analysis> {
  const zai = await ZAI.create()

  const system = [
    'You are DiagnoraX AI, a careful health-information assistant embedded in a mobile app.',
    'LANGUAGE RULE (absolute): You MUST write EVERY word of your response in ENGLISH only. No Chinese, no other language, no exceptions.',
    'You provide health INFORMATION, never a diagnosis, never treatment prescriptions.',
    'Triage rules: if the description suggests a life-threatening situation (chest pain with breathing difficulty, stroke signs, severe bleeding, suicidal intent), set urgencyLevel to "emergency" and focus entirely on immediate-care guidance.',
    'If the description suggests something that should be seen by a professional soon (high fever days, dehydration, worsening pain), use "urgent".',
    'Common self-limiting complaints map to "routine"; minor/trivial ones to "low".',
    'possibleConditions must list commonly reported possibilities with honest likelihood wording, never probabilities or percentages.',
    'selfCare must be safe, generic, over-the-counter-level guidance only.',
    'redFlags must list the specific signs that would mean "stop self-care, get help now".',
    'Respond with ONE JSON object only, matching exactly this shape:',
    '{"urgencyLevel":"emergency|urgent|routine|low","summary":"2-4 plain sentences","possibleConditions":[{"name":"","likelihood":"commonly reported|possible|less common","note":"one sentence"}],"selfCare":["short actionable steps"],"redFlags":["specific warning signs"],"whenToSeekHelp":"one or two sentences"}',
    'No markdown, no code fences, no commentary — JSON only, in English.',
  ].join('\n')

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: buildPrompt(input) },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? ''
  if (!raw) throw new Error('The AI returned an empty response. Please try again.')

  // Strip accidental markdown fences before parsing.
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('The AI returned a malformed response. Please try again.')
  }

  const validated = analysisSchema.safeParse(parsed)
  if (!validated.success) {
    throw new Error('The AI returned an unexpected structure. Please try again.')
  }
  return validated.data
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('The analysis took too long. Please try again.')), ms)
    ),
  ])
}

/* ---------- route ---------- */

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return corsJson({ error: 'Invalid JSON body.' }, 400)
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return corsJson(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      400
    )
  }
  const input: SymptomInput = parsed.data

  const isEmergency = detectEmergency(input.symptoms)
  let analysis: Analysis
  let engine: 'emergency-triage' | 'ai-llm'

  if (isEmergency) {
    analysis = emergencyAnalysis()
    engine = 'emergency-triage'
  } else {
    try {
      analysis = await withTimeout(llmAnalysis(input), 45_000)
      engine = 'ai-llm'
    } catch (err) {
      return corsJson(
        { error: err instanceof Error ? err.message : 'The analysis failed. Please try again.' },
        502
      )
    }
  }

  // Persist to local history (best-effort — an analysis is still returned
  // even if persistence hiccups).
  let recordId: string | null = null
  try {
    const record = await db.healthRecord.create({
      data: {
        type: 'SYMPTOM_CHECK',
        title: input.symptoms.slice(0, 120),
        summary: analysis.summary.slice(0, 300),
        severity: analysis.urgencyLevel,
        data: JSON.stringify({ input, analysis, engine }),
      },
    })
    recordId = record.id
  } catch {
    // non-fatal
  }

  return corsJson({ analysis, engine, recordId, savedAt: new Date().toISOString() })
}

export function OPTIONS() {
  return preflight()
}
