import { describe, expect, it } from 'vitest'

import { MODULE_THINKING_DEFAULTS, THINKING_LEVEL_MAP, buildThinkingConfig } from '@/lib/ai/thinking'

describe('thinking', () => {
  it('THINKING_LEVEL_MAP tiene claves LOW, MEDIUM y HIGH', () => {
    const keys = Object.keys(THINKING_LEVEL_MAP).sort()
    expect(keys).toEqual(['HIGH', 'LOW', 'MEDIUM'])
  })

  it('MODULE_THINKING_DEFAULTS.improver es MEDIUM', () => {
    expect(MODULE_THINKING_DEFAULTS.improver).toBe('MEDIUM')
  })

  it('MODULE_THINKING_DEFAULTS.prd es HIGH', () => {
    expect(MODULE_THINKING_DEFAULTS.prd).toBe('HIGH')
  })

  it('MODULE_THINKING_DEFAULTS.templates es LOW', () => {
    expect(MODULE_THINKING_DEFAULTS.templates).toBe('LOW')
  })

  it('buildThinkingConfig(LOW) incluye includeThoughts=false', () => {
    const config = buildThinkingConfig('LOW')
    expect(config.thinkingConfig.includeThoughts).toBe(false)
  })

  it('buildThinkingConfig(HIGH) define thinkingLevel', () => {
    const config = buildThinkingConfig('HIGH')
    expect(config.thinkingConfig.thinkingLevel).toBeDefined()
  })

  it('buildThinkingConfig matchea la estructura esperada', () => {
    const config = buildThinkingConfig('MEDIUM')
    expect(config).toEqual({
      thinkingConfig: {
        thinkingLevel: config.thinkingConfig.thinkingLevel,
        includeThoughts: false,
      },
    })
  })
})
