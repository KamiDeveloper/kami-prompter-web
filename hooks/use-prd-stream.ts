'use client'
import { useState, useCallback, useRef } from 'react'
import { useSettingsStore } from '@/lib/store/settings.store'
import type { ThinkingLevelKey, ModelKey, PrdRequest } from '@/types'
import { generateMarkdownContent, generateFilename } from '@/lib/utils/markdown-exporter'

interface PrdStreamParams {
  description: string
  productType?: string
  targetAudience?: string
  techStack?: string
  detailLevel?: PrdRequest['detailLevel']
  language?: PrdRequest['language']
  thinkingLevel?: ThinkingLevelKey
  model?: ModelKey
}

export function usePrdStream() {
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<string>('')
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const defaultThinkingLevel = useSettingsStore(state => state.defaultThinkingLevel)
  const defaultModel = useSettingsStore(state => state.defaultModel)
  const prdDefaultDetail = useSettingsStore(state => state.prdDefaultDetail)
  const prdDefaultLanguage = useSettingsStore(state => state.prdDefaultLanguage)

  const generate = useCallback(async (params: PrdStreamParams) => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)
    setContent('')
    setIsComplete(false)

    try {
      const res = await fetch('/api/ai/prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          description: params.description,
          productType: params.productType,
          targetAudience: params.targetAudience,
          techStack: params.techStack,
          detailLevel: params.detailLevel ?? prdDefaultDetail,
          language: params.language ?? prdDefaultLanguage,
          thinkingLevel: params.thinkingLevel ?? defaultThinkingLevel,
          model: params.model ?? defaultModel,
        }),
      })

      if (!res.ok) {
        let errorMessage = 'Failed to generate PRD'
        try {
          const errData = await res.json() as { error?: string }
          errorMessage = errData.error ?? errorMessage
        } catch { /* ignore */ }
        throw new Error(errorMessage)
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setContent(prev => prev + chunk)
      }

      setIsComplete(true)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [defaultThinkingLevel, defaultModel, prdDefaultDetail, prdDefaultLanguage])

  const exportMarkdown = (prdContent: string) => {
    const markdownContent = generateMarkdownContent(prdContent, {
      title: 'Product Requirements Document',
      module: 'prd',
      createdAt: new Date(),
    })
    const filename = generateFilename('prd')
    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setContent('')
    setError(null)
    setLoading(false)
    setIsComplete(false)
  }, [])

  return { generate, content, loading, isComplete, error, reset, exportMarkdown }
}
