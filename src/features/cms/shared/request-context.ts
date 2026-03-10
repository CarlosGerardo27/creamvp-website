import type { SupabaseClient } from "@supabase/supabase-js";
import { createCmsSupabaseBrowserClient } from "@/features/cms/auth/supabase-browser";

export type CmsRequestContext = {
  supabase: SupabaseClient;
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  userId: string;
};

function readPublicSupabaseConfig(): { supabaseUrl: string; anonKey: string } {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!supabaseUrl || !anonKey) {
    throw new Error("Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY.");
  }

  return { supabaseUrl, anonKey };
}

export async function getCmsRequestContext(): Promise<CmsRequestContext> {
  const supabase = createCmsSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("No se pudo inicializar cliente Supabase en navegador.");
  }

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.access_token) {
    throw new Error("Sesion CMS no disponible. Inicia sesion de nuevo.");
  }

  const { supabaseUrl, anonKey } = readPublicSupabaseConfig();
  return {
    supabase,
    supabaseUrl,
    anonKey,
    accessToken: session.access_token,
    userId: session.user.id,
  };
}

export function resolveFunctionsBaseUrl(supabaseUrl: string): string {
  const parsed = new URL(supabaseUrl);
  const hostChunks = parsed.host.split(".");
  const projectRef = hostChunks[0];
  if (!projectRef) {
    throw new Error("No se pudo derivar project ref desde SUPABASE_URL.");
  }
  return `https://${projectRef}.functions.supabase.co`;
}
