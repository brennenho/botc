import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";

function createSupabaseAdmin() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let supabaseAdmin: ReturnType<typeof createSupabaseAdmin> | undefined;

export function getSupabaseAdmin() {
  supabaseAdmin ??= createSupabaseAdmin();

  return supabaseAdmin;
}
