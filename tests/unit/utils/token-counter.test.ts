import { describe, expect, it } from 'vitest'

import { estimateTokens, estimateTokensMultiple, formatTokenCount } from '@/lib/utils/token-counter'

describe('token-counter', () => {
  it("estimateTokens('') retorna 0", () => {
    expect(estimateTokens('')).toBe(0)
  })

  it("estimateTokens('abcd') retorna 1", () => {
    expect(estimateTokens('abcd')).toBe(1)
  })

  it("estimateTokens('abc') retorna 1", () => {
    expect(estimateTokens('abc')).toBe(1)
  })

  it('estimateTokens para 4000 chars retorna 1000', () => {
    expect(estimateTokens('a'.repeat(4000))).toBe(1000)
  })

  it('estimateTokensMultiple([]) retorna 0', () => {
    expect(estimateTokensMultiple([])).toBe(0)
  })

  it("estimateTokensMultiple(['abcd', 'abcd']) retorna 2", () => {
    expect(estimateTokensMultiple(['abcd', 'abcd'])).toBe(2)
  })

  it('formatTokenCount(0) retorna ~0', () => {
    expect(formatTokenCount(0)).toBe('~0')
  })

  it('formatTokenCount(500) retorna ~500', () => {
    expect(formatTokenCount(500)).toBe('~500')
  })

  it('formatTokenCount(999) retorna ~999', () => {
    expect(formatTokenCount(999)).toBe('~999')
  })

  it('formatTokenCount(1000) retorna ~1k', () => {
    expect(formatTokenCount(1000)).toBe('~1k')
  })

  it('formatTokenCount(1500) retorna ~1.5k', () => {
    expect(formatTokenCount(1500)).toBe('~1.5k')
  })

  it('formatTokenCount(12400) retorna ~12.4k', () => {
    expect(formatTokenCount(12400)).toBe('~12.4k')
  })
})
