// @ts-nocheck
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./errors.ts";
import { readSupabaseFunctionEnv } from "./env.ts";

export function createUserClient(authorizationHeader: string): SupabaseClient {
  const env = readSupabaseFunctionEnv();
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorizationHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createServiceClientOrNull(): SupabaseClient | null {
  const env = readSupabaseFunctionEnv();
  if (!env.supabaseServiceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function requireBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!authorization) {
    throw new HttpError(401, "MISSING_AUTHORIZATION", "Authorization header is required.");
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new HttpError(401, "INVALID_AUTHORIZATION", "Authorization must use Bearer token.");
  }

  return token.trim();
}

