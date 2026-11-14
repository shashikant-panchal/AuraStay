import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
                    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
                    'https://pdsfctfixxfazchamznm.supabase.co';

export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
                       import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                       'sb_publishable_qbJiyQ6eiAtwvQA17pG9cg_8bHn3uWi';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

