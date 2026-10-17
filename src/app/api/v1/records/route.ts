import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const typeSchema = z.enum(['SYMPTOM_CHECK', 'BODY_ANALYSIS'])

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const typeRaw = sp.get('type')
  const q = sp.get('q')?.trim() ?? ''
  const limitRaw = sp.get('limit')

  let type: z.infer<typeof typeSchema> | undefined
  if (typeRaw) {
    const parsed = typeSchema.safeParse(typeRaw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid type filter.' }, { status: 400 })
    }
    type = parsed.data
  }

  let limit = 100
  if (limitRaw) {
    const n = Number(limitRaw)
    if (!Number.isFinite(n) || n < 1 || n > 200) {
      return NextResponse.json({ error: 'limit must be 1-200.' }, { status: 400 })
    }
    limit = Math.floor(n)
  }

  const records = await db.healthRecord.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { summary: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({
    records: records.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      summary: r.summary,
      severity: r.severity,
      data: r.data,
      createdAt: r.createdAt.toISOString(),
    })),
  })
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  // Clear-all (privacy feature in the Profile screen)
  if (sp.get('all') === 'true') {
    const res = await db.healthRecord.deleteMany({})
    return NextResponse.json({ ok: true, deleted: res.count })
  }

  const id = sp.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing record id.' }, { status: 400 })
  }

  try {
    await db.healthRecord.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Record not found.' }, { status: 404 })
    }
    throw err
  }
}
