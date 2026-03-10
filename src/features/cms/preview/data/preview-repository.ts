import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const EDITORIAL_ROLES = new Set(["admin", "editor", "reviewer", "developer"]);

export type CmsServerPreviewEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  previewTokenSecret: string;
};

export type AuthenticatedCmsUser = {
  userId: string;
  role: string;
};

export type PreviewPostRecord = {
  id: string;
  status: "draft" | "scheduled" | "published";
  slug: string;
  category_slug: string;
  h1: string | null;
  meta_description: string | null;
  short_description: string | null;
  canonical_url: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  content_markdown: string | null;
  publish_date: string | null;
  scheduled_publish_at: string | null;
  updated_at: string;
  author_id: string | null;
};

export type PreviewFaqRecord = {
  position: number;
  question: string;
  answer: string;
};

export function readCmsServerPreviewEnv(): CmsServerPreviewEnv {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const previewTokenSecret = import.meta.env.CMS_PREVIEW_TOKEN_SECRET?.trim() ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY.");
  }
  if (!supabaseServiceRoleKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para preview server-side.");
  }
  if (!previewTokenSecret) {
    throw new Error("Falta CMS_PREVIEW_TOKEN_SECRET para emitir/verificar preview tokens.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    previewTokenSecret,
  };
}

function createServiceClient(env: CmsServerPreviewEnv): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function createUserClient(env: CmsServerPreviewEnv, authorizationHeader: string): SupabaseClient {
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

function extractBearerToken(authorizationHeader: string | null): string {
  if (!authorizationHeader) {
    throw new Error("Header Authorization requerido.");
  }
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) {
    throw new Error("Authorization debe usar formato Bearer <token>.");
  }
  return token.trim();
}

export async function requireAuthenticatedCmsUser(
  authorizationHeader: string | null,
): Promise<AuthenticatedCmsUser> {
  const env = readCmsServerPreviewEnv();
  const token = extractBearerToken(authorizationHeader);
  const userClient = createUserClient(env, `Bearer ${token}`);

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    throw new Error("Token de usuario invalido o expirado.");
  }

  const { data: profileData, error: profileError } = await userClient
    .from("profiles")
    .select("role, is_active")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    throw new Error("No se pudo validar perfil editorial.");
  }

  if (!profileData.is_active || !EDITORIAL_ROLES.has(String(profileData.role))) {
    throw new Error("Usuario sin permisos editoriales activos.");
  }

  return {
    userId: userData.user.id,
    role: String(profileData.role),
  };
}

export async function getPreviewPostById(postId: string): Promise<{
  post: PreviewPostRecord;
  faqs: PreviewFaqRecord[];
} | null> {
  const env = readCmsServerPreviewEnv();
  const serviceClient = createServiceClient(env);

  const { data: postData, error: postError } = await serviceClient
    .from("blog_posts")
    .select(
      "id,status,slug,category_slug,h1,meta_description,short_description,canonical_url,featured_image_url,featured_image_alt,content_markdown,publish_date,scheduled_publish_at,updated_at,author_id",
    )
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    throw new Error(`No se pudo cargar post preview: ${postError.message}`);
  }
  if (!postData) {
    return null;
  }

  const { data: faqsData, error: faqsError } = await serviceClient
    .from("blog_faqs")
    .select("position,question,answer")
    .eq("blog_post_id", postId)
    .order("position", { ascending: true });

  if (faqsError) {
    throw new Error(`No se pudieron cargar FAQs preview: ${faqsError.message}`);
  }

  return {
    post: postData as PreviewPostRecord,
    faqs: (faqsData ?? []) as PreviewFaqRecord[],
  };
}
