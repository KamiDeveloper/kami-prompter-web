import { beforeEach, describe, expect, it } from 'vitest'

import { useHistory } from '@/hooks/use-history'
import type { Tables } from '@/types'

import {
  createFetchMock,
  mockJsonFetch,
  renderHookHarness,
  runHookAction,
  waitForCondition,
} from '@/tests/unit/hooks/hook-harness'

const mockEntry = (id: string): Tables<'prompt_history'> => ({
  id,
  user_id: 'user-123',
  module: 'prd',
  input_prompt: `prompt ${id}`,
  output_prompt: 'output',
  model_used: 'flash',
  thinking_level: 'MEDIUM',
  metadata: null,
  created_at: '2026-03-22T00:00:00.000Z',
})

describe('useHistory', () => {
  beforeEach(() => {
    createFetchMock()
  })

  it('construye query params correctamente', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { data: [], count: 0 })

    const hook = await renderHookHarness(() => useHistory({ module: 'prd', limit: 10 }))
    await runHookAction(() => hook.current.fetchHistory())

    const callUrl = fetchMock.mock.calls[0][0] as string
    expect(callUrl).toContain('module=prd')
    expect(callUrl).toContain('limit=10')

    await hook.unmount()
  })

  it('en loadMore usa offset igual a history.length', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { data: [mockEntry('1'), mockEntry('2'), mockEntry('3'), mockEntry('4'), mockEntry('5')], count: 20 })
    mockJsonFetch(fetchMock, { data: [mockEntry('6'), mockEntry('7'), mockEntry('8'), mockEntry('9'), mockEntry('10')], count: 20 })

    const hook = await renderHookHarness(() => useHistory({ limit: 5 }))

    await runHookAction(() => hook.current.fetchHistory(false))
    await waitForCondition(() => hook.current.history.length === 5)

    await runHookAction(() => hook.current.fetchHistory(true))

    const secondCall = fetchMock.mock.calls[1][0] as string
    expect(secondCall).toContain('offset=5')

    await hook.unmount()
  })

  it('deleteEntry hace DELETE y remueve el item del estado', async () => {
    const fetchMock = createFetchMock()
    mockJsonFetch(fetchMock, { data: [mockEntry('1'), mockEntry('2')], count: 2 })
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const hook = await renderHookHarness(() => useHistory({ limit: 10 }))
    await runHookAction(() => hook.current.fetchHistory(false))
    await waitForCondition(() => hook.current.history.length === 2)

    await runHookAction(() => hook.current.deleteEntry('1'))

    expect(fetchMock.mock.calls[1][0]).toBe('/api/history/1')
    expect(hook.current.history.some((entry) => entry.id === '1')).toBe(false)
    expect(hook.current.totalCount).toBe(1)

    await hook.unmount()
  })
})
