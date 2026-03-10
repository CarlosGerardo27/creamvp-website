import type { Session } from "@supabase/supabase-js";
import { createCmsSupabaseBrowserClient } from "./supabase-browser";
import { isCmsRole, type CmsProfile } from "./types";

export async function getCurrentCmsSession(): Promise<Session | null> {
  const supabase = createCmsSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function fetchCurrentCmsProfile(): Promise<CmsProfile | null> {
  const supabase = createCmsSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const session = await getCurrentCmsSession();
  if (!session) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, is_active, full_name, avatar_url")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !data || !isCmsRole(data.role)) {
    return null;
  }

  return {
    role: data.role,
    is_active: Boolean(data.is_active),
    full_name: data.full_name,
    avatar_url: data.avatar_url,
  };
}

export async function signOutCmsSession(): Promise<void> {
  const supabase = createCmsSupabaseBrowserClient();
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}

