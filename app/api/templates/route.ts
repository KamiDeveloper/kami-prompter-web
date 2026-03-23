import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/services/auth.service'
import { getTemplates, createTemplate } from '@/lib/services/templates.service'
import { z } from 'zod'

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  is_nsfw: z.boolean().optional(),
  initialContent: z.string().min(1),
  tags: z.array(z.string()).optional()
})

const parseParams = (searchParams: URLSearchParams) => {
  return {
    categoryId: searchParams.get('categoryId') || undefined,
    tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
    showNsfw: searchParams.get('showNsfw') === 'true',
    searchQuery: searchParams.get('searchQuery') || undefined,
    module: searchParams.get('module') || undefined,
    orderBy: (searchParams.get('orderBy') as 'name' | 'created_at' | 'updated_at') || undefined,
    orderDirection: (searchParams.get('orderDirection') as 'asc' | 'desc') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    
    const filters = parseParams(searchParams)
    const templates = await getTemplates(supabase, user.id, filters)
    
    return NextResponse.json({ data: templates })
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
    const result = CreateTemplateSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request', details: result.error.flatten() }, { status: 400 })
    }

    const response = await createTemplate(supabase, user.id, result.data)
    return NextResponse.json({ data: response })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
