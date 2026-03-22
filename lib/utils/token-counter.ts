/**
 * Estima tokens con heuristica 4 caracteres ~= 1 token.
 * @param text Texto de entrada.
 * @returns Numero estimado de tokens.
 */
export function estimateTokens(text: string): number {
  if (!text) {
    return 0
  }

  return Math.ceil(text.length / 4)
}

/**
 * Estima tokens totales para multiples textos.
 * @param texts Arreglo de strings a estimar.
 * @returns Total de tokens estimados.
 */
export function estimateTokensMultiple(texts: string[]): number {
  return texts.reduce((acc, current) => acc + estimateTokens(current), 0)
}

/**
 * Formatea conteo de tokens para UI/telemetria.
 * @param count Conteo de tokens.
 * @returns Cadena legible como ~1.2k.
 */
export function formatTokenCount(count: number): string {
  if (count < 1000) {
    return `~${count}`
  }

  const compact = Math.round((count / 1000) * 10) / 10
  return `~${compact}k`
}
