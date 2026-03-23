import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useApiKeys } from '@/hooks/use-api-keys'
import { useSettingsStore } from '@/lib/store/settings.store'

import { createFetchMock, mockJsonFetch, renderHookHarness, runHookAction } from '@/tests/unit/hooks/hook-harness'

describe('useApiKeys', () => {
  beforeEach(() => {
    createFetchMock()
    useSettingsStore.setState({
      apiKeyStatus: {
        flash: 'not_configured',
        pro: 'not_configured',
      },
    })
  })

  afterEach(() => {
    useSettingsStore.setState({
      apiKeyStatus: {
        flash: 'not_configured',
        pro: 'not_configured',
      },
    })
  })

  it('storeKey exitoso hace POST y setea configured', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { success: true })

    const hook = await renderHookHarness(() => useApiKeys())
    await runHookAction(() => hook.current.storeKey('flash_free', 'AIzaXXXXXXXXXXXXXXXXXXXX'))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/keys/store',
      expect.objectContaining({ method: 'POST' }),
    )
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as { keyType: string }
    expect(body.keyType).toBe('flash_free')
    expect(useSettingsStore.getState().apiKeyStatus.flash).toBe('configured')

    await hook.unmount()
  })

  it('storeKey error setea not_configured y lanza', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { error: 'Unable to store API key' }, 500)

    const hook = await renderHookHarness(() => useApiKeys())

    await expect(runHookAction(() => hook.current.storeKey('flash_free', 'key'))).rejects.toThrow()
    expect(useSettingsStore.getState().apiKeyStatus.flash).toBe('not_configured')

    await hook.unmount()
  })

  it('verifyKey retorna true y setea configured cuando es valida', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { data: { isValid: true } })

    const hook = await renderHookHarness(() => useApiKeys())
    const result = await runHookAction(() => hook.current.verifyKey('pro_paid'))

    expect(result).toBe(true)
    expect(useSettingsStore.getState().apiKeyStatus.pro).toBe('configured')

    await hook.unmount()
  })

  it('verifyKey retorna false y setea invalid cuando no es valida', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { data: { isValid: false } })

    const hook = await renderHookHarness(() => useApiKeys())
    const result = await runHookAction(() => hook.current.verifyKey('flash_free'))

    expect(result).toBe(false)
    expect(useSettingsStore.getState().apiKeyStatus.flash).toBe('invalid')

    await hook.unmount()
  })

  it('deleteKey llama DELETE y setea not_configured', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { success: true })

    useSettingsStore.setState({
      apiKeyStatus: {
        flash: 'configured',
        pro: 'configured',
      },
    })

    const hook = await renderHookHarness(() => useApiKeys())
    await runHookAction(() => hook.current.deleteKey('pro_paid'))

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/keys/delete',
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(useSettingsStore.getState().apiKeyStatus.pro).toBe('not_configured')

    await hook.unmount()
  })
})
