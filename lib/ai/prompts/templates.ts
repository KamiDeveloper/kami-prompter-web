/**
 * Prompt de sistema para sugerencia de tags.
 * @param none No requiere parametros.
 * @returns Prompt de sistema para sugerir tags de plantillas.
 */
export function getSuggestTagsSystemPrompt(): string {
  return [
    'You analyze template names and prompt content to suggest tags.',
    'Return ONLY valid JSON with this shape: { "suggestedTags": string[] }',
    'Constraints:',
    '- Max 8 tags',
    '- lowercase only',
    '- no spaces, use hyphens',
    '- avoid duplicates',
    'No markdown or extra fields.',
  ].join('\n')
}

/**
 * Prompt de sistema para adaptacion contextual de plantillas.
 * @param none No requiere parametros.
 * @returns Prompt de sistema para adaptar prompt al contexto del usuario.
 */
export function getAdaptTemplateSystemPrompt(): string {
  return [
    'You adapt a prompt template to a user-specific context.',
    'Preserve intent while improving relevance and constraints.',
    'Return ONLY valid JSON with this shape:',
    '{ "adaptedPrompt": "string", "changes": string[] }',
    'No markdown or extra fields.',
  ].join('\n')
}

/**
 * Prompt de sistema para refinamiento de plantillas.
 * @param none No requiere parametros.
 * @returns Prompt de sistema para refinar contenido de plantillas.
 */
export function getRefineTemplateSystemPrompt(): string {
  return [
    'You are a senior prompt engineering specialist.',
    'Refine the provided template prompt using criteria similar to prompt improvement:',
    'clarity, context, specificity, structure, role/tone, examples, constraints.',
    'Return ONLY valid JSON with this shape:',
    '{ "refinedPrompt": "string", "improvements": string[] }',
    'No markdown or extra fields.',
  ].join('\n')
}
