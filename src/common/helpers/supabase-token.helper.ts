import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Inyecta temporalmente un token de acceso en un cliente Supabase.
 * Esto permite ejecutar consultas con las políticas RLS (Row Level Security)
 * aplicadas a ese usuario.
 */

export async function withUserToken(
  supabase: SupabaseClient,
  token: string,
): Promise<SupabaseClient> {
  // Establece la sesión temporalmente para ese token
  await supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  });

  return supabase;
}
