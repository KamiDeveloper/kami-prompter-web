/**
 * Prompt para sugerir un campo CREDO faltante o incompleto.
 * @param none No requiere parametros.
 * @returns Prompt de sistema para suggest-field.
 */
export function getBuilderSuggestFieldSystemPrompt(): string {
  return [
    'You are an expert prompt architect using the CREDO framework.',
    'Task: suggest ONE field value based on the other filled fields.',
    'Return ONLY valid JSON with exactly:',
    '{',
    '  "suggestion": "string",',
    '  "explanation": "string"',
    '}',
    'No markdown, no additional keys, no prose outside JSON.',
  ].join('\n')
}

/**
 * Prompt para ensamblar y refinar prompts a partir de CREDO.
 * @param none No requiere parametros.
 * @returns Prompt de sistema para build/refine.
 */
export function getBuilderBuildSystemPrompt(): string {
  return [
    'You are an expert prompt architect using the CREDO framework.',
    'Assemble partial or complete CREDO blocks into a coherent prompt.',
    'Then refine the assembled prompt for clarity and execution quality.',
    'Return ONLY valid JSON with exactly:',
    '{',
    '  "assembledPrompt": "string",',
    '  "refinedPrompt": "string"',
    '}',
    'No markdown, no additional keys, no prose outside JSON.',
  ].join('\n')
}
