import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Tables } from '@/types'

type TemplateTag = Tables<'template_tags'>

/**
 * Lista tags de una plantilla.
 * @param client Cliente Supabase server-side.
 * @param templateId ID de plantilla.
 * @returns Arreglo de tags.
 */
export async function getTagsForTemplate(
  client: SupabaseClient<Database>,
  templateId: string,
): Promise<TemplateTag[]> {
  const { data, error } = await client.from('template_tags').select('*').eq('template_id', templateId)

  if (error || !data) {
    throw new Error('Unable to fetch tags')
  }

  return data as TemplateTag[]
}

/**
 * Inserta multiples tags en una plantilla.
 * @param client Cliente Supabase server-side.
 * @param templateId ID de plantilla.
 * @param tags Lista de tags a agregar.
 * @param createdBy Origen de creacion del tag.
 * @returns Tags actuales de la plantilla.
 */
export async function addTagsToTemplate(
  client: SupabaseClient<Database>,
  templateId: string,
  tags: string[],
  createdBy: 'user' | 'ai',
): Promise<TemplateTag[]> {
  if (tags.length === 0) {
    return getTagsForTemplate(client, templateId)
  }

  const rows = tags.map((tag) => ({
    template_id: templateId,
    tag,
    created_by: createdBy,
  }))

  const { error } = await client.from('template_tags').upsert(rows, { onConflict: 'template_id,tag' })

  if (error) {
    throw new Error('Unable to add tags')
  }

  return getTagsForTemplate(client, templateId)
}

/**
 * Elimina un tag puntual de una plantilla.
 * @param client Cliente Supabase server-side.
 * @param templateId ID de plantilla.
 * @param tag Tag a eliminar.
 * @returns Promesa resuelta sin valor.
 */
export async function removeTagFromTemplate(
  client: SupabaseClient<Database>,
  templateId: string,
  tag: string,
): Promise<void> {
  const { error } = await client.from('template_tags').delete().eq('template_id', templateId).eq('tag', tag)

  if (error) {
    throw new Error('Unable to remove tag')
  }
}

/**
 * Reemplaza todos los tags de una plantilla por la lista indicada.
 * @param client Cliente Supabase server-side.
 * @param templateId ID de plantilla.
 * @param tags Lista final de tags.
 * @returns Tags finales persistidos.
 */
export async function replaceAllTags(
  client: SupabaseClient<Database>,
  templateId: string,
  tags: Array<{ tag: string; createdBy: 'user' | 'ai' }>,
): Promise<TemplateTag[]> {
  const { error: deleteError } = await client.from('template_tags').delete().eq('template_id', templateId)

  if (deleteError) {
    throw new Error('Unable to clear template tags')
  }

  if (tags.length === 0) {
    return []
  }

  const { error: insertError } = await client.from('template_tags').insert(
    tags.map((item) => ({
      template_id: templateId,
      tag: item.tag,
      created_by: item.createdBy,
    })),
  )

  if (insertError) {
    throw new Error('Unable to replace tags')
  }

  return getTagsForTemplate(client, templateId)
}

export type { TemplateTag }
