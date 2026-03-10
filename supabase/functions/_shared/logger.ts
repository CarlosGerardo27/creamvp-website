// @ts-nocheck
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { CmsUserRole } from "./cms-blog-types.ts";

export type CmsApiLogEvent = {
  requestId: string;
  endpoint: string;
  method: string;
  action: string;
  userId: string;
  userRole: CmsUserRole;
  statusCode: number;
  requestMeta?: Record<string, unknown>;
  responseMeta?: Record<string, unknown>;
};

export async function logCmsApiEvent(serviceClient: SupabaseClient | null, event: CmsApiLogEvent): Promise<void> {
  if (!serviceClient) {
    return;
  }

  const { error } = await serviceClient.from("cms_api_request_log").insert({
    request_id: event.requestId,
    endpoint: event.endpoint,
    method: event.method,
    action: event.action,
    user_id: event.userId,
    user_role: event.userRole,
    status_code: event.statusCode,
    request_meta: event.requestMeta ?? {},
    response_meta: event.responseMeta ?? {},
  });

  if (error) {
    // Keep endpoint flow alive if audit table is missing/unavailable.
    console.warn("[cms-api] Could not persist request log:", error.message);
  }
}

