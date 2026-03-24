import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGenerateContent = vi.fn()
const mockGenerateContentStream = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
      generateContentStream: mockGenerateContentStream,
    }
  },
  ThinkingLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  },
  HarmCategory: {
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  },
  HarmBlockThreshold: {
    BLOCK_NONE: 'BLOCK_NONE',
  },
}))

import { GeminiClient, getModelString, mapGeminiError } from '@/lib/ai/gemini-client'

describe('gemini-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('getModelString flash retorna gemini-3-flash-preview', () => {
    expect(getModelString('flash')).toBe('gemini-3-flash-preview')
  })

  it('getModelString pro retorna gemini-3.1-pro-preview', () => {
    expect(getModelString('pro')).toBe('gemini-3.1-pro-preview')
  })

  it('mapGeminiError con status 429 retorna RATE_LIMIT con retryAfter', () => {
    const mapped = mapGeminiError({ status: 429, message: 'limit' })
    expect(mapped.code).toBe('RATE_LIMIT')
    expect(mapped.retryAfter).toBeDefined()
  })

  it('mapGeminiError con status 401 retorna INVALID_KEY', () => {
    const mapped = mapGeminiError({ status: 401, message: 'invalid' })
    expect(mapped.code).toBe('INVALID_KEY')
  })

  it('mapGeminiError con status 403 retorna INVALID_KEY', () => {
    const mapped = mapGeminiError({ status: 403, message: 'forbidden' })
    expect(mapped.code).toBe('INVALID_KEY')
  })

  it('mapGeminiError con timeout retorna TIMEOUT', () => {
    const mapped = mapGeminiError({ message: 'Request timeout' })
    expect(mapped.code).toBe('TIMEOUT')
  })

  it('mapGeminiError con status 500 retorna SERVER_ERROR', () => {
    const mapped = mapGeminiError({ status: 500, message: 'internal' })
    expect(mapped.code).toBe('SERVER_ERROR')
  })

  it('mapGeminiError redacta API keys en el mensaje', () => {
    const fakeKey = 'AIza' + 'A'.repeat(35)
    const mapped = mapGeminiError({ status: 500, message: `error with ${fakeKey}` })
    expect(mapped.message).not.toContain(fakeKey)
  })

  it('mapGeminiError con error desconocido retorna SERVER_ERROR', () => {
    const mapped = mapGeminiError('boom')
    expect(mapped.code).toBe('SERVER_ERROR')
  })

  it('generateContent retorna texto cuando el SDK responde text', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'hola' })
    const client = new GeminiClient('key')

    await expect(
      client.generateContent({
        model: 'gemini-3-flash-preview',
        systemPrompt: 'sys',
        userPrompt: 'user',
        thinkingLevel: 'LOW',
      }),
    ).resolves.toBe('hola')

    const firstCallConfig = mockGenerateContent.mock.calls[0][0] as {
      config?: { safetySettings?: unknown }
    }
    expect(firstCallConfig.config?.safetySettings).toBeUndefined()
  })

  it('generateContent aplica safetySettings cuando NSFW está habilitado', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'ok' })
    const client = new GeminiClient('key', { allowNsfw: true })

    await client.generateContent({
      model: 'gemini-3-flash-preview',
      systemPrompt: 'sys',
      userPrompt: 'user',
      thinkingLevel: 'LOW',
    })

    const firstCallConfig = mockGenerateContent.mock.calls[0][0] as {
      config?: {
        safetySettings?: Array<{ category: string; threshold: string }>
      }
    }

    expect(firstCallConfig.config?.safetySettings).toEqual([
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ])
  })

  it('generateContent reintenta en 429 y luego retorna éxito', async () => {
    vi.useFakeTimers()
    mockGenerateContent.mockRejectedValueOnce({ status: 429, message: 'limit' }).mockResolvedValueOnce({ text: 'ok' })

    const client = new GeminiClient('key')
    const promise = client.generateContent({
      model: 'gemini-3-flash-preview',
      systemPrompt: 'sys',
      userPrompt: 'user',
      thinkingLevel: 'MEDIUM',
    })

    const assertion = expect(promise).resolves.toBe('ok')
    await vi.runAllTimersAsync()
    await assertion
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  })

  it('generateContent no reintenta en 401 y lanza INVALID_KEY', async () => {
    mockGenerateContent.mockRejectedValueOnce({ status: 401, message: 'invalid key' })

    const client = new GeminiClient('key')
    const promise = client.generateContent({
      model: 'gemini-3-flash-preview',
      systemPrompt: 'sys',
      userPrompt: 'user',
      thinkingLevel: 'LOW',
    })

    await expect(promise).rejects.toMatchObject({ code: 'INVALID_KEY' })
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
  })

  it('generateContent con 500 repetido agota reintentos en 3 intentos', async () => {
    vi.useFakeTimers()
    mockGenerateContent
      .mockRejectedValueOnce({ status: 500, message: 'e1' })
      .mockRejectedValueOnce({ status: 500, message: 'e2' })
      .mockRejectedValueOnce({ status: 500, message: 'e3' })

    const client = new GeminiClient('key')
    const promise = client.generateContent({
      model: 'gemini-3-flash-preview',
      systemPrompt: 'sys',
      userPrompt: 'user',
      thinkingLevel: 'HIGH',
    })

    const assertion = expect(promise).rejects.toMatchObject({ code: 'SERVER_ERROR' })
    await vi.runAllTimersAsync()
    await assertion
    expect(mockGenerateContent).toHaveBeenCalledTimes(3)
  })

  it('generateContent con response.text undefined retorna string vacío', async () => {
    mockGenerateContent.mockResolvedValueOnce({})
    const client = new GeminiClient('key')

    await expect(
      client.generateContent({
        model: 'gemini-3-flash-preview',
        systemPrompt: 'sys',
        userPrompt: 'user',
        thinkingLevel: 'LOW',
      }),
    ).resolves.toBe('')
  })

  it('generateContentStream emite chunks en orden', async () => {
    async function* streamGenerator() {
      yield { text: 'uno' }
      yield { text: 'dos' }
      yield { text: 'tres' }
    }

    mockGenerateContentStream.mockResolvedValueOnce(streamGenerator())
    const client = new GeminiClient('key')
    const chunks: string[] = []

    await (async () => {
      for await (const chunk of client.generateContentStream({
        model: 'gemini-3-flash-preview',
        systemPrompt: 'sys',
        userPrompt: 'user',
        thinkingLevel: 'LOW',
      })) {
        chunks.push(chunk)
      }
    })()

    expect(chunks).toEqual(['uno', 'dos', 'tres'])
  })

  it('generateContentStream mapea errores del SDK', async () => {
    mockGenerateContentStream.mockRejectedValueOnce({ status: 401, message: 'invalid' })

    const client = new GeminiClient('key')
    const iterate = async () => {
      for await (const _chunk of client.generateContentStream({
        model: 'gemini-3-flash-preview',
        systemPrompt: 'sys',
        userPrompt: 'user',
        thinkingLevel: 'LOW',
      })) {
        // noop
      }
    }

    await expect(iterate()).rejects.toMatchObject({ code: 'INVALID_KEY' })
  })

  it('verifyKey retorna true cuando generateContent resuelve', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'OK' })
    const client = new GeminiClient('key')
    const result = await client.verifyKey()
    expect(result).toBe(true)
  })

  it('verifyKey retorna false cuando generateContent falla', async () => {
    vi.useFakeTimers()
    mockGenerateContent.mockRejectedValueOnce({ status: 500, message: 'fail' })
    const client = new GeminiClient('key')
    const promise = client.verifyKey()
    await vi.runAllTimersAsync()
    const result = await promise
    expect(result).toBe(false)
  })
})
