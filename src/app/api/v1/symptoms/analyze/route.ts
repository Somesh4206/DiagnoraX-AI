import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export const DISCLAIMER =
  'DiagnoraX AI provides health information, not medical advice. It is not a substitute for professional diagnosis or treatment. In an emergency, contact your local emergency services immediately.'

/* ---------- validation ---------- */

const inputSchema = z.object({
  symptoms: z.string().trim().min(10, 'Describe your symptoms in at least 10 characters.').max(2000),
  age: z.number().int().min(1).max(120).optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
  duration: z.string().trim().max(60).optional(),
  severity: z.number().int().min(1).max(10).optional(),
})

const analysisSchema = z.object({
  urgencyLevel: z.enum(['emergency', 'urgent', 'routine', 'low']),
  summary: z.string().min(1),
  possibleConditions: z
    .array(
      z.object({
        name: z.string().min(1),
        likelihood: z.enum(['commonly reported', 'possible', 'less common']),
        note: z.string().optional(),
      })
    )
    .max(6),
  selfCare: z.array(z.string().min(1)).max(8),
  redFlags: z.array(z.string().min(1)).max(8),
  whenToSeekHelp: z.string().min(1),
})

type Analysis = z.infer<typeof analysisSchema>

/* ---------- emergency triage (deterministic, runs BEFORE any AI call) ---------- */

const EMERGENCY_RE =
  /\b(chest pain|chest pressure|crushing chest|can'?t breathe|cannot breathe|difficulty breathing|trouble breathing|struggling to breathe|severe bleeding|bleeding heavily|unconscious|unresponsive|passed out|seizure|convulsion|convulsions|stroke|face drooping|face droop|slurred speech|numbness on one side|one side is numb|sudden weakness on one side|suicidal|suicide|kill myself|end my life|overdose|poisoning|poisoned|anaphylaxis|anaphylactic|severe allergic reaction|throat closing|throat is closing|tongue swelling|coughing blood|coughing up blood|vomiting blood|worst headache of my life)\b/i

function emergencyAnalysis(): Analysis {
  return {
    urgencyLevel: 'emergency',
    summary:
      "Your description includes signs that can indicate a medical emergency. This tool cannot rule anything out, and for signs like these the safe assumption is that it needs professional attention right now — not later, and not from a chat window.",
    possibleConditions: [],
    selfCare: [
      'Call your local emergency number (112 / 911 / 999 — whichever applies to you) right now. Do not wait to see if it improves.',
      'Do not drive yourself. Stay where you are, or have someone stay with you.',
      'If this involves chest pain, severe bleeding, or trouble breathing: keep still, sit or lie down, and wait for help.',
      'If someone can collect them, have a list of your medications and any allergies ready for the responders.',
    ],
    redFlags: [
      'Any new confusion, fainting, or unresponsiveness',
      'Symptoms suddenly getting much worse',
      'Trouble breathing becoming severe',
    ],
    whenToSeekHelp:
      'Immediately. This guidance deliberately assumes the worst — that is what emergency triage means.',
  }
}

/* ---------- LLM analysis ---------- */

const SYSTEM_PROMPT = `You are DiagnoraX AI, a health information assistant inside a consumer app. You provide INFORMATION, never diagnoses.

Hard rules:
- Hedged, patient-facing language only ("commonly reported with", "often seen alongside"). Never state that the user HAS a condition.
- If the description suggests a life-threatening situation (chest pain with breathing difficulty, stroke signs, severe bleeding, suicidal intent), set urgencyLevel to "emergency" and focus entirely on immediate-care guidance.
- possibleConditions: 0-4 entries, most commonly reported first. Everyday, non-alarming conditions only (e.g. tension headache, not brain tumor).
- Plain language at an 8th-grade reading level. No lectures, no judgement about weight or habits.
- Respond ONLY with minified JSON. No markdown fences, no commentary before or after.

The JSON must match exactly this shape:
{"urgencyLevel":"emergency|urgent|routine|low","summary":"2-4 sentence plain-language summary","possibleConditions":[{"name":"...","likelihood":"commonly reported|possible|less common","note":"one short sentence"}],"selfCare":["..."],"redFlags":["..."],"whenToSeekHelp":"1-3 sentences"}
- selfCare: 2-5 practical items. redFlags: 2-4 items that should prompt urgent re-evaluation.`

async function llmAnalysis(input: z.infer<typeof inputSchema>): Promise<Analysis> {
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Symptom description follows. Analyze and return ONLY the JSON.\n\n${JSON.stringify({
          symptoms: input.symptoms,
          age: input.age,
          sex: input.sex,
          duration: input.duration,
          severity: input.severity,
        })}`,
      },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('empty')

  // strip accidental markdown fences, find first { ... last }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('unparseable')
  const jsonText = raw.slice(start, end + 1)
  const parsed: unknown = JSON.parse(jsonText)
  const checked = analysisSchema.safeParse(parsed)
  if (!checked.success) throw new Error('shape')
  return checked.data
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

/* ---------- route ---------- */

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = inputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    )
  }
  const input = parsed.data

  const isEmergency = EMERGENCY_RE.test(input.symptoms)
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
      const msg = err instanceof Error ? err.message : 'unknown'
      if (msg === 'timeout') {
        return NextResponse.json(
          { error: 'The AI took too long to respond. Please try again.' },
          { status: 504 }
        )
      }
      return NextResponse.json(
        {
          error:
            'The AI service is unavailable or returned an unreadable response. Please try again in a moment.',
        },
        { status: 502 }
      )
    }
  }

  const title = input.symptoms.slice(0, 60) + (input.symptoms.length > 60 ? '…' : '')
  const summary =
    analysis.summary.slice(0, 180) + (analysis.summary.length > 180 ? '…' : '')

  const record = await db.healthRecord.create({
    data: {
      type: 'SYMPTOM_CHECK',
      title,
      summary,
      severity: analysis.urgencyLevel,
      data: JSON.stringify({ engine, input, analysis }),
    },
  })

  return NextResponse.json(
    {
      recordId: record.id,
      engine,
      analysis,
      disclaimer: DISCLAIMER,
      createdAt: record.createdAt.toISOString(),
    },
    { status: 201 }
  )
}
