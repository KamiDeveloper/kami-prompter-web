import { z } from 'zod'

import { GeminiClient, getModelString } from '@/lib/ai/gemini-client'
import { getImproverSystemPrompt } from '@/lib/ai/prompts/improver'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/services/auth.service'
import { saveToHistory } from '@/lib/services/history.service'
import { resolveApiKey } from '@/lib/vault/api-keys'

const ImproveSchema = z.object({
  prompt: z.string().min(10).max(50000),
  interventionLevel: z.enum(['subtle', 'moderate', 'aggressive']),
  model: z.enum(['flash', 'pro']),
  thinkingLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

function parseImproverPayload(raw: string) {
  const sanitized = raw.replace(/```json|```/g, '').trim()
  const candidate = sanitized.match(/\{[\s\S]*\}/)?.[0] ?? sanitized
  return JSON.parse(candidate) as {
    improvedPrompt: string
    changes: Array<{
      vector: string
      description: string
      type: 'addition' | 'removal' | 'restructure'
    }>
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const body = await request.json()
    const parsed = ImproveSchema.safeParse(body)
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
      `Intervention level: ${parsed.data.interventionLevel}`,
      'Improve the following prompt while preserving intent:',
      parsed.data.prompt,
    ].join('\n\n')

    const raw = await geminiClient.generateContent({
      model: getModelString(parsed.data.model),
      systemPrompt: getImproverSystemPrompt(),
      userPrompt,
      thinkingLevel: parsed.data.thinkingLevel,
      maxOutputTokens: 8192,
    })

    const payload = parseImproverPayload(raw)

    await saveToHistory(supabase, {
      user_id: user.id,
      module: 'improver',
      input_prompt: parsed.data.prompt,
      output_prompt: payload.improvedPrompt,
      model_used: parsed.data.model,
      thinking_level: parsed.data.thinkingLevel,
      metadata: {
        interventionLevel: parsed.data.interventionLevel,
        changes: payload.changes,
      },
    })

    return Response.json({
      data: {
        originalPrompt: parsed.data.prompt,
        improvedPrompt: payload.improvedPrompt,
        changes: payload.changes,
      },
    })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('[AI_IMPROVE_ROUTE]', error)
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
