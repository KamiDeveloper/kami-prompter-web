import { ThinkingLevel } from '@google/genai'

import type { AIModule, ThinkingLevelKey } from '@/types'

/**
 * Mapea niveles de thinking internos a enums del SDK.
 */
export const THINKING_LEVEL_MAP = {
  LOW: ThinkingLevel.LOW,
  MEDIUM: ThinkingLevel.MEDIUM,
  HIGH: ThinkingLevel.HIGH,
} as const

/**
 * Defaults de thinking por modulo funcional.
 */
export const MODULE_THINKING_DEFAULTS: Record<AIModule, ThinkingLevelKey> = {
  improver: 'MEDIUM',
  builder: 'MEDIUM',
  prd: 'HIGH',
  templates: 'LOW',
}

/**
 * Construye la configuracion de thinking para Gemini.
 * @param level Nivel de thinking seleccionado.
 * @returns Objeto config compatible con el SDK de Gemini.
 */
export function buildThinkingConfig(level: ThinkingLevelKey) {
  return {
    thinkingConfig: {
      thinkingLevel: THINKING_LEVEL_MAP[level],
      includeThoughts: false,
    },
  }
}
