import { z } from 'zod'

import { GeminiClient } from '@/lib/ai/gemini-client'
import { getSuggestTagsSystemPrompt } from '@/lib/ai/prompts/templates'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/services/auth.service'
import { retrieveApiKey } from '@/lib/vault/api-keys'

const SuggestTagsSchema = z.object({
  templateName: z.string().min(1).max(200),
  promptContent: z.string().min(1).max(50000),
  existingTags: z.array(z.string()).default([]),
})

function parseTagsPayload(raw: string) {
  const sanitized = raw.replace(/```json|```/g, '').trim()
  const candidate = sanitized.match(/\{[\s\S]*\}/)?.[0] ?? sanitized
  return JSON.parse(candidate) as { suggestedTags: string[] }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const body = await request.json()
    const parsed = SuggestTagsSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceRoleClient()
    const apiKey = await retrieveApiKey({
      userId: user.id,
      keyType: 'flash_free',
      serviceClient,
    })

    if (!apiKey) {
      return Response.json({ error: 'API_KEY_NOT_CONFIGURED', keyType: 'flash_free' }, { status: 422 })
    }

    const geminiClient = new GeminiClient(apiKey)
    const userPrompt = [
      `Template name: ${parsed.data.templateName}`,
      `Current tags: ${parsed.data.existingTags.join(', ') || 'none'}`,
      'Template content:',
      parsed.data.promptContent,
    ].join('\n\n')

    const raw = await geminiClient.generateContent({
      model: 'gemini-3-flash-preview',
      systemPrompt: getSuggestTagsSystemPrompt(),
      userPrompt,
      thinkingLevel: 'LOW',
      maxOutputTokens: 512,
    })

    const payload = parseTagsPayload(raw)
    return Response.json({ data: payload })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('[AI_SUGGEST_TAGS_ROUTE]', error)
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
