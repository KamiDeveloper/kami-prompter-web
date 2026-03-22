import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Tables } from '@/types'

type TemplateCategory = Tables<'template_categories'>

/**
 * Lista categorias del usuario ordenadas por sort_order.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @returns Arreglo de categorias.
 */
export async function getCategoriesForUser(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<TemplateCategory[]> {
  const { data, error } = await client
    .from('template_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    throw new Error('Unable to fetch categories')
  }

  return data as TemplateCategory[]
}

/**
 * Crea una categoria para el usuario.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param data Nombre y emoji opcional.
 * @returns Categoria creada.
 */
export async function createCategory(
  client: SupabaseClient<Database>,
  userId: string,
  data: { name: string; emoji?: string },
): Promise<TemplateCategory> {
  const { data: created, error } = await client
    .from('template_categories')
    .insert({
      user_id: userId,
      name: data.name,
      emoji: data.emoji ?? '📁',
    })
    .select('*')
    .single()

  if (error || !created) {
    throw new Error('Unable to create category')
  }

  return created as TemplateCategory
}

/**
 * Actualiza una categoria del usuario.
 * @param client Cliente Supabase server-side.
 * @param id ID de categoria.
 * @param userId ID del usuario autenticado.
 * @param data Campos editables de categoria.
 * @returns Categoria actualizada.
 */
export async function updateCategory(
  client: SupabaseClient<Database>,
  id: string,
  userId: string,
  data: { name?: string; emoji?: string },
): Promise<TemplateCategory> {
  const { data: updated, error } = await client
    .from('template_categories')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !updated) {
    throw new Error('Unable to update category')
  }

  return updated as TemplateCategory
}

/**
 * Elimina una categoria del usuario.
 * @param client Cliente Supabase server-side.
 * @param id ID de categoria.
 * @param userId ID del usuario autenticado.
 * @returns Promesa resuelta sin valor.
 */
export async function deleteCategory(client: SupabaseClient<Database>, id: string, userId: string): Promise<void> {
  const { error } = await client.from('template_categories').delete().eq('id', id).eq('user_id', userId)

  if (error) {
    throw new Error('Unable to delete category')
  }
}

/**
 * Reordena categorias actualizando sort_order.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param orderedIds IDs en el nuevo orden deseado.
 * @returns Promesa resuelta sin valor.
 */
export async function reorderCategories(
  client: SupabaseClient<Database>,
  userId: string,
  orderedIds: string[],
): Promise<void> {
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index]
    const { error } = await client
      .from('template_categories')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error('Unable to reorder categories')
    }
  }
}

export type { TemplateCategory }
