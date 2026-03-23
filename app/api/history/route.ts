import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/services/auth.service'
import { getUserHistory } from '@/lib/services/history.service'
import { z } from 'zod'

const HistoryQuerySchema = z.object({
  module: z.enum(['improver', 'builder', 'prd']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const searchParams = new URL(req.url).searchParams

    const parsed = HistoryQuerySchema.safeParse({
      module: searchParams.get('module') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    })

    const query = parsed.success
      ? parsed.data
      : {
          module: undefined,
          limit: 20,
          offset: 0,
        }

    const result = await getUserHistory(supabase, user.id, {
      module: query.module,
      limit: query.limit,
      offset: query.offset,
    })

    return NextResponse.json(result) // { data, count }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
