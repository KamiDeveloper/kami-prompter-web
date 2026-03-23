# KAMI PROMPTER — DOCUMENTACIÓN TÉCNICA COMPLETA
## Contexto para el Agente Frontend

**Versión del proyecto:** 0.1.0  
**Propósito de este documento:** Proveer el contexto técnico completo del stack, infraestructura backend, contratos de API, tipos TypeScript, stores de estado y utilidades disponibles, para que el agente frontend pueda construir la UI sin cometer errores de integración.

---

## TABLA DE CONTENIDOS

1. [Stack tecnológico y dependencias](#1-stack-tecnológico-y-dependencias)
2. [Estructura de archivos existente](#2-estructura-de-archivos-existente)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Schema de base de datos Supabase](#4-schema-de-base-de-datos-supabase)
5. [Tipos TypeScript](#5-tipos-typescript)
6. [Clientes de Supabase](#6-clientes-de-supabase)
7. [Middleware de autenticación](#7-middleware-de-autenticación)
8. [Cliente AI — GeminiClient](#8-cliente-ai--geminiclient)
9. [Thinking Levels](#9-thinking-levels)
10. [System Prompts de AI](#10-system-prompts-de-ai)
11. [Servicios de datos](#11-servicios-de-datos)
12. [Gestión de API Keys — Vault](#12-gestión-de-api-keys--vault)
13. [Contratos completos de Route Handlers](#13-contratos-completos-de-route-handlers)
14. [Zustand Stores](#14-zustand-stores)
15. [Utilidades del frontend](#15-utilidades-del-frontend)
16. [Modelo de seguridad](#16-modelo-de-seguridad)
17. [Patrones de error en API](#17-patrones-de-error-en-api)
18. [Infraestructura de tests](#18-infraestructura-de-tests)

---

## 1. STACK TECNOLÓGICO Y DEPENDENCIAS

### `package.json` — estado actual instalado

```json
{
  "name": "kami-prompter-web",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  },
  "dependencies": {
    "@google/genai": "^1.46.0",
    "@supabase/ssr": "^0.9.0",
    "@supabase/supabase-js": "^2.99.3",
    "clsx": "^2.1.1",
    "lucide-react": "^1.0.0-rc.1",
    "motion": "^12.38.0",
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.72.0",
    "tailwind-merge": "^3.5.0",
    "zod": "^4.3.6",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@playwright/test": "^1.58.2",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitest/coverage-v8": "^4.1.0",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^4.1.0"
  }
}
```

### `tsconfig.json` — configuración TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] }
  }
}
```

**Notas críticas:**
- El alias `@/` mapea a la raíz del proyecto. Todos los imports internos usan `@/`.
- `strict: true` — sin `any` en ningún archivo.
- `react-hook-form` ya está instalado en la versión exacta `^7.72.0` (instalado durante la Fase 1 backend). No reinstalar.

---

## 2. ESTRUCTURA DE ARCHIVOS EXISTENTE

Los siguientes archivos ya existen y **no deben modificarse**:

```
kami-prompter-web/
│
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── adapt/route.ts       ← POST /api/ai/adapt
│   │   │   ├── build/route.ts       ← POST /api/ai/build
│   │   │   ├── improve/route.ts     ← POST /api/ai/improve
│   │   │   ├── prd/route.ts         ← POST /api/ai/prd  (streaming)
│   │   │   ├── refine-template/route.ts  ← POST /api/ai/refine-template
│   │   │   ├── suggest-field/route.ts    ← POST /api/ai/suggest-field
│   │   │   └── suggest-tags/route.ts     ← POST /api/ai/suggest-tags
│   │   └── keys/
│   │       ├── delete/route.ts      ← DELETE /api/keys/delete
│   │       ├── store/route.ts       ← POST /api/keys/store
│   │       └── verify/route.ts      ← POST /api/keys/verify
│   ├── favicon.ico
│   ├── globals.css                  ← REEMPLAZAR (solo contiene estilos default de Next.js)
│   ├── layout.tsx                   ← REEMPLAZAR (usa fuentes Geist default)
│   └── page.tsx                     ← REEMPLAZAR (es la página default de Next.js)
│
├── lib/
│   ├── ai/
│   │   ├── gemini-client.ts
│   │   ├── prompts/
│   │   │   ├── builder.ts
│   │   │   ├── improver.ts
│   │   │   ├── prd.ts
│   │   │   └── templates.ts
│   │   └── thinking.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── branches.service.ts
│   │   ├── categories.service.ts
│   │   ├── history.service.ts
│   │   ├── settings.service.ts
│   │   ├── tags.service.ts
│   │   └── templates.service.ts
│   ├── store/
│   │   ├── settings.store.ts        ← Zustand store (browser)
│   │   └── ui.store.ts              ← Zustand store (browser)
│   ├── supabase/
│   │   ├── client.ts                ← Browser client (singleton)
│   │   ├── middleware.ts            ← Middleware client
│   │   └── server.ts                ← Server/Route Handler clients
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── diff-parser.ts
│   │   ├── markdown-exporter.ts
│   │   └── token-counter.ts
│   └── vault/
│       └── api-keys.ts
│
├── middleware.ts                    ← Protección de rutas /app/*
├── next.config.ts
├── supabase/
│   └── schema.sql
├── tests/
│   ├── setup.ts
│   └── unit/                        ← 141 tests pasando (no modificar)
├── types/
│   ├── ai.ts
│   ├── index.ts                     ← Re-exporta todo
│   ├── supabase.ts
│   └── templates.ts
├── .env.local.example
├── playwright.config.ts
├── tsconfig.json
└── vitest.config.ts
```

**Archivos del frontend por crear** (todos en `app/` y `components/`):

```
app/
├── (marketing)/         ← Route group — páginas públicas sin auth
│   ├── layout.tsx
│   ├── page.tsx          ← Landing Page
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── auth/callback/route.ts   ← OAuth callback
└── (app)/               ← Route group — páginas autenticadas
    ├── layout.tsx        ← AppShell con verificación de auth
    ├── dashboard/page.tsx
    ├── improver/page.tsx
    ├── builder/page.tsx
    ├── prd/page.tsx
    ├── templates/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/page.tsx
    ├── history/page.tsx
    └── settings/
        ├── page.tsx
        ├── api-keys/page.tsx
        ├── appearance/page.tsx
        └── ai/page.tsx

components/        ← Todos los componentes UI por crear
public/            ← logo.svg, manifest.json, icons/
```

---

## 3. VARIABLES DE ENTORNO

### `.env.local.example` (ya existe)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**Reglas críticas:**
- `NEXT_PUBLIC_*` — accesibles en el cliente Y servidor.
- `SUPABASE_SERVICE_ROLE_KEY` — **sin** prefijo `NEXT_PUBLIC_`, por lo tanto Next.js lo bloquea automáticamente del bundle del cliente. Solo disponible en Route Handlers y Server Components.
- **NUNCA** referenciar `SUPABASE_SERVICE_ROLE_KEY` en archivos de componentes cliente (`'use client'`).

---

## 4. SCHEMA DE BASE DE DATOS SUPABASE

### Tablas

#### `public.profiles`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | UUID | NO | — (FK `auth.users.id`) |
| `username` | TEXT | SÍ | — |
| `display_name` | TEXT | SÍ | — |
| `avatar_url` | TEXT | SÍ | — |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` |

#### `public.user_settings`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `user_id` | UUID | NO | — (PK + FK) |
| `default_model` | `'flash' \| 'pro'` | SÍ | `'flash'` |
| `default_thinking_level` | `'LOW' \| 'MEDIUM' \| 'HIGH'` | SÍ | `'MEDIUM'` |
| `use_paid_key_for_all` | BOOLEAN | SÍ | `FALSE` |
| `show_nsfw` | BOOLEAN | SÍ | `FALSE` |
| `theme` | `'dark' \| 'light' \| 'system'` | SÍ | `'dark'` |
| `default_export_format` | TEXT | SÍ | `'markdown'` |
| `prd_default_detail` | `'basic' \| 'standard' \| 'exhaustive'` | SÍ | `'standard'` |
| `prd_default_language` | TEXT | SÍ | `'auto'` |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` |

#### `public.user_api_keys`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` |
| `user_id` | UUID | NO | FK `auth.users.id` |
| `key_type` | `'flash_free' \| 'pro_paid'` | NO | — |
| `vault_secret_id` | UUID | NO | — (ref a Supabase Vault) |
| `is_valid` | BOOLEAN | SÍ | `NULL` |
| `last_verified_at` | TIMESTAMPTZ | SÍ | `NULL` |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` |
- Constraint UNIQUE: `(user_id, key_type)`

#### `public.prompt_history`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` |
| `user_id` | UUID | NO | FK `auth.users.id` |
| `module` | `'improver' \| 'builder' \| 'prd'` | NO | — |
| `input_prompt` | TEXT | NO | — |
| `output_prompt` | TEXT | SÍ | — |
| `model_used` | TEXT | NO | — |
| `thinking_level` | TEXT | NO | — |
| `metadata` | JSONB | SÍ | `'{}'` |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` |

#### `public.template_categories`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` |
| `user_id` | UUID | NO | FK `auth.users.id` |
| `name` | TEXT | NO | — |
| `emoji` | TEXT | SÍ | `'📁'` |
| `sort_order` | INTEGER | SÍ | `0` |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` |

#### `public.prompt_templates`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` |
| `user_id` | UUID | NO | FK `auth.users.id` |
| `category_id` | UUID | SÍ | FK `template_categories.id` ON DELETE SET NULL |
| `name` | TEXT | NO | — |
| `description` | TEXT | SÍ | — |
| `is_nsfw` | BOOLEAN | SÍ | `FALSE` |
| `is_deleted` | BOOLEAN | SÍ | `FALSE` |
| `deleted_at` | TIMESTAMPTZ | SÍ | — |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` |

#### `public.template_tags`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` |
| `template_id` | UUID | NO | FK `prompt_templates.id` ON DELETE CASCADE |
| `tag` | TEXT | NO | — |
| `created_by` | `'user' \| 'ai'` | SÍ | `'user'` |
- Constraint UNIQUE: `(template_id, tag)`

#### `public.template_branches`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` |
| `template_id` | UUID | NO | FK `prompt_templates.id` ON DELETE CASCADE |
| `name` | TEXT | NO | `'main'` |
| `content` | TEXT | NO | — |
| `is_main` | BOOLEAN | SÍ | `FALSE` |
| `parent_branch_id` | UUID | SÍ | FK `template_branches.id` ON DELETE SET NULL |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` |
| `updated_at` | TIMESTAMPTZ | SÍ | `NOW()` |
- Constraint UNIQUE: `(template_id, name)`

#### `public.branch_history`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| `id` | UUID | NO | `gen_random_uuid()` |
| `branch_id` | UUID | NO | FK `template_branches.id` ON DELETE CASCADE |
| `content` | TEXT | NO | — |
| `change_description` | TEXT | SÍ | — |
| `created_at` | TIMESTAMPTZ | SÍ | `NOW()` |

### Triggers automáticos

- **`on_auth_user_created`** — Se ejecuta en `INSERT` de `auth.users`. Crea automáticamente una fila en `public.profiles` y otra en `public.user_settings` con defaults, y 5 categorías por defecto: `Código`, `Escritura`, `Análisis`, `Imágenes`, `Agentes`.
- **`set_*_updated_at`** — Actualiza `updated_at` en `profiles`, `user_settings`, `user_api_keys`, `prompt_templates` y `template_branches` en cada `UPDATE`.

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. El patrón es `auth.uid() = user_id` (o equivalente por join para tablas sin `user_id` directo). Un usuario **nunca** puede leer ni escribir datos de otro usuario.

### Funciones de Vault (accesibles vía `client.rpc()`)

| Función RPC | Args | Returns | Uso |
|---|---|---|---|
| `vault.create_secret` | `secret: string, name?: string, description?: string` | `string` (UUID del secreto) | Guardar API Key |
| `vault.get_secret` | `secret_id: string` | `string` (valor del secreto) | Recuperar API Key |
| `vault.delete_secret` | `secret_id: string` | `boolean` | Eliminar API Key |

---

## 5. TIPOS TYPESCRIPT

### `types/ai.ts`

```typescript
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
  vector: string  // 'Claridad' | 'Contexto' | 'Especificidad' | 'Estructura' | 'Tono y Rol' | 'Ejemplos' | 'Restricciones'
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
  retryAfter?: number  // segundos, solo presente en RATE_LIMIT
}
```

### `types/templates.ts`

```typescript
export interface TemplateWithRelations {
  id: string
  name: string
  description: string | null
  is_nsfw: boolean
  category_id: string | null
  category?: { id: string; name: string; emoji: string }
  tags: { tag: string; created_by: 'user' | 'ai' }[]
  branches: BranchSummary[]
  main_branch_content?: string
  created_at: string
  updated_at: string
}

export interface BranchSummary {
  id: string
  name: string
  is_main: boolean
  parent_branch_id: string | null
  updated_at: string
}

export interface BranchWithHistory {
  id: string
  name: string
  content: string
  is_main: boolean
  parent_branch_id: string | null
  history: {
    id: string
    content: string
    change_description: string | null
    created_at: string
  }[]
  created_at: string
  updated_at: string
}

export interface TemplateFilters {
  categoryId?: string
  tags?: string[]
  showNsfw?: boolean
  searchQuery?: string
  orderBy?: 'created_at' | 'updated_at' | 'name'
  orderDirection?: 'asc' | 'desc'
}

export interface CreateTemplatePayload {
  name: string
  description?: string
  category_id?: string
  is_nsfw?: boolean
  initialContent: string
  tags?: string[]
}

export interface CreateBranchPayload {
  templateId: string
  branchName: string
  sourceContent: string
  parentBranchId?: string
}

export interface MergeBranchPayload {
  templateId: string
  sourceBranchId: string
  targetBranchId: string
}
```

### `types/supabase.ts` — helpers de acceso a tipos de BD

```typescript
// Uso para acceder a tipos de filas:
import type { Tables, Insert, Update } from '@/types'

type Profile        = Tables<'profiles'>
type UserSettings   = Tables<'user_settings'>
type UserApiKey     = Tables<'user_api_keys'>
type PromptHistory  = Tables<'prompt_history'>
type TemplateCategory = Tables<'template_categories'>
type PromptTemplate = Tables<'prompt_templates'>
type TemplateTag    = Tables<'template_tags'>
type TemplateBranch = Tables<'template_branches'>
type BranchHistoryRow = Tables<'branch_history'>

// Para inserts:
type HistoryInsert  = Insert<'prompt_history'>
```

### `types/index.ts` — re-exporta todo

```typescript
export * from './ai'
export * from './supabase'
export * from './templates'
```

---

## 6. CLIENTES DE SUPABASE

### `lib/supabase/client.ts` — Browser (singleton)

```typescript
import { createBrowserClient } from '@supabase/ssr'

// PARA USO EN COMPONENTES CLIENTE ('use client')
export function createSupabaseBrowserClient(): SupabaseClient<Database>
```

**Uso correcto en componentes cliente:**
```tsx
'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const supabase = createSupabaseBrowserClient()
const { data: { user } } = await supabase.auth.getUser()
// o
const { data: { session } } = await supabase.auth.getSession()
// o para OAuth:
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
})
// o para login con email:
await supabase.auth.signInWithPassword({ email, password })
// o para registro:
await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
// o para logout:
await supabase.auth.signOut()
```

### `lib/supabase/server.ts` — Server/Route Handlers

```typescript
// Para Route Handlers y Server Components:
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>>

// Para operaciones administrativas (Service Role):
export function createSupabaseServiceRoleClient(): SupabaseClient<Database>
```

**NUNCA** llamar `createSupabaseServiceRoleClient()` en archivos con `'use client'`. Solo en Route Handlers.

### `lib/supabase/middleware.ts` — Solo para `middleware.ts`

```typescript
export function createSupabaseMiddlewareClient(request: NextRequest): {
  supabase: SupabaseClient<Database>
  getResponse: () => NextResponse
}
```

---

## 7. MIDDLEWARE DE AUTENTICACIÓN

### `middleware.ts` (ya existe — no modificar)

```typescript
// Rutas públicas (no requieren auth):
const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/forgot-password', '/auth/callback'])

// Comportamiento:
// - /app/* sin sesión → redirect a /login
// - /login o /register con sesión activa → redirect a /app/dashboard
// - Siempre actualiza cookies de sesión en la response
```

**Matcher:**
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## 8. CLIENTE AI — GEMINICLIENT

### `lib/ai/gemini-client.ts`

```typescript
// Modelos disponibles:
type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3.1-pro-preview'

export function getModelString(model: ModelKey): GeminiModel
// 'flash' → 'gemini-3-flash-preview'
// 'pro'   → 'gemini-3.1-pro-preview'

export class GeminiClient {
  constructor(apiKey: string)

  // Generación completa (no streaming). Timeout: 60 segundos.
  // Retry automático (máx 3 intentos) para errores 429 y 5xx con backoff exponencial.
  async generateContent(params: {
    model: GeminiModel
    systemPrompt: string
    userPrompt: string
    thinkingLevel: ThinkingLevelKey
    maxOutputTokens?: number
  }): Promise<string>

  // Generación streaming. Timeout: 120 segundos.
  async *generateContentStream(params: {
    model: GeminiModel
    systemPrompt: string
    userPrompt: string
    thinkingLevel: ThinkingLevelKey
    maxOutputTokens?: number
  }): AsyncGenerator<string>

  // Verifica la API Key con una request mínima al modelo Flash.
  async verifyKey(): Promise<boolean>
}

// Mapea errores del SDK a AIError tipado.
// Sanitiza mensajes para que no contengan la API Key.
export function mapGeminiError(error: unknown): AIError
```

**Patrones de error manejados:**
- `status: 429` → `{ code: 'RATE_LIMIT', retryAfter: 10 }`
- `status: 401 | 403` → `{ code: 'INVALID_KEY' }`
- message contiene `'timeout'` → `{ code: 'TIMEOUT' }`
- `status: 5xx` → `{ code: 'SERVER_ERROR' }`

---

## 9. THINKING LEVELS

### `lib/ai/thinking.ts`

```typescript
import type { AIModule, ThinkingLevelKey } from '@/types'

// Defaults por módulo (también en ui.store.ts para la UI):
export const MODULE_THINKING_DEFAULTS: Record<AIModule, ThinkingLevelKey> = {
  improver:  'MEDIUM',
  builder:   'MEDIUM',
  prd:       'HIGH',
  templates: 'LOW',
}

// Función para construir el config de Gemini:
export function buildThinkingConfig(level: ThinkingLevelKey): {
  thinkingConfig: {
    thinkingLevel: ThinkingLevel  // enum del SDK
    includeThoughts: false
  }
}
```

**Notas de los modelos Gemini:**
- `gemini-3-flash-preview`: soporta `LOW`, `MEDIUM`, `HIGH` (default dinámico: HIGH)
- `gemini-3.1-pro-preview`: soporta `LOW`, `MEDIUM`, `HIGH` (default: HIGH). No se puede deshabilitar el thinking.
- El nivel `MINIMAL` existe en el SDK pero NO se expone en la UI de Kami Prompter.

---

## 10. SYSTEM PROMPTS DE AI

### `lib/ai/prompts/improver.ts`

```typescript
export function getImproverSystemPrompt(): string
// El modelo debe retornar SOLO JSON válido con esta forma exacta:
// {
//   "improvedPrompt": "string",
//   "changes": [
//     {
//       "vector": "Claridad|Contexto|Especificidad|Estructura|Tono y Rol|Ejemplos|Restricciones",
//       "description": "string",
//       "type": "addition|removal|restructure"
//     }
//   ]
// }
```

### `lib/ai/prompts/builder.ts`

```typescript
export function getBuilderSuggestFieldSystemPrompt(): string
// Retorno esperado:
// { "suggestion": "string", "explanation": "string" }

export function getBuilderBuildSystemPrompt(): string
// Retorno esperado:
// { "assembledPrompt": "string", "refinedPrompt": "string" }
```

### `lib/ai/prompts/prd.ts`

```typescript
export function getPrdSystemPrompt(): string
// Retorno esperado: Markdown puro (NO JSON)
// 13 secciones exactas en español/idioma detectado del input
```

### `lib/ai/prompts/templates.ts`

```typescript
export function getSuggestTagsSystemPrompt(): string
// Retorno: { "suggestedTags": string[] }
// Máx 8 tags, lowercase, sin espacios (usar guiones), sin duplicados

export function getAdaptTemplateSystemPrompt(): string
// Retorno: { "adaptedPrompt": "string", "changes": string[] }

export function getRefineTemplateSystemPrompt(): string
// Retorno: { "refinedPrompt": "string", "improvements": string[] }
```

---

## 11. SERVICIOS DE DATOS

Todos los servicios son funciones puras que reciben un `SupabaseClient` como primer parámetro. Lanzarán un `Error` con mensajes descriptivos si la operación falla.

### `lib/services/auth.service.ts`

```typescript
export class AuthError extends Error {
  // name = 'AuthError'
}

export async function getServerSession(
  client: SupabaseClient<Database>
): Promise<Session | null>

export async function requireAuth(
  client: SupabaseClient<Database>
): Promise<User>
// Lanza AuthError si no hay sesión
```

### `lib/services/settings.service.ts`

```typescript
export async function getUserSettings(
  client: SupabaseClient<Database>,
  userId: string
): Promise<Tables<'user_settings'>>

export async function updateUserSettings(
  client: SupabaseClient<Database>,
  userId: string,
  data: Partial<Tables<'user_settings'>>
): Promise<Tables<'user_settings'>>
// Nota: ignora internamente el campo user_id del data para evitar cambios de ownership

export async function updateApiKeyValidity(
  client: SupabaseClient<Database>,
  userId: string,
  keyType: 'flash_free' | 'pro_paid',
  isValid: boolean
): Promise<void>
```

### `lib/services/history.service.ts`

```typescript
export async function saveToHistory(
  client: SupabaseClient<Database>,
  data: Insert<'prompt_history'>
): Promise<Tables<'prompt_history'>>

export async function getUserHistory(
  client: SupabaseClient<Database>,
  userId: string,
  options?: {
    module?: 'improver' | 'builder' | 'prd'
    limit?: number   // default: 20
    offset?: number  // default: 0
  }
): Promise<{ data: Tables<'prompt_history'>[]; count: number }>

export async function deleteHistoryEntry(
  client: SupabaseClient<Database>,
  id: string,
  userId: string
): Promise<void>

export async function clearUserHistory(
  client: SupabaseClient<Database>,
  userId: string
): Promise<void>
```

### `lib/services/templates.service.ts`

```typescript
export async function getTemplates(
  client: SupabaseClient<Database>,
  userId: string,
  filters: TemplateFilters
): Promise<TemplateWithRelations[]>

export async function getTemplateById(
  client: SupabaseClient<Database>,
  id: string,
  userId: string
): Promise<TemplateWithRelations>

export async function createTemplate(
  client: SupabaseClient<Database>,
  userId: string,
  payload: CreateTemplatePayload
): Promise<{
  template: Tables<'prompt_templates'>
  mainBranch: Tables<'template_branches'>
}>
// Nota: crea template + rama 'main' con is_main=true + tags opcionales, todo atómico

export async function updateTemplate(
  client: SupabaseClient<Database>,
  id: string,
  userId: string,
  data: Partial<{
    name: string
    description: string
    category_id: string
    is_nsfw: boolean
  }>
): Promise<Tables<'prompt_templates'>>

export async function softDeleteTemplate(
  client: SupabaseClient<Database>,
  id: string,
  userId: string
): Promise<void>
// Marca is_deleted=true, deleted_at=now()

export async function restoreTemplate(
  client: SupabaseClient<Database>,
  id: string,
  userId: string
): Promise<void>
// Marca is_deleted=false, deleted_at=null

export async function permanentDeleteTemplate(
  client: SupabaseClient<Database>,
  id: string,
  userId: string
): Promise<void>

export async function searchTemplates(
  client: SupabaseClient<Database>,
  userId: string,
  query: string,
  showNsfw: boolean
): Promise<TemplateWithRelations[]>
```

### `lib/services/branches.service.ts`

```typescript
export async function getBranchesForTemplate(
  client: SupabaseClient<Database>,
  templateId: string,
  userId: string
): Promise<BranchSummary[]>

export async function getBranchWithHistory(
  client: SupabaseClient<Database>,
  branchId: string,
  userId: string
): Promise<BranchWithHistory>

export async function createBranch(
  client: SupabaseClient<Database>,
  userId: string,
  payload: CreateBranchPayload
): Promise<Tables<'template_branches'>>
// is_main siempre false en ramas nuevas

export async function updateBranchContent(
  client: SupabaseClient<Database>,
  branchId: string,
  userId: string,
  content: string,
  changeDescription?: string
): Promise<Tables<'template_branches'>>
// También inserta snapshot en branch_history automáticamente

export async function mergeBranchToMain(
  client: SupabaseClient<Database>,
  userId: string,
  payload: MergeBranchPayload
): Promise<void>
// Demota targetBranchId (is_main=false), promociona sourceBranchId (is_main=true)
// ⚠️ No usa transacción — si falla a mitad queda sin main. Conocido/aceptado.

export async function deleteBranch(
  client: SupabaseClient<Database>,
  branchId: string,
  userId: string
): Promise<void>
// Lanza Error('Cannot delete main branch') si is_main=true

export async function getDiffBetweenBranches(
  client: SupabaseClient<Database>,
  branchIdA: string,
  branchIdB: string,
  userId: string
): Promise<{ contentA: string; contentB: string }>
```

### `lib/services/categories.service.ts`

```typescript
export async function getCategoriesForUser(
  client: SupabaseClient<Database>,
  userId: string
): Promise<Tables<'template_categories'>[]>
// Ordenadas por sort_order ASC

export async function createCategory(
  client: SupabaseClient<Database>,
  userId: string,
  data: { name: string; emoji?: string }
): Promise<Tables<'template_categories'>>
// emoji default: '📁'

export async function updateCategory(
  client: SupabaseClient<Database>,
  id: string,
  userId: string,
  data: { name?: string; emoji?: string }
): Promise<Tables<'template_categories'>>

export async function deleteCategory(
  client: SupabaseClient<Database>,
  id: string,
  userId: string
): Promise<void>

export async function reorderCategories(
  client: SupabaseClient<Database>,
  userId: string,
  orderedIds: string[]
): Promise<void>
// Actualiza sort_order a cada ID según su índice en el array
```

### `lib/services/tags.service.ts`

```typescript
export async function getTagsForTemplate(
  client: SupabaseClient<Database>,
  templateId: string
): Promise<Tables<'template_tags'>[]>

export async function addTagsToTemplate(
  client: SupabaseClient<Database>,
  templateId: string,
  tags: string[],
  createdBy: 'user' | 'ai'
): Promise<Tables<'template_tags'>[]>
// Si tags.length === 0, retorna los tags actuales sin modificar (noop)
// Usa upsert con onConflict: 'template_id,tag'

export async function removeTagFromTemplate(
  client: SupabaseClient<Database>,
  templateId: string,
  tag: string
): Promise<void>

export async function replaceAllTags(
  client: SupabaseClient<Database>,
  templateId: string,
  tags: Array<{ tag: string; createdBy: 'user' | 'ai' }>
): Promise<Tables<'template_tags'>[]>
// Elimina TODOS los tags existentes, luego inserta los nuevos
// Si tags.length === 0, solo borra, no inserta
```

---

## 12. GESTIÓN DE API KEYS — VAULT

### `lib/vault/api-keys.ts`

Todas las funciones requieren el **Service Role Client** (`createSupabaseServiceRoleClient()`). Solo deben llamarse desde Route Handlers del servidor.

```typescript
// Guarda API Key en Supabase Vault y crea referencia en user_api_keys
export async function storeApiKey(params: {
  userId: string
  keyType: 'flash_free' | 'pro_paid'
  apiKey: string
  serviceClient: SupabaseClient<Database>
}): Promise<{ success: boolean; error?: string }>
// En caso de fallo del upsert → hace rollback del vault.create_secret

// Recupera API Key del Vault (texto plano)
export async function retrieveApiKey(params: {
  userId: string
  keyType: 'flash_free' | 'pro_paid'
  serviceClient: SupabaseClient<Database>
}): Promise<string | null>
// Retorna null si no existe o si falla el vault

// Elimina API Key del Vault y su referencia en user_api_keys
export async function deleteApiKey(params: {
  userId: string
  keyType: 'flash_free' | 'pro_paid'
  serviceClient: SupabaseClient<Database>
}): Promise<{ success: boolean; error?: string }>
// Retorna { success: true } si no había key (idempotente)

// Verifica si existe referencia de key
export async function hasApiKey(params: {
  userId: string
  keyType: 'flash_free' | 'pro_paid'
  serviceClient: SupabaseClient<Database>
}): Promise<boolean>

// Resuelve qué API Key usar según modelo y configuración del usuario
export async function resolveApiKey(params: {
  userId: string
  model: ModelKey
  serviceClient: SupabaseClient<Database>
}): Promise<{ apiKey: string; keyType: 'flash_free' | 'pro_paid' } | null>
// Lógica:
//   si use_paid_key_for_all=true → siempre usa pro_paid
//   si model='pro' → usa pro_paid
//   si model='flash' → usa flash_free
// Retorna null si no hay key del tipo requerido
```

---

## 13. CONTRATOS COMPLETOS DE ROUTE HANDLERS

### Patrón de seguridad aplicado a TODOS los handlers

1. Crear `supabase = await createSupabaseServerClient()`
2. `user = await requireAuth(supabase)` — lanza `AuthError` si no hay sesión
3. Parsear body con Zod — retorna 400 si inválido
4. Para operaciones con vault: crear `serviceClient = createSupabaseServiceRoleClient()`
5. Lógica de negocio
6. Manejo de errores: `AuthError` → 401, cualquier otro → 500 genérico

**Los mensajes de error al cliente son siempre genéricos.** Nunca expone detalles técnicos, stack traces ni valores de API Keys.

---

### `POST /api/ai/improve`

**Request body (Zod schema):**
```typescript
{
  prompt: string            // min 10, max 50000
  interventionLevel: 'subtle' | 'moderate' | 'aggressive'
  model: 'flash' | 'pro'
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

**Response exitosa (200):**
```typescript
{
  data: {
    originalPrompt: string
    improvedPrompt: string
    changes: Array<{
      vector: string
      description: string
      type: 'addition' | 'removal' | 'restructure'
    }>
  }
}
```

**Guarda en historial:** Sí (`module: 'improver'`). El `metadata` incluye `{ interventionLevel, changes }`.

**Respuesta de error 422 (sin API Key):**
```typescript
{ error: 'API_KEY_NOT_CONFIGURED', keyType: 'flash_free' | 'pro_paid' }
```

---

### `POST /api/ai/build`

**Request body:**
```typescript
{
  credo: {
    context?: string
    role?: string
    expectation?: string
    data?: string
    outputFormat?: string
  }
  model: 'flash' | 'pro'
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

**Response exitosa (200):**
```typescript
{
  data: {
    assembledPrompt: string
    refinedPrompt: string
  }
}
```

**Guarda en historial:** Sí (`module: 'builder'`). El `metadata` incluye `{ assembledPrompt }`.

---

### `POST /api/ai/suggest-field`

**Request body:**
```typescript
{
  field: 'context' | 'role' | 'expectation' | 'data' | 'outputFormat'
  filledFields: Record<string, string | undefined>
  model: 'flash' | 'pro'
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

**Response exitosa (200):**
```typescript
{
  data: {
    suggestion: string
    explanation: string
  }
}
```

**Guarda en historial:** No.

---

### `POST /api/ai/prd` ⚠️ STREAMING

**Request body:**
```typescript
{
  description: string    // min 20, max 10000
  productType?: string
  targetAudience?: string
  techStack?: string
  detailLevel: 'basic' | 'standard' | 'exhaustive'
  language?: 'auto' | 'es' | 'en' | 'pt'  // default: 'auto'
  model: 'flash' | 'pro'
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

**Response:** `ReadableStream` de texto plano (`Content-Type: text/plain; charset=utf-8`).

**Cómo consumirlo en el cliente:**
```typescript
const res = await fetch('/api/ai/prd', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

if (!res.ok) {
  const error = await res.json()
  // manejo de error
  return
}

const reader = res.body!.getReader()
const decoder = new TextDecoder()
let content = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value)
  content += chunk
  setContent(prev => prev + chunk)  // actualizar estado incremental
}
```

**Guarda en historial:** Sí (`module: 'prd'`), después de cerrar el stream.

---

### `POST /api/ai/suggest-tags`

**Request body:**
```typescript
{
  templateName: string      // min 1, max 200
  promptContent: string     // min 1, max 50000
  existingTags: string[]    // default: []
}
```

**Response exitosa (200):**
```typescript
{
  data: {
    suggestedTags: string[]   // máx 8, lowercase, con guiones
  }
}
```

**Nota:** Usa siempre `Flash` con `LOW` independientemente del modelo seleccionado por el usuario.

---

### `POST /api/ai/adapt`

**Request body:**
```typescript
{
  originalPrompt: string    // min 1, max 50000
  userContext: string       // min 10, max 5000
  model: 'flash' | 'pro'
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

**Response exitosa (200):**
```typescript
{
  data: {
    adaptedPrompt: string
    changes: string[]
  }
}
```

---

### `POST /api/ai/refine-template`

**Request body:**
```typescript
{
  promptContent: string     // min 10, max 50000
  model: 'flash' | 'pro'
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

**Response exitosa (200):**
```typescript
{
  data: {
    refinedPrompt: string
    improvements: string[]
  }
}
```

---

### `POST /api/keys/store`

**Request body:**
```typescript
{
  keyType: 'flash_free' | 'pro_paid'
  apiKey: string              // min 10, max 500
}
```

**Response exitosa (200):**
```typescript
{ success: true }
```

**Seguridad:** La API Key se almacena en Supabase Vault. La respuesta NUNCA contiene el valor de la key ni el `vault_secret_id`.

**Response error 500:**
```typescript
{ error: 'Unable to store API key' }
```

---

### `POST /api/keys/verify`

**Request body:**
```typescript
{
  keyType: 'flash_free' | 'pro_paid'
}
```

**Response exitosa (200):**
```typescript
{
  data: { isValid: boolean }
}
```

**Nota:** Actualiza `is_valid` y `last_verified_at` en `user_api_keys`.

---

### `DELETE /api/keys/delete`

**Request body:**
```typescript
{
  keyType: 'flash_free' | 'pro_paid'
}
```

**Response exitosa (200):**
```typescript
{ success: true }
```

---

### Handlers por crear (Fase 2 — frontend)

Estos Route Handlers **no existen aún** y deben crearse en la Fase 2:

#### `GET /api/history`
```typescript
// Query params: module?, limit?, offset?
// Llama a getUserHistory() y retorna { data, count }
```

#### `GET /api/settings` + `PUT /api/settings`
```typescript
// GET: llama a getUserSettings() y retorna la fila completa
// PUT: valida con Zod y llama a updateUserSettings()
```

---

## 14. ZUSTAND STORES

### `lib/store/ui.store.ts` — Estado UI global

```typescript
// Importar en componentes cliente:
import { useUIStore } from '@/lib/store/ui.store'

interface UIState {
  activeModule: 'improver' | 'builder' | 'prd' | 'templates' | 'history' | 'settings'
  isSidebarOpen: boolean

  // Thinking level por módulo (defaults del PRD):
  thinkingLevels: {
    improver: ThinkingLevelKey   // 'MEDIUM'
    builder:  ThinkingLevelKey   // 'MEDIUM'
    prd:      ThinkingLevelKey   // 'HIGH'
    templates:ThinkingLevelKey   // 'LOW'
  }

  // Modelo por módulo:
  selectedModels: {
    improver:  ModelKey  // 'flash'
    builder:   ModelKey  // 'flash'
    prd:       ModelKey  // 'pro'
    templates: ModelKey  // 'flash'
  }

  // Acciones:
  setActiveModule: (module: UIState['activeModule']) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setThinkingLevel: (module: AIModule, level: ThinkingLevelKey) => void
  setSelectedModel: (module: AIModule, model: ModelKey) => void
}
```

**Nota:** Este store **no persiste** en localStorage.

---

### `lib/store/settings.store.ts` — Settings del usuario

```typescript
// Importar en componentes cliente:
import { useSettingsStore } from '@/lib/store/settings.store'

interface SettingsState {
  defaultModel: ModelKey                       // 'flash'
  defaultThinkingLevel: ThinkingLevelKey       // 'MEDIUM'
  usePaidKeyForAll: boolean                    // false
  showNsfw: boolean                            // false
  theme: 'dark' | 'light' | 'system'          // 'dark'
  defaultExportFormat: 'markdown' | 'txt'     // 'markdown'
  prdDefaultDetail: 'basic' | 'standard' | 'exhaustive'  // 'standard'
  prdDefaultLanguage: 'auto' | 'es' | 'en' | 'pt'        // 'auto'

  apiKeyStatus: {
    flash: 'configured' | 'not_configured' | 'invalid' | 'verifying'
    pro:   'configured' | 'not_configured' | 'invalid' | 'verifying'
  }

  // Acciones:
  setSettings: (settings: Partial<Omit<SettingsState, 'setSettings' | 'setApiKeyStatus' | 'apiKeyStatus'>>) => void
  setApiKeyStatus: (type: 'flash' | 'pro', status: SettingsState['apiKeyStatus']['flash']) => void
}
```

**Persistencia en localStorage (via zustand `persist`):**
Persiste: `defaultModel`, `defaultThinkingLevel`, `usePaidKeyForAll`, `showNsfw`, `theme`, `defaultExportFormat`, `prdDefaultDetail`, `prdDefaultLanguage`.

**No persiste:** `apiKeyStatus` (se recalcula desde el servidor en cada sesión).

La clave en localStorage es `'kami-prompter-settings'`.

---

## 15. UTILIDADES DEL FRONTEND

### `lib/utils/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string
// Combina clases condicionales y resuelve conflictos de Tailwind.
// Usar en todos los componentes para construir className.
```

**Uso:**
```tsx
className={cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-class',
  className  // prop externa
)}
```

---

### `lib/utils/token-counter.ts`

```typescript
// Heurística: 4 caracteres ≈ 1 token
export function estimateTokens(text: string): number
// '' → 0, 'abcd' → 1, 'abc' → 1 (Math.ceil(3/4))

export function estimateTokensMultiple(texts: string[]): number
// Suma estimateTokens de cada texto del array

export function formatTokenCount(count: number): string
// count < 1000 → '~count'      e.g. '~340'
// count >= 1000 → '~{n}k'      e.g. '~1.5k', '~12.4k'
```

**Uso típico en componentes:**
```tsx
import { estimateTokens, formatTokenCount } from '@/lib/utils/token-counter'

const tokenDisplay = formatTokenCount(estimateTokens(promptText))
// Renderizar como texto plano sin animaciones (se actualiza frecuentemente)
```

---

### `lib/utils/diff-parser.ts`

```typescript
export interface DiffSegment {
  text: string
  type: 'unchanged' | 'added' | 'removed' | 'restructured'
}

export function parseDiff(original: string, improved: string): DiffSegment[]
// Algoritmo LCS (Longest Common Subsequence) línea a línea.
// Detecta 'restructured' cuando una línea se reemplaza por otra (added→removed o removed→added adyacentes).
// Bugs corregidos en Fase 1.5: manejo correcto de strings vacíos + detección bidireccional de restructured.
```

**Uso en el componente DiffView:**
```tsx
import { parseDiff } from '@/lib/utils/diff-parser'

const segments = parseDiff(originalPrompt, improvedPrompt)
// Renderizar cada segmento con color según su type
```

**Mapeo de colores CSS recomendado:**
```css
/* En globals.css ya definidas: */
--diff-added:         rgba(16, 185, 129, 0.14)
--diff-removed:       rgba(239, 68, 68, 0.14)
--diff-restructured:  rgba(245, 158, 11, 0.14)
--diff-added-text:    #6ee7b7
--diff-removed-text:  #fca5a5
--diff-restructured-text: #fcd34d
```

---

### `lib/utils/markdown-exporter.ts`

```typescript
// Genera contenido markdown con cabecera de metadatos opcional
export function generateMarkdownContent(
  content: string,
  metadata?: {
    title?: string
    module?: string
    createdAt?: Date
  }
): string
// Si metadata.title → añade '# {title}\n\n'
// Si metadata.module o metadata.createdAt → añade front matter YAML

// Genera nombre de archivo con timestamp
export function generateFilename(
  type: 'prd' | 'prompt' | 'template',
  date?: Date  // default: new Date()
): string
// Ejemplo: 'kami-prompter-prd-2026-03-22.md'
```

**La descarga real del archivo ocurre en el cliente.** Crear una función helper en el componente:
```tsx
const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## 16. MODELO DE SEGURIDAD

### Principios implementados

1. **API Keys nunca en el cliente:** Las keys se almacenan en Supabase Vault. Solo se recuperan en Route Handlers de servidor. La respuesta de `/api/keys/store` es solo `{ success: true }` — nunca devuelve el valor.

2. **Nunca en logs:** El `GeminiClient` tiene un sanitizador de regex que reemplaza el patrón `AIza[0-9A-Za-z-_]{20,}` por `[REDACTED]` en mensajes de error antes de loguear.

3. **Service Role Key solo en servidor:** `SUPABASE_SERVICE_ROLE_KEY` está sin prefijo `NEXT_PUBLIC_` — Next.js lo excluye automáticamente del bundle del cliente.

4. **RLS en todas las tablas:** El SQL de RLS garantiza que un usuario nunca puede leer datos de otro, incluso si llama directamente a Supabase.

5. **Doble capa de auth en Route Handlers:** Cada handler llama a `requireAuth()` antes de cualquier operación.

6. **Errores genéricos al cliente:** Todos los `catch` en Route Handlers retornan `{ error: 'Internal server error' }` (status 500), nunca el mensaje interno real.

### Lo que el frontend NUNCA debe hacer

- Llamar directamente a Supabase para operaciones de datos (solo para autenticación con `createSupabaseBrowserClient()`)
- Usar `SUPABASE_SERVICE_ROLE_KEY` en cualquier componente
- Mostrar el valor de una API Key en texto plano en la UI
- Almacenar valores de API Keys en `localStorage`, `sessionStorage` o cookies del cliente

---

## 17. PATRONES DE ERROR EN API

### Tabla de respuestas de error por situación

| Situación | HTTP Status | Body |
|---|---|---|
| Request mal formado / Zod falla | 400 | `{ error: 'Invalid request', details: ZodFlattenedErrors }` |
| No autenticado | 401 | `{ error: 'Unauthorized' }` |
| API Key no configurada | 422 | `{ error: 'API_KEY_NOT_CONFIGURED', keyType: 'flash_free' \| 'pro_paid' }` |
| Error interno del servidor | 500 | `{ error: 'Internal server error' }` |
| Éxito genérico | 200 | `{ data: <payload> }` o `{ success: true }` |

### Manejo en el frontend

```tsx
const handleApiError = (status: number, body: { error: string; keyType?: string }) => {
  if (status === 401) {
    // Sesión expirada → logout y redirect a /login
    supabase.auth.signOut().then(() => router.replace('/login'))
    return
  }
  if (status === 422 && body.error === 'API_KEY_NOT_CONFIGURED') {
    // Mostrar toast + opcional: resaltar el botón de configuración de API Keys
    showToast(`Configura tu API Key de ${body.keyType === 'pro_paid' ? 'Gemini Pro' : 'Gemini Flash'}`, 'warning')
    return
  }
  if (status === 400) {
    showToast('Los datos enviados no son válidos', 'error')
    return
  }
  // 500 u otro
  showToast('Error del servidor. Intenta de nuevo.', 'error')
}
```

---

## 18. INFRAESTRUCTURA DE TESTS

### Estado actual: ✅ 141/141 tests pasando

### Configuración

**`vitest.config.ts`:**
```typescript
{
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
    },
  },
  resolve: { alias: { '@': '.' } }
}
```

**`tests/setup.ts`:**
```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
```

### Helpers de testing disponibles

**`tests/unit/helpers/supabase-mock.ts`:**
```typescript
export interface MockQueryBuilder { /* builder pattern completo con vi.fn() */ }
export type MockSupabaseClient = SupabaseClient<Database> & { __mock: { ... } }

export function createMockSupabaseClient(overrides?): SupabaseClient<Database>
export function mockSupabaseSuccess<T>(data: T): { data: T; error: null }
export function mockSupabaseError(message: string, code?: string): { data: null; error: {...} }
```

**`tests/unit/helpers/route-handler.ts`:**
```typescript
export function createMockRequest(body: unknown, options?: { method?, headers? }): Request
```

### Cobertura de tests existentes

| Módulo | Tests | Archivos testeados |
|---|---|---|
| `utils/token-counter` | 8 | `lib/utils/token-counter.ts` |
| `utils/diff-parser` | 6 | `lib/utils/diff-parser.ts` |
| `utils/markdown-exporter` | 5 | `lib/utils/markdown-exporter.ts` |
| `ai/thinking` | 7 | `lib/ai/thinking.ts` |
| `ai/gemini-client` | 18 | `lib/ai/gemini-client.ts` |
| `services/auth` | 5 | `lib/services/auth.service.ts` |
| `services/settings` | 4 | `lib/services/settings.service.ts` |
| `services/history` | 9 | `lib/services/history.service.ts` |
| `services/templates` | 12 | `lib/services/templates.service.ts` |
| `services/branches` | 11 | `lib/services/branches.service.ts` |
| `services/categories` | 7 | `lib/services/categories.service.ts` |
| `services/tags` | 7 | `lib/services/tags.service.ts` |
| `vault/api-keys` | 10 | `lib/vault/api-keys.ts` |
| `api/improve.route` | 6 | `app/api/ai/improve/route.ts` |
| `api/prd.route` | 6 | `app/api/ai/prd/route.ts` |
| `api/keys-store.route` | 5 | `app/api/keys/store/route.ts` |
| **Total** | **141** | — |

---

## APÉNDICE: FLUJO COMPLETO DE UNA OPERACIÓN AI

Para ilustrar cómo se conectan todas las capas, el flujo completo del Prompt Improver:

```
[Componente ImproverInput.tsx] (cliente)
    ↓ fetch POST /api/ai/improve
    
[app/api/ai/improve/route.ts] (servidor)
    ↓ createSupabaseServerClient()
    ↓ requireAuth(supabase) → user.id
    ↓ ImproveSchema.safeParse(body)
    ↓ createSupabaseServiceRoleClient()
    ↓ resolveApiKey({ userId, model, serviceClient })
        → lib/vault/api-keys.ts:resolveApiKey
            → getUserSettings → lee use_paid_key_for_all
            → retrieveApiKey → vault.get_secret → apiKey string
    ↓ new GeminiClient(apiKey)
    ↓ geminiClient.generateContent({ model, systemPrompt, userPrompt, thinkingLevel })
        → lib/ai/gemini-client.ts
            → this.ai.models.generateContent(...)  (SDK de Google)
            → retry automático si 429/5xx
    ↓ parseImproverPayload(raw) → { improvedPrompt, changes }
    ↓ saveToHistory(supabase, { user_id, module:'improver', ... })
    ↓ Response.json({ data: { originalPrompt, improvedPrompt, changes } })
    
[Componente DiffView.tsx] (cliente)
    ↓ parseDiff(originalPrompt, improvedPrompt) → DiffSegment[]
    ↓ Renderizar segmentos con colores CSS de diff
    ↓ Mostrar lista de changes con iconos de lucide-react
```

---

*Documento generado automáticamente a partir del código fuente real del proyecto.*  
*Versión del código: Fase 1 + Fase 1.5 completadas — 141 tests pasando.*
