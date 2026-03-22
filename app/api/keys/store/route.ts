import { z } from 'zod'

import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/services/auth.service'
import { storeApiKey } from '@/lib/vault/api-keys'

const StoreKeySchema = z.object({
  keyType: z.enum(['flash_free', 'pro_paid']),
  apiKey: z.string().min(10).max(500),
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const body = await request.json()
    const parsed = StoreKeySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceRoleClient()
    const result = await storeApiKey({
      userId: user.id,
      keyType: parsed.data.keyType,
      apiKey: parsed.data.apiKey,
      serviceClient,
    })

    if (!result.success) {
      return Response.json({ error: 'Unable to store API key' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('[KEYS_STORE_ROUTE]', error)
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
