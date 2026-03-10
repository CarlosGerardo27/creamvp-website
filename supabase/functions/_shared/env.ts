// @ts-nocheck
import { HttpError } from "./errors.ts";

export type SupabaseFunctionEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string | null;
};

let envCache: SupabaseFunctionEnv | null = null;

export function readSupabaseFunctionEnv(): SupabaseFunctionEnv {
  if (envCache) {
    return envCache;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim() ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new HttpError(
      500,
      "MISSING_SUPABASE_ENV",
      "Missing required Supabase environment variables (SUPABASE_URL/SUPABASE_ANON_KEY).",
    );
  }

  envCache = {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey: supabaseServiceRoleKey || null,
  };

  return envCache;
}

