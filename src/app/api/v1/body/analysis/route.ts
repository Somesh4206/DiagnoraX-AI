import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/* Deterministic body analysis — BMI is arithmetic, never an AI guess. */

const inputSchema = z.object({
  heightCm: z.coerce.number().min(80, 'Height must be at least 80 cm.').max(250, 'Height must be at most 250 cm.'),
  weightKg: z.coerce.number().min(25, 'Weight must be at least 25 kg.').max(300, 'Weight must be at most 300 kg.'),
})

const BMI_CLASSES = [
  { max: 18.5, label: 'Underweight', tone: 'warn' },
  { max: 25, label: 'Normal weight', tone: 'ok' },
  { max: 30, label: 'Overweight', tone: 'warn' },
  { max: 35, label: 'Obesity class I', tone: 'danger' },
  { max: 40, label: 'Obesity class II', tone: 'danger' },
  { max: Infinity, label: 'Obesity class III', tone: 'danger' },
] as const

function classify(bmi: number) {
  return BMI_CLASSES.find((c) => bmi < c.max)!
}

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

  const { heightCm, weightKg } = parsed.data
  const m = heightCm / 100
  const bmi = Math.round((weightKg / (m * m)) * 10) / 10

  const cls = classify(bmi)
  const healthyMin = Math.round(18.5 * m * m * 10) / 10
  const healthyMax = Math.round(24.9 * m * m * 10) / 10
  const healthyMid = Math.round(((healthyMin + healthyMax) / 2) * 10) / 10
  const deltaToMid = Math.round((bmi - healthyMid) * 10) / 10

  const recommendations: string[] = []
  if (cls.label === 'Underweight') {
    recommendations.push('Consider speaking with a healthcare provider about healthy ways to gain weight.')
    recommendations.push('Prioritise calorie-dense, nutritious foods rather than empty calories.')
  } else if (cls.label === 'Normal weight') {
    recommendations.push('You are inside the healthy band — keep doing what you are doing.')
    recommendations.push('Regular activity and balanced nutrition help you stay here.')
  } else {
    recommendations.push('Aim for gradual, sustainable change — 0.25–0.5 kg per week is a healthy pace.')
    recommendations.push('Pair balanced nutrition with regular movement you actually enjoy.')
    recommendations.push('A healthcare provider can help you build a plan that fits your life.')
  }

  const result = {
    bmi,
    category: cls.label,
    tone: cls.tone,
    healthyRangeKg: { min: healthyMin, max: healthyMax },
    midBandBmi: healthyMid,
    deltaToMid,
    formula: 'BMI = weight (kg) ÷ height² (m²)',
    caveats: [
      'BMI cannot tell muscle from fat — athletes often read "overweight" on BMI alone.',
      'It does not reflect fat distribution, age, sex, or ethnicity.',
      'BMI is a screening number, not a measure of health.',
    ],
    recommendations,
  }

  let recordId: string | null = null
  try {
    const record = await db.healthRecord.create({
      data: {
        type: 'BODY_ANALYSIS',
        title: `BMI ${bmi.toFixed(1)} · ${cls.label}`,
        summary: `For ${heightCm} cm and ${weightKg} kg. Healthy weight range: ${healthyMin}–${healthyMax} kg.`,
        severity: cls.label,
        data: JSON.stringify({ input: { heightCm, weightKg }, result }),
      },
    })
    recordId = record.id
  } catch {
    // non-fatal
  }

  return NextResponse.json({ result, recordId, savedAt: new Date().toISOString() })
}
