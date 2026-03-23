import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/services/auth.service'
import { getUserSettings, updateUserSettings } from '@/lib/services/settings.service'
import { z } from 'zod'

const SettingsUpdateSchema = z.object({
  default_model: z.enum(['flash', 'pro']).optional(),
  default_thinking_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  use_paid_key_for_all: z.boolean().optional(),
  show_nsfw: z.boolean().optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  default_export_format: z.string().optional(),
  prd_default_detail: z.enum(['basic', 'standard', 'exhaustive']).optional(),
  prd_default_language: z.string().optional(),
})

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const settings = await getUserSettings(supabase, user.id)
    return NextResponse.json({ data: settings })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)
    
    const body = await req.json()
    const result = SettingsUpdateSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request', details: result.error.flatten() }, { status: 400 })
    }

    const updated = await updateUserSettings(supabase, user.id, result.data)
    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
