import { describe, expect, it } from 'vitest'

import { parseDiff } from '@/lib/utils/diff-parser'

describe('parseDiff', () => {
  it('retorna segmentos unchanged cuando los textos son identicos', () => {
    const result = parseDiff('hello\nworld', 'hello\nworld')
    expect(result.every((s) => s.type === 'unchanged')).toBe(true)
  })

  it('retorna segmentos added cuando el original esta vacio', () => {
    const result = parseDiff('', 'line one\nline two')
    expect(result.every((s) => s.type === 'added')).toBe(true)
  })

  it('retorna segmentos removed cuando el mejorado esta vacio', () => {
    const result = parseDiff('line one\nline two', '')
    expect(result.every((s) => s.type === 'removed')).toBe(true)
  })

  it('detecta restructured cuando una linea es reemplazada por otra', () => {
    const result = parseDiff('old line', 'new line')
    expect(result.some((s) => s.type === 'restructured')).toBe(true)
  })

  it('mezcla unchanged y restructured en textos parcialmente compartidos', () => {
    const result = parseDiff('line A\nline B\nline C', 'line A\nline X\nline C')
    const types = result.map((s) => s.type)
    expect(types).toContain('unchanged')
    expect(types).toContain('restructured')
  })

  it('preserva textos relevantes del diff', () => {
    const original = 'a\nb\nc'
    const improved = 'a\nd\nc'
    const result = parseDiff(original, improved)
    const allTexts = result.map((s) => s.text)
    expect(allTexts).toContain('a')
    expect(allTexts).toContain('c')
  })
})
