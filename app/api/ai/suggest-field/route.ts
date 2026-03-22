import { z } from 'zod'

import { GeminiClient, getModelString } from '@/lib/ai/gemini-client'
import { getBuilderSuggestFieldSystemPrompt } from '@/lib/ai/prompts/builder'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/services/auth.service'
import { resolveApiKey } from '@/lib/vault/api-keys'

const SuggestFieldSchema = z.object({
  field: z.enum(['context', 'role', 'expectation', 'data', 'outputFormat']),
  filledFields: z.record(z.string(), z.string().optional()),
  model: z.enum(['flash', 'pro']),
  thinkingLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

function parseSuggestPayload(raw: string) {
  const sanitized = raw.replace(/```json|```/g, '').trim()
  const candidate = sanitized.match(/\{[\s\S]*\}/)?.[0] ?? sanitized
  return JSON.parse(candidate) as { suggestion: string; explanation: string }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const body = await request.json()
    const parsed = SuggestFieldSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceRoleClient()
    const resolved = await resolveApiKey({
      userId: user.id,
      model: parsed.data.model,
      serviceClient,
    })

    if (!resolved) {
      return Response.json(
        {
          error: 'API_KEY_NOT_CONFIGURED',
          keyType: parsed.data.model === 'pro' ? 'pro_paid' : 'flash_free',
        },
        { status: 422 },
      )
    }

    const geminiClient = new GeminiClient(resolved.apiKey)
    const userPrompt = [
      `Field to suggest: ${parsed.data.field}`,
      'Current CREDO fields:',
      JSON.stringify(parsed.data.filledFields, null, 2),
    ].join('\n\n')

    const raw = await geminiClient.generateContent({
      model: getModelString(parsed.data.model),
      systemPrompt: getBuilderSuggestFieldSystemPrompt(),
      userPrompt,
      thinkingLevel: parsed.data.thinkingLevel,
      maxOutputTokens: 1024,
    })

    const payload = parseSuggestPayload(raw)
    return Response.json({ data: payload })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('[AI_SUGGEST_FIELD_ROUTE]', error)
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
