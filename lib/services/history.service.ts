import type { SupabaseClient } from '@supabase/supabase-js'

import type { AIModule, Database, Insert, Tables } from '@/types'

type PromptHistory = Tables<'prompt_history'>
type HistoryInsert = Insert<'prompt_history'>

/**
 * Guarda una entrada en historial de prompts.
 * @param client Cliente Supabase server-side.
 * @param data Payload de insercion para prompt_history.
 * @returns Fila insertada en historial.
 */
export async function saveToHistory(client: SupabaseClient<Database>, data: HistoryInsert): Promise<PromptHistory> {
  const { data: inserted, error } = await client.from('prompt_history').insert(data).select('*').single()

  if (error || !inserted) {
    throw new Error('Unable to save history entry')
  }

  return inserted as PromptHistory
}

/**
 * Lista historial paginado de un usuario, opcionalmente por modulo.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param options Filtros y paginacion.
 * @returns Lista de entradas y conteo total.
 */
export async function getUserHistory(
  client: SupabaseClient<Database>,
  userId: string,
  options?: {
    module?: Extract<AIModule, 'improver' | 'builder' | 'prd'>
    limit?: number
    offset?: number
  },
): Promise<{ data: PromptHistory[]; count: number }> {
  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0

  let query = client
    .from('prompt_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.module) {
    query = query.eq('module', options.module)
  }

  const { data, count, error } = await query

  if (error || !data) {
    throw new Error('Unable to fetch history')
  }

  const rows = data as PromptHistory[]

  return {
    data: rows,
    count: count ?? 0,
  }
}

/**
 * Obtiene una entrada de historial por ID para un usuario especifico.
 * @param client Cliente Supabase server-side.
 * @param id ID de la entrada de historial.
 * @param userId ID del usuario autenticado.
 * @returns Entrada encontrada o null cuando no existe.
 */
export async function getHistoryEntryById(
  client: SupabaseClient<Database>,
  id: string,
  userId: string,
): Promise<PromptHistory | null> {
  const { data, error } = await client
    .from('prompt_history')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error('Unable to fetch history entry')
  }

  return (data as PromptHistory | null) ?? null
}

/**
 * Elimina una entrada especifica del historial del usuario.
 * @param client Cliente Supabase server-side.
 * @param id ID de la entrada.
 * @param userId ID del usuario autenticado.
 * @returns Promesa resuelta sin valor.
 */
export async function deleteHistoryEntry(client: SupabaseClient<Database>, id: string, userId: string): Promise<void> {
  const { error } = await client.from('prompt_history').delete().eq('id', id).eq('user_id', userId)

  if (error) {
    throw new Error('Unable to delete history entry')
  }
}

/**
 * Limpia todo el historial de un usuario.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @returns Promesa resuelta sin valor.
 */
export async function clearUserHistory(client: SupabaseClient<Database>, userId: string): Promise<void> {
  const { error } = await client.from('prompt_history').delete().eq('user_id', userId)

  if (error) {
    throw new Error('Unable to clear user history')
  }
}

export type { PromptHistory, HistoryInsert }
