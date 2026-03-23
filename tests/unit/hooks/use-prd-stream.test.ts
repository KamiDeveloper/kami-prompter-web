import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePrdStream } from '@/hooks/use-prd-stream'
import { useSettingsStore } from '@/lib/store/settings.store'

import {
  createFetchMock,
  mockJsonFetch,
  renderHookHarness,
  runHookAction,
  waitForCondition,
} from '@/tests/unit/hooks/hook-harness'

function mockStreamFetch(fetchMock: ReturnType<typeof createFetchMock>, chunks: string[]): void {
  const encoder = new TextEncoder()
  let index = 0

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close()
        return
      }

      controller.enqueue(encoder.encode(chunks[index]))
      index += 1
    },
  })

  fetchMock.mockResolvedValueOnce(
    new Response(stream, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }),
  )
}

describe('usePrdStream', () => {
  const defaultStore = {
    defaultModel: 'flash' as const,
    defaultThinkingLevel: 'MEDIUM' as const,
    prdDefaultDetail: 'standard' as const,
    prdDefaultLanguage: 'auto' as const,
  }

  beforeEach(() => {
    createFetchMock()
    useSettingsStore.setState(defaultStore)
  })

  afterEach(() => {
    useSettingsStore.setState(defaultStore)
  })

  it('concatena chunks del stream en content', async () => {
    const fetchMock = createFetchMock()
    mockStreamFetch(fetchMock, ['# PRD\n', '## Seccion 1\n', 'Contenido...'])

    const hook = await renderHookHarness(() => usePrdStream())

    await runHookAction(() => hook.current.generate({ description: 'mi producto de prueba para streaming' }))
    await waitForCondition(() => hook.current.isComplete)

    expect(hook.current.content).toBe('# PRD\n## Seccion 1\nContenido...')
    expect(hook.current.error).toBeNull()

    await hook.unmount()
  })

  it('setea error cuando servidor retorna error', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { error: 'API_KEY_NOT_CONFIGURED' }, 422)

    const hook = await renderHookHarness(() => usePrdStream())

    await runHookAction(() => hook.current.generate({ description: 'descripcion valida para generar' }))
    await waitForCondition(() => hook.current.loading === false)

    expect(hook.current.error).toBe('API_KEY_NOT_CONFIGURED')
    expect(hook.current.loading).toBe(false)

    await hook.unmount()
  })

  it('exportMarkdown crea link de descarga', async () => {
    const hook = await renderHookHarness(() => usePrdStream())

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    hook.current.exportMarkdown('# Contenido del PRD')

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')

    clickSpy.mockRestore()
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    await hook.unmount()
  })

  it('reset limpia content, error y loading', async () => {
    const fetchMock = createFetchMock()
    mockStreamFetch(fetchMock, ['contenido inicial'])

    const hook = await renderHookHarness(() => usePrdStream())

    await runHookAction(() => hook.current.generate({ description: 'descripcion valida para reset' }))
    await waitForCondition(() => hook.current.isComplete)

    await runHookAction(() => hook.current.reset())

    expect(hook.current.content).toBe('')
    expect(hook.current.error).toBeNull()
    expect(hook.current.loading).toBe(false)
    expect(hook.current.isComplete).toBe(false)

    await hook.unmount()
  })
})
