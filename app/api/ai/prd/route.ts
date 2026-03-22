import { z } from 'zod'

import { GeminiClient, getModelString } from '@/lib/ai/gemini-client'
import { getPrdSystemPrompt } from '@/lib/ai/prompts/prd'
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server'
import { AuthError, requireAuth } from '@/lib/services/auth.service'
import { saveToHistory } from '@/lib/services/history.service'
import { resolveApiKey } from '@/lib/vault/api-keys'

const PrdSchema = z.object({
  description: z.string().min(20).max(10000),
  productType: z.string().optional(),
  targetAudience: z.string().optional(),
  techStack: z.string().optional(),
  detailLevel: z.enum(['basic', 'standard', 'exhaustive']),
  language: z.enum(['auto', 'es', 'en', 'pt']).default('auto'),
  model: z.enum(['flash', 'pro']),
  thinkingLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    const body = await request.json()
    const parsed = PrdSchema.safeParse(body)
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
      `Detail level: ${parsed.data.detailLevel}`,
      `Language: ${parsed.data.language}`,
      parsed.data.productType ? `Product type: ${parsed.data.productType}` : '',
      parsed.data.targetAudience ? `Target audience: ${parsed.data.targetAudience}` : '',
      parsed.data.techStack ? `Tech stack: ${parsed.data.techStack}` : '',
      `Product description:\n${parsed.data.description}`,
    ]
      .filter(Boolean)
      .join('\n\n')

    let fullOutput = ''
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of geminiClient.generateContentStream({
            model: getModelString(parsed.data.model),
            systemPrompt: getPrdSystemPrompt(),
            userPrompt,
            thinkingLevel: parsed.data.thinkingLevel,
            maxOutputTokens: 16384,
          })) {
            fullOutput += chunk
            controller.enqueue(encoder.encode(chunk))
          }

          await saveToHistory(supabase, {
            user_id: user.id,
            module: 'prd',
            input_prompt: parsed.data.description,
            output_prompt: fullOutput,
            model_used: parsed.data.model,
            thinking_level: parsed.data.thinkingLevel,
            metadata: {
              detailLevel: parsed.data.detailLevel,
              language: parsed.data.language,
              productType: parsed.data.productType ?? null,
              targetAudience: parsed.data.targetAudience ?? null,
              techStack: parsed.data.techStack ?? null,
            },
          })

          controller.close()
        } catch (streamError: unknown) {
          if (process.env.NODE_ENV !== 'test') {
            console.error('[AI_PRD_ROUTE_STREAM]', streamError)
          }
          controller.error(streamError)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('[AI_PRD_ROUTE]', error)
    }

    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
