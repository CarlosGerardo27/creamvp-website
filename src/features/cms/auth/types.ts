export const CMS_ROLES = ["admin", "editor", "reviewer", "developer"] as const;

export type CmsRole = (typeof CMS_ROLES)[number];

export const DEFAULT_ALLOWED_CMS_ROLES: CmsRole[] = [...CMS_ROLES];

export interface CmsProfile {
  role: CmsRole;
  is_active: boolean;
  full_name: string | null;
  avatar_url: string | null;
}

export function isCmsRole(value: unknown): value is CmsRole {
  return typeof value === "string" && CMS_ROLES.includes(value as CmsRole);
}

