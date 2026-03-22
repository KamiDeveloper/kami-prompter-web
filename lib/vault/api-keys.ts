import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, ModelKey, Tables } from '@/types'

type UserApiKey = Tables<'user_api_keys'>
type UserSettings = Tables<'user_settings'>

type KeyType = 'flash_free' | 'pro_paid'

/**
 * Guarda una API key en Supabase Vault y crea/actualiza su referencia en user_api_keys.
 * @param params Datos requeridos para persistir la key en vault y metadata en tabla publica.
 * @returns Resultado de exito o mensaje de error controlado.
 */
export async function storeApiKey(params: {
  userId: string
  keyType: KeyType
  apiKey: string
  serviceClient: SupabaseClient<Database>
}): Promise<{ success: boolean; error?: string }> {
  const { userId, keyType, apiKey, serviceClient } = params

  const secretName = `kami_${userId}_${keyType}`

  const { data: secretData, error: vaultError } = await serviceClient.rpc('vault.create_secret', {
    secret: apiKey,
    name: secretName,
    description: `Gemini API key for ${keyType}`,
  })

  if (vaultError || !secretData) {
    return { success: false, error: 'Unable to store API key' }
  }

  const vaultSecretId = String(secretData)

  const { error: upsertError } = await serviceClient.from('user_api_keys').upsert(
    {
      user_id: userId,
      key_type: keyType,
      vault_secret_id: vaultSecretId,
      is_valid: null,
      last_verified_at: null,
    },
    { onConflict: 'user_id,key_type' },
  )

  if (upsertError) {
    await serviceClient.rpc('vault.delete_secret', { secret_id: vaultSecretId })
    return { success: false, error: 'Unable to save key reference' }
  }

  return { success: true }
}

/**
 * Recupera una API key desde vault por usuario y tipo.
 * @param params Datos para resolver la referencia y leer el secreto real.
 * @returns API key en texto plano o null si no existe.
 */
export async function retrieveApiKey(params: {
  userId: string
  keyType: KeyType
  serviceClient: SupabaseClient<Database>
}): Promise<string | null> {
  const { userId, keyType, serviceClient } = params

  const { data: keyRef, error: keyRefError } = await serviceClient
    .from('user_api_keys')
    .select('vault_secret_id')
    .eq('user_id', userId)
    .eq('key_type', keyType)
    .maybeSingle()

  if (keyRefError || !keyRef?.vault_secret_id) {
    return null
  }

  const { data: secretData, error: secretError } = await serviceClient.rpc('vault.get_secret', {
    secret_id: keyRef.vault_secret_id,
  })

  if (secretError || !secretData) {
    return null
  }

  if (typeof secretData === 'string') {
    return secretData
  }

  if (Array.isArray(secretData) && secretData[0] && typeof secretData[0] === 'object') {
    const maybeSecret = secretData[0] as Record<string, unknown>
    if (typeof maybeSecret.secret === 'string') {
      return maybeSecret.secret
    }
  }

  return null
}

/**
 * Elimina una API key de vault y su referencia en user_api_keys.
 * @param params Datos para encontrar y eliminar la key asociada.
 * @returns Resultado de exito o error controlado.
 */
export async function deleteApiKey(params: {
  userId: string
  keyType: KeyType
  serviceClient: SupabaseClient<Database>
}): Promise<{ success: boolean; error?: string }> {
  const { userId, keyType, serviceClient } = params

  const { data: keyRef, error: keyRefError } = await serviceClient
    .from('user_api_keys')
    .select('id, vault_secret_id')
    .eq('user_id', userId)
    .eq('key_type', keyType)
    .maybeSingle()

  if (keyRefError) {
    return { success: false, error: 'Unable to locate API key record' }
  }

  if (!keyRef) {
    return { success: true }
  }

  const { error: vaultError } = await serviceClient.rpc('vault.delete_secret', {
    secret_id: keyRef.vault_secret_id,
  })

  if (vaultError) {
    return { success: false, error: 'Unable to delete secret from vault' }
  }

  const { error: deleteError } = await serviceClient.from('user_api_keys').delete().eq('id', keyRef.id)

  if (deleteError) {
    return { success: false, error: 'Unable to delete key reference' }
  }

  return { success: true }
}

/**
 * Verifica si existe metadata de API key para un usuario y tipo.
 * @param params Datos de usuario y tipo de key.
 * @returns true cuando la key esta configurada.
 */
export async function hasApiKey(params: {
  userId: string
  keyType: KeyType
  serviceClient: SupabaseClient<Database>
}): Promise<boolean> {
  const { userId, keyType, serviceClient } = params

  const { data, error } = await serviceClient
    .from('user_api_keys')
    .select('id')
    .eq('user_id', userId)
    .eq('key_type', keyType)
    .maybeSingle()

  return !error && Boolean(data?.id)
}

async function getUserSettings(client: SupabaseClient<Database>, userId: string): Promise<UserSettings | null> {
  const { data, error } = await client.from('user_settings').select('*').eq('user_id', userId).maybeSingle()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Resuelve que API key usar segun modelo y configuracion user_settings.
 * @param params Usuario, modelo y cliente de servicio para leer vault y settings.
 * @returns API key y tipo seleccionado, o null si no hay key utilizable.
 */
export async function resolveApiKey(params: {
  userId: string
  model: ModelKey
  serviceClient: SupabaseClient<Database>
}): Promise<{ apiKey: string; keyType: KeyType } | null> {
  const { userId, model, serviceClient } = params

  const settings = await getUserSettings(serviceClient, userId)
  const requestedType: KeyType = model === 'pro' ? 'pro_paid' : 'flash_free'
  const selectedType: KeyType = settings?.use_paid_key_for_all ? 'pro_paid' : requestedType

  const apiKey = await retrieveApiKey({
    userId,
    keyType: selectedType,
    serviceClient,
  })

  if (!apiKey) {
    return null
  }

  return {
    apiKey,
    keyType: selectedType,
  }
}
