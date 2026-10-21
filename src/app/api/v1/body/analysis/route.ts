import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { corsJson, preflight } from '@/lib/http'
import { computeBodyAnalysis } from '@/lib/engine'

export const runtime = 'nodejs'

/* Deterministic body analysis — BMI is arithmetic, never an AI guess. */

const inputSchema = z.object({
  heightCm: z.coerce.number().min(80, 'Height must be at least 80 cm.').max(250, 'Height must be at most 250 cm.'),
  weightKg: z.coerce.number().min(25, 'Weight must be at least 25 kg.').max(300, 'Weight must be at most 300 kg.'),
})

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

  const { heightCm, weightKg } = parsed.data
  const result = computeBodyAnalysis(heightCm, weightKg)

  let recordId: string | null = null
  try {
    const record = await db.healthRecord.create({
      data: {
        type: 'BODY_ANALYSIS',
        title: `BMI ${result.bmi.toFixed(1)} · ${result.category}`,
        summary: `For ${heightCm} cm and ${weightKg} kg. Healthy weight range: ${result.healthyRangeKg.min}–${result.healthyRangeKg.max} kg.`,
        severity: result.category,
        data: JSON.stringify({ input: { heightCm, weightKg }, result }),
      },
    })
    recordId = record.id
  } catch {
    // non-fatal
  }

  return corsJson({ result, recordId, savedAt: new Date().toISOString() })
}

export function OPTIONS() {
  return preflight()
}
