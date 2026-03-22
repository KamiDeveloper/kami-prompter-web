export type ThinkingLevelKey = 'LOW' | 'MEDIUM' | 'HIGH'
export type ModelKey = 'flash' | 'pro'
export type AIModule = 'improver' | 'builder' | 'prd' | 'templates'

export interface AIRequestBase {
  model: ModelKey
  thinkingLevel: ThinkingLevelKey
}

export interface ImproveRequest extends AIRequestBase {
  prompt: string
  interventionLevel: 'subtle' | 'moderate' | 'aggressive'
}

export interface ImproveResponse {
  originalPrompt: string
  improvedPrompt: string
  changes: ChangeAnnotation[]
}

export interface ChangeAnnotation {
  vector: string
  description: string
  type: 'addition' | 'removal' | 'restructure'
}

export interface BuildRequest extends AIRequestBase {
  credo: {
    context?: string
    role?: string
    expectation?: string
    data?: string
    outputFormat?: string
  }
}

export interface BuildResponse {
  assembledPrompt: string
  refinedPrompt: string
}

export interface SuggestFieldRequest extends AIRequestBase {
  field: 'context' | 'role' | 'expectation' | 'data' | 'outputFormat'
  filledFields: Partial<BuildRequest['credo']>
}

export interface PrdRequest extends AIRequestBase {
  description: string
  productType?: string
  targetAudience?: string
  techStack?: string
  detailLevel: 'basic' | 'standard' | 'exhaustive'
  language?: 'auto' | 'es' | 'en' | 'pt'
}

export interface SuggestTagsRequest {
  templateName: string
  promptContent: string
  existingTags: string[]
}

export interface AdaptRequest extends AIRequestBase {
  originalPrompt: string
  userContext: string
}

export interface RefineTemplateRequest extends AIRequestBase {
  promptContent: string
}

export interface AIError {
  code: 'RATE_LIMIT' | 'INVALID_KEY' | 'TIMEOUT' | 'SERVER_ERROR' | 'THINKING_NOT_SUPPORTED'
  message: string
  retryAfter?: number
}
