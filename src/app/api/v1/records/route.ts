import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const querySchema = z.object({
  type: z.enum(['SYMPTOM_CHECK', 'BODY_ANALYSIS']).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

function parseData(raw: string): Record<string, unknown> {
  try {
    const v: unknown = JSON.parse(raw)
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
    return {}
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const parsed = querySchema.safeParse({
    type: sp.get('type') ?? undefined,
    q: sp.get('q') ?? undefined,
    limit: sp.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters.' }, { status: 400 })
  }
  const { type, q, limit } = parsed.data

  const whereAnd: Record<string, unknown>[] = []
  if (type) whereAnd.push({ type })
  if (q) {
    whereAnd.push({
      OR: [{ title: { contains: q } }, { summary: { contains: q } }],
    })
  }

  const rows = await db.healthRecord.findMany({
    where: whereAnd.length ? { AND: whereAnd } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit ?? 50,
  })

  return NextResponse.json({
    records: rows.map((r) => ({
      id: r.id,
      type: r.type as 'SYMPTOM_CHECK' | 'BODY_ANALYSIS',
      title: r.title,
      summary: r.summary,
      severity: r.severity,
      createdAt: r.createdAt.toISOString(),
      data: parseData(r.data),
    })),
  })
}

export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  // Clear-all (privacy feature in the mobile app's Profile screen)
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
  } catch (err) {
    // P2025: record not found
    const code = (err as { code?: string })?.code
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Record not found.' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
