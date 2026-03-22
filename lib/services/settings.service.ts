import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Tables } from '@/types'

type UserSettings = Tables<'user_settings'>

/**
 * Obtiene configuracion de usuario.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @returns Fila user_settings del usuario.
 */
export async function getUserSettings(client: SupabaseClient<Database>, userId: string): Promise<UserSettings> {
  const { data, error } = await client.from('user_settings').select('*').eq('user_id', userId).single()

  if (error || !data) {
    throw new Error('Unable to fetch user settings')
  }

  return data as UserSettings
}

/**
 * Actualiza configuracion de usuario en user_settings.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param data Campos parciales a actualizar.
 * @returns Configuracion actualizada.
 */
export async function updateUserSettings(
  client: SupabaseClient<Database>,
  userId: string,
  data: Partial<UserSettings>,
): Promise<UserSettings> {
  const { user_id: _ignored, ...safeData } = data

  const { data: updated, error } = await client
    .from('user_settings')
    .update(safeData)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !updated) {
    throw new Error('Unable to update user settings')
  }

  return updated as UserSettings
}

/**
 * Actualiza el estado de validez de una API key en user_api_keys.
 * @param client Cliente Supabase server-side.
 * @param userId ID del usuario autenticado.
 * @param keyType Tipo de key a marcar.
 * @param isValid Resultado de verificacion.
 * @returns Promesa resuelta sin valor.
 */
export async function updateApiKeyValidity(
  client: SupabaseClient<Database>,
  userId: string,
  keyType: 'flash_free' | 'pro_paid',
  isValid: boolean,
): Promise<void> {
  const { error } = await client
    .from('user_api_keys')
    .update({
      is_valid: isValid,
      last_verified_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('key_type', keyType)

  if (error) {
    throw new Error('Unable to update API key validity')
  }
}
