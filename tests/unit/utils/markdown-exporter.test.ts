import { describe, expect, it } from 'vitest'

import { generateFilename, generateMarkdownContent } from '@/lib/utils/markdown-exporter'

describe('markdown-exporter', () => {
  it('generateMarkdownContent incluye contenido cuando solo se pasa content', () => {
    const result = generateMarkdownContent('contenido principal')
    expect(result).toContain('contenido principal')
  })

  it('generateMarkdownContent incluye título cuando metadata.title existe', () => {
    const result = generateMarkdownContent('contenido', { title: 'Mi Título' })
    expect(result).toContain('# Mi Título')
  })

  it('generateMarkdownContent retorna string no vacío', () => {
    const result = generateMarkdownContent('x')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('generateMarkdownContent no contiene texto undefined ni null', () => {
    const result = generateMarkdownContent('contenido', { title: 'Título' })
    expect(result).not.toContain('undefined')
    expect(result).not.toContain('null')
  })

  it('generateFilename para prd incluye tipo y extensión', () => {
    const result = generateFilename('prd')
    expect(result).toContain('prd')
    expect(result.endsWith('.md')).toBe(true)
  })

  it('generateFilename para prompt incluye prompt', () => {
    const result = generateFilename('prompt')
    expect(result).toContain('prompt')
  })

  it('generateFilename para template incluye template', () => {
    const result = generateFilename('template')
    expect(result).toContain('template')
  })

  it('generateFilename incluye el año de la fecha proporcionada', () => {
    const fixedDate = new Date('2026-03-22T12:00:00.000Z')
    const result = generateFilename('prd', fixedDate)
    expect(result).toContain('2026')
  })

  it('generateFilename no contiene espacios', () => {
    const result = generateFilename('prd')
    expect(result.includes(' ')).toBe(false)
  })
})
