import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Crea (o reutiliza) el cliente Supabase para el entorno de navegador.
 * @param none No requiere parametros.
 * @returns Instancia singleton del cliente de Supabase para browser.
 */
export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return browserClient
}
