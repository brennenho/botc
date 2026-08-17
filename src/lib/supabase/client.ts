import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";

function createSupabaseBrowser() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

let supabase: ReturnType<typeof createSupabaseBrowser> | undefined;

export function getSupabaseBrowser() {
  supabase ??= createSupabaseBrowser();

  return supabase;
}
