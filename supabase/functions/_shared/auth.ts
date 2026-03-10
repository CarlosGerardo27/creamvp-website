// @ts-nocheck
import type { SupabaseClient, User } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./errors.ts";
import { CMS_USER_ROLES, type CmsProfile, type CmsUserRole } from "./cms-blog-types.ts";
import { createServiceClientOrNull, createUserClient, requireBearerToken } from "./supabase-clients.ts";

export type AuthContext = {
  user: User;
  profile: CmsProfile;
  userClient: SupabaseClient;
  serviceClient: SupabaseClient | null;
  requestId: string;
};

function isCmsUserRole(value: unknown): value is CmsUserRole {
  return typeof value === "string" && CMS_USER_ROLES.includes(value as CmsUserRole);
}

export async function requireAuthContext(request: Request, requestId: string): Promise<AuthContext> {
  const token = requireBearerToken(request);
  const authorizationHeader = `Bearer ${token}`;
  const userClient = createUserClient(authorizationHeader);
  const serviceClient = createServiceClientOrNull();

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    throw new HttpError(401, "INVALID_TOKEN", "Invalid or expired auth token.", userError?.message);
  }

  const { data: profileData, error: profileError } = await userClient
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(403, "PROFILE_READ_FAILED", "Could not load profile for authenticated user.", profileError.message);
  }

  if (!profileData || !isCmsUserRole(profileData.role) || !profileData.is_active) {
    throw new HttpError(403, "EDITORIAL_ACCESS_DENIED", "User does not have an active editorial profile.");
  }

  return {
    user: userData.user,
    profile: {
      id: profileData.id,
      role: profileData.role,
      is_active: Boolean(profileData.is_active),
    },
    userClient,
    serviceClient,
    requestId,
  };
}

export function assertAllowedRole(role: CmsUserRole, allowedRoles: CmsUserRole[]): void {
  if (!allowedRoles.includes(role)) {
    throw new HttpError(
      403,
      "INSUFFICIENT_ROLE",
      `Role '${role}' does not have permission for this operation.`,
      { allowedRoles },
    );
  }
}

