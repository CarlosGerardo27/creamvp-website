import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

let clientCache: SupabaseClient | null | undefined;

function readPublicConfig(): PublicSupabaseConfig | null {
  const url = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function createCmsSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (clientCache !== undefined) {
    return clientCache;
  }

  const config = readPublicConfig();
  if (!config) {
    clientCache = null;
    return clientCache;
  }

  clientCache = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return clientCache;
}

