'use client'
import { useState } from 'react'
import { useSettingsStore } from '@/lib/store/settings.store'
import type { ThinkingLevelKey, ModelKey, BuildResponse, BuildRequest } from '@/types'

export function useBuild() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BuildResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const defaultThinkingLevel = useSettingsStore(state => state.defaultThinkingLevel)
  const defaultModel = useSettingsStore(state => state.defaultModel)

  const build = async (
    credo: BuildRequest['credo'],
    thinkingLevel?: ThinkingLevelKey,
    model?: ModelKey
  ) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch('/api/ai/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credo,
          thinkingLevel: thinkingLevel ?? defaultThinkingLevel,
          model: model ?? defaultModel,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(errData.error ?? 'Failed to build prompt')
      }

      const result = await res.json() as { data: BuildResponse }
      setData(result.data)
      return result.data
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }

  const suggestField = async (
    field: 'context' | 'role' | 'expectation' | 'data' | 'outputFormat',
    filledFields: Partial<BuildRequest['credo']>,
    thinkingLevel?: ThinkingLevelKey,
    model?: ModelKey
  ) => {
    const res = await fetch('/api/ai/suggest-field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field,
        filledFields,
        thinkingLevel: thinkingLevel ?? defaultThinkingLevel,
        model: model ?? defaultModel,
      }),
    })

    if (!res.ok) throw new Error('Failed to suggest field')
    const result = await res.json() as { data: { suggestion: string; explanation: string } }
    return result.data
  }

  const reset = () => {
    setData(null)
    setError(null)
  }

  return { build, suggestField, loading, data, error, reset }
}
