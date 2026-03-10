import { createCmsSupabaseBrowserClient } from "./supabase-browser";
import { isCmsRole, type CmsRole } from "./types";

export type CmsGuardConfig = {
  requireAuth?: boolean;
  allowedRoles?: CmsRole[];
  loginPath?: string;
  forbiddenPath?: string;
};

const DEFAULT_LOGIN_PATH = "/cms/login";
const DEFAULT_FORBIDDEN_PATH = "/cms/forbidden";

function redirectTo(path: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname + window.location.search === path) {
    return;
  }

  window.location.href = path;
}

function buildLoginPath(loginPath: string): string {
  if (typeof window === "undefined") {
    return loginPath;
  }

  const next = encodeURIComponent(window.location.pathname + window.location.search);
  return `${loginPath}?next=${next}`;
}

export async function enforceCmsAccess(config: CmsGuardConfig = {}): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const requireAuth = config.requireAuth ?? true;
  const allowedRoles = config.allowedRoles ?? ["admin", "editor", "reviewer", "developer"];
  const loginPath = config.loginPath ?? DEFAULT_LOGIN_PATH;
  const forbiddenPath = config.forbiddenPath ?? DEFAULT_FORBIDDEN_PATH;

  const supabase = createCmsSupabaseBrowserClient();
  if (!supabase) {
    if (requireAuth) {
      redirectTo(`${loginPath}?error=missing_supabase_env`);
    }
    return;
  }

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session) {
    if (requireAuth) {
      redirectTo(buildLoginPath(loginPath));
    }
    return;
  }

  if (!requireAuth) {
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  const hasValidRole = Boolean(profile?.role && isCmsRole(profile.role));
  const resolvedRole = hasValidRole ? (profile?.role as CmsRole) : null;
  let hasPermission = false;
  if (resolvedRole && profile?.is_active) {
    hasPermission = allowedRoles.includes(resolvedRole as CmsRole);
  }

  if (error || !hasPermission) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    redirectTo(`${forbiddenPath}?next=${next}`);
  }
}
