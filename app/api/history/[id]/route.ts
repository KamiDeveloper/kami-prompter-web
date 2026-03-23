import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/services/auth.service'
import { deleteHistoryEntry, getHistoryEntryById } from '@/lib/services/history.service'

const ParamsSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const parsed = ParamsSchema.safeParse(await context.params)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid history id' }, { status: 400 })
    }

    const item = await getHistoryEntryById(supabase, parsed.data.id, user.id)

    if (!item) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 })
    }

    return NextResponse.json({ data: item })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const parsed = ParamsSchema.safeParse(await context.params)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid history id' }, { status: 400 })
    }

    await deleteHistoryEntry(supabase, parsed.data.id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
