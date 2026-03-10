// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./errors.ts";

export type RateLimitConfig = {
  endpoint: string;
  userId: string;
  maxRequests: number;
  windowSeconds: number;
};

export async function enforceRateLimit(
  serviceClient: SupabaseClient | null,
  config: RateLimitConfig,
): Promise<void> {
  if (!serviceClient) {
    return;
  }

  const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

  const { count, error } = await serviceClient
    .from("cms_api_request_log")
    .select("id", { head: true, count: "exact" })
    .eq("endpoint", config.endpoint)
    .eq("user_id", config.userId)
    .gte("created_at", windowStart);

  if (error) {
    // If migration is not applied yet, avoid blocking core editorial flow.
    if (error.code === "42P01") {
      console.warn("[cms-api] rate limit table missing, skipping rate check");
      return;
    }

    throw new HttpError(500, "RATE_LIMIT_CHECK_FAILED", "Could not validate API rate limit.", error.message);
  }

  if ((count ?? 0) >= config.maxRequests) {
    throw new HttpError(429, "RATE_LIMIT_EXCEEDED", "Too many requests. Please retry later.", {
      endpoint: config.endpoint,
      maxRequests: config.maxRequests,
      windowSeconds: config.windowSeconds,
    });
  }
}

