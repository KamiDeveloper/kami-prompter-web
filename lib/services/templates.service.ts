import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  BranchSummary,
  CreateTemplatePayload,
  Database,
  TemplateFilters,
  TemplateWithRelations,
  Tables,
} from '@/types'

type PromptTemplate = Tables<'prompt_templates'>
type TemplateBranch = Tables<'template_branches'>
type TemplateTag = Tables<'template_tags'>
type TemplateCategory = Tables<'template_categories'>

function sortTemplates(data: TemplateWithRelations[], filters: TemplateFilters): TemplateWithRelations[] {
  const orderBy = filters.orderBy ?? 'updated_at'
  const direction = filters.orderDirection ?? 'desc'

  return [...data].sort((a, b) => {
    const left = String(a[orderBy] ?? '')
    const right = String(b[orderBy] ?? '')
    const compared = left.localeCompare(right)
    return direction === 'asc' ? compared : -compared
  })
}

async function hydrateTemplates(
  client: SupabaseClient<Database>,
  templates: PromptTemplate[],
): Promise<TemplateWithRelations[]> {
  if (templates.length === 0) {
    return []
  }

  const templateIds = templates.map((item) => item.id)
  const categoryIds = templates.map((item) => item.category_id).filter((item): item is string => Boolean(item))

  const [tagsRes, branchesRes, categoriesRes] = await Promise.all([
    client.from('template_tags').select('*').in('template_id', templateIds),
    client.from('template_branches').select('*').in('template_id', templateIds),
    categoryIds.length > 0
      ? client.from('template_categories').select('*').in('id', categoryIds)
      : Promise.resolve({ data: [] as TemplateCategory[], error: null }),
  ])

  if (tagsRes.error || branchesRes.error || categoriesRes.error) {
    throw new Error('Unable to hydrate templates')
  }

  const tags = (tagsRes.data ?? []) as TemplateTag[]
  const branches = (branchesRes.data ?? []) as TemplateBranch[]
  const categories = (categoriesRes.data ?? []) as TemplateCategory[]

  const categoryMap = new Map(categories.map((item) => [item.id, item]))

  return templates.map((template) => {
    const templateTags = tags
      .filter((tag) => tag.template_id === template.id)
      .map((tag) => ({ tag: tag.tag, created_by: (tag.created_by ?? 'user') as 'user' | 'ai' }))

    const templateBranches = branches
      .filter((branch) => branch.template_id === template.id)
      .map<BranchSummary>((branch) => ({
        id: branch.id,
        name: branch.name,
        is_main: Boolean(branch.is_main),
        parent_branch_id: branch.parent_branch_id,
        updated_at: branch.updated_at ?? new Date(0).toISOString(),
      }))

    const mainBranch = branches.find((branch) => branch.template_id === template.id && branch.is_main)
    const category = template.category_id ? categoryMap.get(template.category_id) : null

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      is_nsfw: Boolean(template.is_nsfw),
      category_id: template.category_id,
      category: category
        ? {
            id: category.id,
            name: category.name,
            emoji: category.emoji ?? '📁',
          }
        : undefined,
      tags: templateTags,
      branches: templateBranches,
      main_branch_content: mainBranch?.content,
      created_at: template.created_at ?? new Date(0).toISOString(),
      updated_at: template.updated_at ?? new Date(0).toISOString(),
    }
  })
}

/**
 * Obtiene plantillas del usuario con filtros aplicados.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param filters Filtros de consulta para plantillas.
 * @returns Lista de plantillas hidratadas con relaciones.
 */
export async function getTemplates(
  client: SupabaseClient<Database>,
  userId: string,
  filters: TemplateFilters,
): Promise<TemplateWithRelations[]> {
  let query = client.from('prompt_templates').select('*').eq('user_id', userId).eq('is_deleted', false)

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  if (!filters.showNsfw) {
    query = query.eq('is_nsfw', false)
  }

  if (filters.searchQuery) {
    query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
  }

  const { data, error } = await query

  if (error || !data) {
    throw new Error('Unable to fetch templates')
  }

  let hydrated = await hydrateTemplates(client, data as PromptTemplate[])

  if (filters.tags && filters.tags.length > 0) {
    hydrated = hydrated.filter((template) => {
      const tagSet = new Set(template.tags.map((tag) => tag.tag))
      return filters.tags?.every((tag) => tagSet.has(tag))
    })
  }

  return sortTemplates(hydrated, filters)
}

/**
 * Obtiene una plantilla por ID validando pertenencia al usuario.
 * @param client Cliente Supabase server-side.
 * @param id ID de plantilla.
 * @param userId ID del usuario autenticado.
 * @returns Plantilla completa con relaciones.
 */
