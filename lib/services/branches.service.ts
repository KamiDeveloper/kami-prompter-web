import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  BranchSummary,
  BranchWithHistory,
  CreateBranchPayload,
  Database,
  MergeBranchPayload,
  Tables,
} from '@/types'

type TemplateBranch = Tables<'template_branches'>
type BranchHistory = Tables<'branch_history'>

async function ensureTemplateOwnership(client: SupabaseClient<Database>, templateId: string, userId: string): Promise<void> {
  const { data, error } = await client
    .from('prompt_templates')
    .select('id')
    .eq('id', templateId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Template not found')
  }
}

async function ensureBranchOwnership(client: SupabaseClient<Database>, branchId: string, userId: string): Promise<TemplateBranch> {
  const { data: branch, error } = await client
    .from('template_branches')
    .select('*, prompt_templates!inner(user_id)')
    .eq('id', branchId)
    .eq('prompt_templates.user_id', userId)
    .single()

  if (error || !branch) {
    throw new Error('Branch not found')
  }

  return branch as TemplateBranch
}

/**
 * Lista ramas de una plantilla del usuario.
 * @param client Cliente Supabase server-side.
 * @param templateId ID de plantilla.
 * @param userId ID del usuario autenticado.
 * @returns Resumen de ramas.
 */
export async function getBranchesForTemplate(
  client: SupabaseClient<Database>,
  templateId: string,
  userId: string,
): Promise<BranchSummary[]> {
  await ensureTemplateOwnership(client, templateId, userId)

  const { data, error } = await client
    .from('template_branches')
    .select('*')
    .eq('template_id', templateId)
    .order('updated_at', { ascending: false })

  if (error || !data) {
    throw new Error('Unable to fetch branches')
  }

  const branches = data as TemplateBranch[]

  return branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    is_main: Boolean(branch.is_main),
    parent_branch_id: branch.parent_branch_id,
    updated_at: branch.updated_at ?? new Date(0).toISOString(),
  }))
}

/**
 * Obtiene una rama con su historial.
 * @param client Cliente Supabase server-side.
 * @param branchId ID de rama.
 * @param userId ID del usuario autenticado.
 * @returns Rama completa con historial asociado.
 */
export async function getBranchWithHistory(
  client: SupabaseClient<Database>,
  branchId: string,
  userId: string,
): Promise<BranchWithHistory> {
  const branch = await ensureBranchOwnership(client, branchId, userId)

  const { data: history, error: historyError } = await client
    .from('branch_history')
    .select('*')
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false })

  if (historyError) {
    throw new Error('Unable to fetch branch history')
  }

  const historyEntries = (history ?? []) as BranchHistory[]

  return {
    id: branch.id,
    name: branch.name,
    content: branch.content,
    is_main: Boolean(branch.is_main),
    parent_branch_id: branch.parent_branch_id,
    history: historyEntries.map((entry) => ({
      id: entry.id,
      content: entry.content,
      change_description: entry.change_description,
      created_at: entry.created_at ?? new Date(0).toISOString(),
    })),
    created_at: branch.created_at ?? new Date(0).toISOString(),
    updated_at: branch.updated_at ?? new Date(0).toISOString(),
  }
}

/**
 * Crea una nueva rama para una plantilla.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param payload Datos para nueva rama.
 * @returns Rama creada.
 */
export async function createBranch(
  client: SupabaseClient<Database>,
  userId: string,
  payload: CreateBranchPayload,
): Promise<TemplateBranch> {
  await ensureTemplateOwnership(client, payload.templateId, userId)

  const { data, error } = await client
    .from('template_branches')
    .insert({
      template_id: payload.templateId,
      name: payload.branchName,
      content: payload.sourceContent,
      is_main: false,
      parent_branch_id: payload.parentBranchId ?? null,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error('Unable to create branch')
  }

  return data as TemplateBranch
}

/**
 * Actualiza contenido de rama y registra snapshot en historial.
 * @param client Cliente Supabase server-side.
 * @param branchId ID de rama a actualizar.
 * @param userId ID del usuario autenticado.
 * @param content Nuevo contenido de la rama.
 * @param changeDescription Descripcion opcional del cambio.
 * @returns Rama actualizada.
 */
export async function updateBranchContent(
  client: SupabaseClient<Database>,
  branchId: string,
  userId: string,
  content: string,
  changeDescription?: string,
): Promise<TemplateBranch> {
  await ensureBranchOwnership(client, branchId, userId)

  const { data: updatedBranch, error: branchError } = await client
    .from('template_branches')
    .update({ content })
    .eq('id', branchId)
    .select('*')
    .single()

  if (branchError || !updatedBranch) {
    throw new Error('Unable to update branch content')
  }

  const { error: historyError } = await client.from('branch_history').insert({
    branch_id: branchId,
    content,
    change_description: changeDescription ?? null,
  })

  if (historyError) {
    throw new Error('Unable to append branch history')
  }

  return updatedBranch as TemplateBranch
}

/**
 * Convierte la rama fuente en main y desmarca la main anterior.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param payload Datos de merge fuente/destino.
 * @returns Promesa resuelta sin valor.
 */
export async function mergeBranchToMain(
  client: SupabaseClient<Database>,
  userId: string,
  payload: MergeBranchPayload,
): Promise<void> {
  await ensureTemplateOwnership(client, payload.templateId, userId)

  const { data: sourceBranch, error: sourceError } = await client
    .from('template_branches')
    .select('*')
    .eq('id', payload.sourceBranchId)
    .eq('template_id', payload.templateId)
    .single()

  if (sourceError || !sourceBranch) {
    throw new Error('Source branch not found')
  }

  const { error: clearError } = await client
    .from('template_branches')
    .update({ is_main: false })
    .eq('template_id', payload.templateId)
    .eq('id', payload.targetBranchId)

  if (clearError) {
    throw new Error('Unable to demote current main branch')
  }

  const { error: promoteError } = await client
    .from('template_branches')
    .update({ is_main: true })
    .eq('id', payload.sourceBranchId)
    .eq('template_id', payload.templateId)

  if (promoteError) {
    throw new Error('Unable to promote source branch to main')
  }
}

/**
 * Elimina una rama no-main.
 * @param client Cliente Supabase server-side.
 * @param branchId ID de rama.
 * @param userId ID del usuario autenticado.
 * @returns Promesa resuelta sin valor.
 */
export async function deleteBranch(client: SupabaseClient<Database>, branchId: string, userId: string): Promise<void> {
  const branch = await ensureBranchOwnership(client, branchId, userId)

  if (branch.is_main) {
    throw new Error('Cannot delete main branch')
  }

  const { error } = await client.from('template_branches').delete().eq('id', branchId)

  if (error) {
    throw new Error('Unable to delete branch')
  }
}

/**
 * Recupera el contenido de dos ramas para calculo de diff.
 * @param client Cliente Supabase server-side.
 * @param branchIdA ID de rama A.
 * @param branchIdB ID de rama B.
 * @param userId ID del usuario autenticado.
 * @returns Contenidos de ambas ramas.
 */
export async function getDiffBetweenBranches(
  client: SupabaseClient<Database>,
  branchIdA: string,
  branchIdB: string,
  userId: string,
): Promise<{ contentA: string; contentB: string }> {
  const [branchA, branchB] = await Promise.all([
    ensureBranchOwnership(client, branchIdA, userId),
    ensureBranchOwnership(client, branchIdB, userId),
  ])

  return {
    contentA: branchA.content,
    contentB: branchB.content,
  }
}

export type { TemplateBranch, BranchHistory }
