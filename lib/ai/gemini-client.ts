import { GoogleGenAI } from '@google/genai'

import { buildThinkingConfig } from '@/lib/ai/thinking'
import type { AIError, ModelKey, ThinkingLevelKey } from '@/types'

interface GenerateParams {
  model: 'gemini-3-flash-preview' | 'gemini-3.1-pro-preview'
  systemPrompt: string
  userPrompt: string
  thinkingLevel: ThinkingLevelKey
  maxOutputTokens?: number
}

interface GeminiErrorLike {
  status?: number
  message?: string
}

const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422])

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sanitizeMessage(message: string): string {
  return message.replace(/AIza[0-9A-Za-z-_]{20,}/g, '[REDACTED]')
}

function extractError(error: unknown): GeminiErrorLike {
  if (!isObject(error)) {
    return { message: 'Unknown error' }
  }

  const status = typeof error.status === 'number' ? error.status : undefined
  const message = typeof error.message === 'string' ? sanitizeMessage(error.message) : 'Unknown error'

  return { status, message }
}

/**
 * Mapea errores internos del SDK a errores de dominio de la app.
 * @param error Error capturado de Gemini.
 * @returns Error tipado para la capa de aplicacion.
 */
export function mapGeminiError(error: unknown): AIError {
  const parsed = extractError(error)

  if (parsed.status === 429) {
    return {
      code: 'RATE_LIMIT',
      message: 'Rate limit exceeded. Please retry later.',
      retryAfter: 10,
    }
  }

  if (parsed.status === 401 || parsed.status === 403) {
    return {
      code: 'INVALID_KEY',
      message: 'Invalid API key.',
    }
  }

  if (parsed.message?.toLowerCase().includes('timeout')) {
    return {
      code: 'TIMEOUT',
      message: 'Request timed out. Please retry.',
    }
  }

  return {
    code: 'SERVER_ERROR',
    message: 'AI service error.',
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Resuelve el nombre de modelo Gemini segun el selector interno.
 * @param model Clave de modelo de la aplicacion.
 * @returns Nombre de modelo Gemini para el SDK.
 */
export function getModelString(model: ModelKey): 'gemini-3-flash-preview' | 'gemini-3.1-pro-preview' {
  return model === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview'
}

/**
 * Cliente de alto nivel para interaccion con Gemini SDK.
 */
export class GeminiClient {
  private readonly ai: GoogleGenAI

  /**
   * Inicializa el cliente Gemini con API key del usuario.
   * @param apiKey API key privada recuperada desde Vault.
   * @returns Instancia de GeminiClient.
   */
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey })
  }

  /**
   * Ejecuta una generacion no streaming con retries para errores transitorios.
   * @param params Parametros completos de generacion.
   * @returns Texto generado por el modelo.
   */
  async generateContent(params: GenerateParams): Promise<string> {
    const maxAttempts = 3
    const baseDelay = 500

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await withTimeout(
          this.ai.models.generateContent({
            model: params.model,
            contents: [
              {
                role: 'user',
                parts: [{ text: params.userPrompt }],
              },
            ],
            config: {
              systemInstruction: params.systemPrompt,
              maxOutputTokens: params.maxOutputTokens,
              ...buildThinkingConfig(params.thinkingLevel),
            },
          }),
          60_000,
        )

        return response.text ?? ''
      } catch (error) {
        const parsed = extractError(error)
        const status = parsed.status
        const canRetry = status === 429 || (typeof status === 'number' && status >= 500)

        if (!canRetry || NON_RETRYABLE_STATUS.has(status ?? -1) || attempt === maxAttempts) {
          throw mapGeminiError(error)
        }

        const backoff = baseDelay * 2 ** (attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }

    throw {
      code: 'SERVER_ERROR',
      message: 'Unexpected AI retry exhaustion',
    } satisfies AIError
  }

  /**
   * Ejecuta una generacion en streaming con retries para errores transitorios.
   * @param params Parametros completos de generacion.
   * @returns Generador asincrono de fragmentos de texto.
   */
  async *generateContentStream(params: GenerateParams): AsyncGenerator<string> {
    const maxAttempts = 3
    const baseDelay = 500

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const stream = await withTimeout(
          this.ai.models.generateContentStream({
            model: params.model,
            contents: [
              {
                role: 'user',
                parts: [{ text: params.userPrompt }],
              },
            ],
            config: {
              systemInstruction: params.systemPrompt,
              maxOutputTokens: params.maxOutputTokens,
              ...buildThinkingConfig(params.thinkingLevel),
            },
          }),
          120_000,
        )

        for await (const chunk of stream) {
          if (chunk.text) {
            yield chunk.text
          }
        }

        return
      } catch (error) {
        const parsed = extractError(error)
        const status = parsed.status
        const canRetry = status === 429 || (typeof status === 'number' && status >= 500)

        if (!canRetry || NON_RETRYABLE_STATUS.has(status ?? -1) || attempt === maxAttempts) {
          throw mapGeminiError(error)
        }

        const backoff = baseDelay * 2 ** (attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }
  }

  /**
   * Valida la API key mediante una request minima al modelo flash.
   * @param none No requiere parametros.
   * @returns true si la key es valida; false en caso contrario.
   */
  async verifyKey(): Promise<boolean> {
    try {
      await this.generateContent({
        model: 'gemini-3-flash-preview',
        systemPrompt: 'You are a health-check assistant. Return OK.',
        userPrompt: 'OK',
        thinkingLevel: 'LOW',
        maxOutputTokens: 8,
      })
      return true
    } catch {
      return false
    }
  }
}
