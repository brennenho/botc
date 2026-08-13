import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export function getSupabaseAdmin() {
  return supabaseAdmin;
}
