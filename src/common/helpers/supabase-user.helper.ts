import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RpcException } from '@nestjs/microservices';

export function createUserSupabaseClient(token: string): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_KEY;

  if (!token) {
    throw new RpcException('Token no proporcionado');
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new RpcException('Faltan variables de entorno de Supabase');
  }

  try {
    // Cliente autenticado con el token del usuario
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
  } catch (error) {
    throw new RpcException('Error creando cliente Supabase: ' + error.message);
  }
}
