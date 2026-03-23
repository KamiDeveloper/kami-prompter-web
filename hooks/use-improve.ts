'use client'
import { useState } from 'react'
import { useSettingsStore } from '@/lib/store/settings.store'
import type { ThinkingLevelKey, ModelKey, ImproveResponse } from '@/types'

export function useImprove() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ImproveResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const defaultThinkingLevel = useSettingsStore(state => state.defaultThinkingLevel)
  const defaultModel = useSettingsStore(state => state.defaultModel)

  const improve = async (
    prompt: string,
    interventionLevel: 'subtle' | 'moderate' | 'aggressive' = 'moderate',
    thinkingLevel?: ThinkingLevelKey,
    model?: ModelKey
  ) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          interventionLevel,
          thinkingLevel: thinkingLevel ?? defaultThinkingLevel,
          model: model ?? defaultModel,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string; keyType?: string }
        throw new Error(errData.error ?? 'Failed to improve prompt')
      }

      const result = await res.json() as { data: ImproveResponse }
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

  const reset = () => {
    setData(null)
    setError(null)
  }

  return { improve, loading, data, error, reset }
}
