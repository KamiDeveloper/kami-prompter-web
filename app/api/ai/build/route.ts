import { z } from 'zod'

import { GeminiClient, getModelString } from '@/lib/ai/gemini-client'
import { getBuilderBuildSystemPrompt } from '@/lib/ai/prompts/builder'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/services/auth.service'
import { saveToHistory } from '@/lib/services/history.service'
import { resolveApiKey } from '@/lib/vault/api-keys'

const BuildSchema = z.object({
  credo: z.object({
    context: z.string().optional(),
    role: z.string().optional(),
    expectation: z.string().optional(),
    data: z.string().optional(),
    outputFormat: z.string().optional(),
  }),
  model: z.enum(['flash', 'pro']),
  thinkingLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

function parseBuildPayload(raw: string) {
  const sanitized = raw.replace(/```json|```/g, '').trim()
  const candidate = sanitized.match(/\{[\s\S]*\}/)?.[0] ?? sanitized
  return JSON.parse(candidate) as { assembledPrompt: string; refinedPrompt: string }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const body = await request.json()
    const parsed = BuildSchema.safeParse(body)
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
      'Build and refine a prompt using this CREDO payload:',
      JSON.stringify(parsed.data.credo, null, 2),
    ].join('\n\n')

    const raw = await geminiClient.generateContent({
      model: getModelString(parsed.data.model),
      systemPrompt: getBuilderBuildSystemPrompt(),
      userPrompt,
      thinkingLevel: parsed.data.thinkingLevel,
      maxOutputTokens: 8192,
    })

    const payload = parseBuildPayload(raw)

    await saveToHistory(supabase, {
      user_id: user.id,
      module: 'builder',
      input_prompt: JSON.stringify(parsed.data.credo),
      output_prompt: payload.refinedPrompt,
      model_used: parsed.data.model,
      thinking_level: parsed.data.thinkingLevel,
      metadata: {
        assembledPrompt: payload.assembledPrompt,
      },
    })

    return Response.json({ data: payload })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('[AI_BUILD_ROUTE]', error)
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
