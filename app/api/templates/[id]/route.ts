import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/services/auth.service'
import { getTemplateById, updateTemplate, softDeleteTemplate } from '@/lib/services/templates.service'
import { z } from 'zod'

const UpdateTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  is_nsfw: z.boolean().optional(),
})

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { id } = await context.params
    
    // Corregido: params.id va ANTES que user.id
    const template = await getTemplateById(supabase, id, user.id)
    return NextResponse.json({ data: template })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { id } = await context.params
    
    const body = await req.json()
    const result = UpdateTemplateSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request', details: result.error.flatten() }, { status: 400 })
    }

    // Corregido: params.id va ANTES que user.id
    type UpdateData = Parameters<typeof updateTemplate>
    const updated = await updateTemplate(
      supabase, 
      id, 
      user.id, 
      result.data as UpdateData[3]
    )
    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { id } = await context.params
    
    // Corregido: Uso de softDeleteTemplate y orden de argumentos correcto
    await softDeleteTemplate(supabase, id, user.id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}