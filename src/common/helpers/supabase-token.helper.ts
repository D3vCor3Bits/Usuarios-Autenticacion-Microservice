import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Crea un cliente Supabase temporal con el token de usuario.
 * Esto evita conflictos con el cliente global (service role).
 */
export async function withUserToken(
  supabase: SupabaseClient,
  token: string,
): Promise<SupabaseClient> {
  const url = (supabase as any).supabaseUrl;
  const key = (supabase as any).supabaseKey;

  const userClient = createClient(url, key);

  const { data, error } = await userClient.auth.setSession({
    access_token: token,
    refresh_token: token,
  });

  if (error || !data.session) {
    throw new Error('Token inválido o sesión expirada.');
  }

  return userClient;
}
