import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

/* ---------- validation ---------- */

const inputSchema = z.object({
  heightCm: z.number().min(90, 'Height must be at least 90 cm.').max(250, 'Height must be at most 250 cm.'),
  weightKg: z.number().min(25, 'Weight must be at least 25 kg.').max(400, 'Weight must be at most 400 kg.'),
  age: z.number().int().min(1).max(120).optional(),
  sex: z.enum(['male', 'female', 'other']).optional(),
})

/* ---------- deterministic BMI (no AI, ever) ---------- */

const RECOMMENDATIONS: Record<string, string[]> = {
  underweight: [
    'Consider energy-dense, nutrient-rich meals — nuts, olive oil, avocado, whole dairy.',
    'Several smaller meals often beat forcing large ones.',
    'Strength training helps add healthy mass, not just calories.',
    'If you keep losing weight without trying, bring it up with a doctor.',
  ],
  normal: [
    'Maintain your current routine — consistency beats intensity.',
    'Aim for roughly 150 minutes of moderate activity per week.',
    'Steady sleep and hydration quietly drive weight more than most diets.',
    'Re-log BMI monthly and watch the trend, not any single number.',
  ],
  overweight: [
    'A modest 5–10% weight reduction meaningfully improves most health markers.',
    'Change one sustainable habit at a time (evening snacks, daily walks).',
    'Protein and fiber keep you fuller on fewer calories.',
    'Movement you actually enjoy beats a gym membership you resent.',
  ],
  obese: [
    'Consider professional support — doctors and dietitians have far better tools than willpower advice.',
    'Small, steady changes outperform crash diets almost every time.',
    'Discuss screening for related markers (blood pressure, glucose, lipids) with a doctor.',
    'Any movement counts. Start where you are, not where a plan says you should be.',
  ],
}

const CAVEATS = [
  'BMI is a screening number — it does not measure body composition or fat distribution.',
  'It can misclassify athletic people with high muscle mass.',
  'It is not calibrated for children, pregnancy, or older adults without professional context.',
  'Some populations use lower overweight/obesity cutoffs; absolute BMI ranges are not universal.',
]

const round1 = (n: number) => Math.round(n * 10) / 10

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

  const h = heightCm / 100
  const bmi = round1(weightKg / (h * h))

  let categoryKey: 'underweight' | 'normal' | 'overweight' | 'obese'
  let category: string
  if (bmi < 18.5) {
    categoryKey = 'underweight'
    category = 'Underweight'
  } else if (bmi < 25) {
    categoryKey = 'normal'
    category = 'Normal weight'
  } else if (bmi < 30) {
    categoryKey = 'overweight'
    category = 'Overweight'
  } else if (bmi < 35) {
    categoryKey = 'obese'
    category = 'Obesity · Class I'
  } else if (bmi < 40) {
    categoryKey = 'obese'
    category = 'Obesity · Class II'
  } else {
    categoryKey = 'obese'
    category = 'Obesity · Class III'
  }

  const healthyWeight = {
    min: round1(18.5 * h * h),
    max: round1(24.9 * h * h),
  }

  const result = {
    bmi,
    category,
    categoryKey,
    healthyWeight,
    recommendations: RECOMMENDATIONS[categoryKey],
    caveats: CAVEATS,
  }

  const title = `BMI ${bmi.toFixed(1)} · ${category}`
  const summary = `BMI ${bmi.toFixed(1)} (${category}) at ${heightCm} cm / ${weightKg} kg. Healthy weight range: ${healthyWeight.min}–${healthyWeight.max} kg.`

  const record = await db.healthRecord.create({
    data: {
      type: 'BODY_ANALYSIS',
      title,
      summary,
      severity: category,
      data: JSON.stringify({ engine: 'deterministic', input: { heightCm, weightKg }, result }),
    },
  })

  return NextResponse.json(
    {
      recordId: record.id,
      result,
      createdAt: record.createdAt.toISOString(),
    },
    { status: 201 }
  )
}
