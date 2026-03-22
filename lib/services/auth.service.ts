import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

import type { Database } from '@/types'

/**
 * Error de autenticacion para flujo de Route Handlers.
 */
export class AuthError extends Error {
  /**
   * Crea una instancia de AuthError.
   * @param message Mensaje de error para auditoria interna.
   * @returns Instancia de error autenticacion.
   */
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Obtiene la sesion autenticada del servidor.
 * @param client Cliente Supabase server-side.
 * @returns Sesion actual o null cuando no existe.
 */
export async function getServerSession(client: SupabaseClient<Database>): Promise<Session | null> {
  const { data, error } = await client.auth.getSession()

  if (error || !data.session) {
    return null
  }

  return data.session
}

/**
 * Obtiene el usuario autenticado o lanza AuthError.
 * @param client Cliente Supabase server-side.
 * @returns Usuario autenticado valido.
 */
export async function requireAuth(client: SupabaseClient<Database>): Promise<User> {
  const { data, error } = await client.auth.getUser()

  if (error || !data.user) {
    throw new AuthError()
  }

  return data.user
}
