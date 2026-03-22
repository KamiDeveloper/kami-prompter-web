import { z } from 'zod'

import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/services/auth.service'
import { deleteApiKey } from '@/lib/vault/api-keys'

const DeleteKeySchema = z.object({
  keyType: z.enum(['flash_free', 'pro_paid']),
})

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const body = await request.json()
    const parsed = DeleteKeySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceRoleClient()
    const result = await deleteApiKey({
      userId: user.id,
      keyType: parsed.data.keyType,
      serviceClient,
    })

    if (!result.success) {
      return Response.json({ error: 'Unable to delete API key' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('[KEYS_DELETE_ROUTE]', error)
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
