import { createClient, SupabaseClient } from '@supabase/supabase-js';


export const SupabaseProvider = {
  provide: 'SUPABASE_CLIENT',
  useFactory: (): SupabaseClient => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan SUPABASE_URL o SUPABASE_KEY en el archivo .env' + supabaseKey + supabaseUrl);
    }

    return createClient(supabaseUrl, supabaseKey);
  },
};
