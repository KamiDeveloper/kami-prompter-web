import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/services/auth.service'
import { getCategoriesForUser, createCategory } from '@/lib/services/categories.service'
import { z } from 'zod'

const CreateCategorySchema = z.object({
  name: z.string().min(1),
  emoji: z.string().optional()
})

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const categories = await getCategoriesForUser(supabase, user.id)
    return NextResponse.json({ data: categories })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    
    const body = await req.json()
    const result = CreateCategorySchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request', details: result.error.flatten() }, { status: 400 })
    }

    const newCategory = await createCategory(supabase, user.id, result.data)
    return NextResponse.json({ data: newCategory })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
