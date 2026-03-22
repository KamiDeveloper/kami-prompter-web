import { z } from 'zod'

import { GeminiClient } from '@/lib/ai/gemini-client'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/services/auth.service'
import { updateApiKeyValidity } from '@/lib/services/settings.service'
import { retrieveApiKey } from '@/lib/vault/api-keys'

const VerifyKeySchema = z.object({
  keyType: z.enum(['flash_free', 'pro_paid']),
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const body = await request.json()
    const parsed = VerifyKeySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceRoleClient()
    const apiKey = await retrieveApiKey({
      userId: user.id,
      keyType: parsed.data.keyType,
      serviceClient,
    })

    if (!apiKey) {
      return Response.json({ error: 'API_KEY_NOT_CONFIGURED' }, { status: 422 })
    }

    const geminiClient = new GeminiClient(apiKey)
    const isValid = await geminiClient.verifyKey()

    await updateApiKeyValidity(supabase, user.id, parsed.data.keyType, isValid)

    return Response.json({ data: { isValid } })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('[KEYS_VERIFY_ROUTE]', error)
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