export async function getTemplateById(
  client: SupabaseClient<Database>,
  id: string,
  userId: string,
): Promise<TemplateWithRelations> {
  const { data, error } = await client
    .from('prompt_templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Template not found')
  }

  const hydrated = await hydrateTemplates(client, [data as PromptTemplate])
  return hydrated[0]
}

/**
 * Crea una plantilla y su rama principal.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param payload Datos de creacion de plantilla.
 * @returns Template y rama main creadas.
 */
export async function createTemplate(
  client: SupabaseClient<Database>,
  userId: string,
  payload: CreateTemplatePayload,
): Promise<{ template: PromptTemplate; mainBranch: TemplateBranch }> {
  const { data: template, error: templateError } = await client
    .from('prompt_templates')
    .insert({
      user_id: userId,
      name: payload.name,
      description: payload.description ?? null,
      category_id: payload.category_id ?? null,
      is_nsfw: payload.is_nsfw ?? false,
    })
    .select('*')
    .single()

  if (templateError || !template) {
    throw new Error('Unable to create template')
  }

  const createdTemplate = template as PromptTemplate

  const { data: mainBranch, error: branchError } = await client
    .from('template_branches')
    .insert({
      template_id: createdTemplate.id,
      name: 'main',
      content: payload.initialContent,
      is_main: true,
    })
    .select('*')
    .single()

  if (branchError || !mainBranch) {
    throw new Error('Unable to create main branch')
  }

  if (payload.tags && payload.tags.length > 0) {
    const normalizedTags = payload.tags.map((tag) => ({
      template_id: createdTemplate.id,
      tag,
      created_by: 'user' as const,
    }))
    await client.from('template_tags').insert(normalizedTags)
  }

  return { template: createdTemplate, mainBranch: mainBranch as TemplateBranch }
}

/**
 * Actualiza metadatos de una plantilla.
 * @param client Cliente Supabase server-side.
 * @param id ID de plantilla.
 * @param userId ID del usuario autenticado.
 * @param data Campos permitidos para actualizar.
 * @returns Plantilla actualizada.
 */
export async function updateTemplate(
  client: SupabaseClient<Database>,
  id: string,
  userId: string,
  data: Partial<{ name: string; description: string; category_id: string; is_nsfw: boolean }>,
): Promise<PromptTemplate> {
  const { data: updated, error } = await client
    .from('prompt_templates')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !updated) {
    throw new Error('Unable to update template')
  }

  return updated as PromptTemplate
}

/**
 * Realiza soft delete de una plantilla.
 * @param client Cliente Supabase server-side.
 * @param id ID de plantilla.
 * @param userId ID del usuario autenticado.
 * @returns Promesa resuelta sin valor.
 */
export async function softDeleteTemplate(client: SupabaseClient<Database>, id: string, userId: string): Promise<void> {
  const { error } = await client
    .from('prompt_templates')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Unable to soft-delete template')
  }
}

/**
 * Restaura una plantilla previamente eliminada.
 * @param client Cliente Supabase server-side.
 * @param id ID de plantilla.
 * @param userId ID del usuario autenticado.
 * @returns Promesa resuelta sin valor.
 */
export async function restoreTemplate(client: SupabaseClient<Database>, id: string, userId: string): Promise<void> {
  const { error } = await client
    .from('prompt_templates')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error('Unable to restore template')
  }
}

/**
 * Elimina permanentemente una plantilla.
 * @param client Cliente Supabase server-side.
 * @param id ID de plantilla.
 * @param userId ID del usuario autenticado.
 * @returns Promesa resuelta sin valor.
 */
export async function permanentDeleteTemplate(
  client: SupabaseClient<Database>,
  id: string,
  userId: string,
): Promise<void> {
  const { error } = await client.from('prompt_templates').delete().eq('id', id).eq('user_id', userId)

  if (error) {
    throw new Error('Unable to permanently delete template')
  }
}

/**
 * Busca plantillas por texto y bandera NSFW.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param query Texto de busqueda.
 * @param showNsfw Si true, incluye contenido NSFW.
 * @returns Plantillas con relaciones coincidentes.
 */
export async function searchTemplates(
  client: SupabaseClient<Database>,
  userId: string,
  query: string,
  showNsfw: boolean,
): Promise<TemplateWithRelations[]> {
  return getTemplates(client, userId, {
    searchQuery: query,
    showNsfw,
    orderBy: 'updated_at',
    orderDirection: 'desc',
  })
}

export type { PromptTemplate, TemplateBranch }
