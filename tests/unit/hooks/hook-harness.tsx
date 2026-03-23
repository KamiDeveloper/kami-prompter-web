import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { vi } from 'vitest'

export interface HookHarness<T> {
  readonly current: T
  rerender: () => Promise<void>
  unmount: () => Promise<void>
}

export async function runHookAction<T>(action: () => T | Promise<T>): Promise<T> {
  let result: T | undefined

  await act(async () => {
    result = await action()
  })

  if (typeof result === 'undefined') {
    return undefined as T
  }

  return result
}

export async function renderHookHarness<T>(useHook: () => T): Promise<HookHarness<T>> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  let latestValue: T | undefined

  function HookContainer() {
    latestValue = useHook()
    return null
  }

  await act(async () => {
    root.render(<HookContainer />)
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
    })
  })

  const getCurrent = () => {
    if (typeof latestValue === 'undefined') {
      throw new Error('Hook no inicializado')
    }
    return latestValue
  }

  return {
    get current() {
      return getCurrent()
    },
    rerender: async () => {
      await act(async () => {
        root.render(<HookContainer />)
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0)
        })
      })
    },
    unmount: async () => {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}

export async function waitForCondition(
  predicate: () => boolean,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 1500
  const intervalMs = options?.intervalMs ?? 20
  const start = Date.now()

  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timeout esperando condicion del hook')
    }

    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, intervalMs)
      })
    })
  }
}

export function createFetchMock() {
  const fetchMock = vi.fn<typeof fetch>()
  global.fetch = fetchMock
  return fetchMock
}

export function mockJsonFetch(fetchMock: ReturnType<typeof createFetchMock>, body: unknown, status = 200): void {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

export function mockFetchFailure(fetchMock: ReturnType<typeof createFetchMock>, message: string): void {
  fetchMock.mockRejectedValueOnce(new Error(message))
}
