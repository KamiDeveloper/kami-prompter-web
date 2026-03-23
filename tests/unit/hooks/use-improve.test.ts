import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useImprove } from '@/hooks/use-improve'
import { useSettingsStore } from '@/lib/store/settings.store'

import {
  createFetchMock,
  mockFetchFailure,
  mockJsonFetch,
  renderHookHarness,
  runHookAction,
} from '@/tests/unit/hooks/hook-harness'

describe('useImprove', () => {
  const defaultStore = {
    defaultModel: 'flash' as const,
    defaultThinkingLevel: 'MEDIUM' as const,
  }

  beforeEach(() => {
    createFetchMock()
    useSettingsStore.setState(defaultStore)
  })

  afterEach(() => {
    useSettingsStore.setState(defaultStore)
  })

  it('hace POST a /api/ai/improve con body correcto', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, {
      data: {
        originalPrompt: 'prompt original',
        improvedPrompt: 'prompt mejorado',
        changes: [],
      },
    })

    const hook = await renderHookHarness(() => useImprove())
    const response = await runHookAction(() => hook.current.improve('prompt original', 'moderate', 'HIGH', 'pro'))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/improve',
      expect.objectContaining({ method: 'POST' }),
    )

    const call = fetchMock.mock.calls[0]
    const init = call[1] as RequestInit
    const body = JSON.parse((init.body as string) || '{}') as {
      prompt: string
      interventionLevel: string
      thinkingLevel: string
      model: string
    }

    expect(body.prompt).toBe('prompt original')
    expect(body.interventionLevel).toBe('moderate')
    expect(body.thinkingLevel).toBe('HIGH')
    expect(body.model).toBe('pro')
    expect(response.improvedPrompt).toBe('prompt mejorado')

    await hook.unmount()
  })

  it('lanza error cuando retorna 422 por API key', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { error: 'API_KEY_NOT_CONFIGURED', keyType: 'flash_free' }, 422)

    const hook = await renderHookHarness(() => useImprove())

    await expect(runHookAction(() => hook.current.improve('prompt valido y largo para test'))).rejects.toThrow('API_KEY_NOT_CONFIGURED')

    await hook.unmount()
  })

  it('lanza error cuando retorna 500', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { error: 'Internal server error' }, 500)

    const hook = await renderHookHarness(() => useImprove())

    await expect(runHookAction(() => hook.current.improve('prompt valido y largo para test'))).rejects.toThrow('Internal server error')

    await hook.unmount()
  })

  it('lanza error de red cuando fetch falla', async () => {
    const fetchMock = createFetchMock()
    mockFetchFailure(fetchMock, 'Network error')

    const hook = await renderHookHarness(() => useImprove())

    await expect(runHookAction(() => hook.current.improve('prompt valido y largo para test'))).rejects.toThrow('Network error')

    await hook.unmount()
  })

  it('usa defaults del store si no se pasan thinking/model', async () => {
    const fetchMock = createFetchMock()
    useSettingsStore.setState({ defaultModel: 'pro', defaultThinkingLevel: 'LOW' })
    mockJsonFetch(fetchMock, {
      data: {
        originalPrompt: 'prompt original',
        improvedPrompt: 'prompt mejorado',
        changes: [],
      },
    })

    const hook = await renderHookHarness(() => useImprove())
    await runHookAction(() => hook.current.improve('prompt original', 'aggressive'))

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const body = JSON.parse((init.body as string) || '{}') as { thinkingLevel: string; model: string }

    expect(body.thinkingLevel).toBe('LOW')
    expect(body.model).toBe('pro')

    await hook.unmount()
  })
})
