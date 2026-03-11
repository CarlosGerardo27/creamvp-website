import { getCmsRequestContext } from "@/features/cms/shared/request-context";
import type { CmsAuthorRow, CmsCategoryRow, CmsTagRow } from "../domain/types";

export async function listCategories(): Promise<CmsCategoryRow[]> {
  const context = await getCmsRequestContext();
  const { data, error } = await context.supabase
    .from("categories")
    .select("id,name,slug,is_active,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar categorias: ${error.message}`);
  }
  return (data ?? []) as CmsCategoryRow[];
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description?: string;
}): Promise<void> {
  const context = await getCmsRequestContext();
  const { error } = await context.supabase.from("categories").insert({
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    seo: {},
    created_by: context.userId,
    updated_by: context.userId,
  });

  if (error) {
    throw new Error(`No se pudo crear categoria: ${error.message}`);
  }
}

export async function toggleCategoryActive(categoryId: string, active: boolean): Promise<void> {
  const context = await getCmsRequestContext();
  const { error } = await context.supabase
    .from("categories")
    .update({
      is_active: active,
      updated_by: context.userId,
    })
    .eq("id", categoryId);

  if (error) {
    throw new Error(`No se pudo actualizar categoria: ${error.message}`);
  }
}

export async function listTags(): Promise<CmsTagRow[]> {
  const context = await getCmsRequestContext();
  const { data, error } = await context.supabase
    .from("tags")
    .select("id,name,slug,is_active,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar tags: ${error.message}`);
  }
  return (data ?? []) as CmsTagRow[];
}

export async function createTag(input: { name: string; slug: string; description?: string }): Promise<void> {
  const context = await getCmsRequestContext();
  const { error } = await context.supabase.from("tags").insert({
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    seo: {},
    created_by: context.userId,
    updated_by: context.userId,
  });

  if (error) {
    throw new Error(`No se pudo crear tag: ${error.message}`);
  }
}

export async function toggleTagActive(tagId: string, active: boolean): Promise<void> {
  const context = await getCmsRequestContext();
  const { error } = await context.supabase
    .from("tags")
    .update({
      is_active: active,
      updated_by: context.userId,
    })
    .eq("id", tagId);

  if (error) {
    throw new Error(`No se pudo actualizar tag: ${error.message}`);
  }
}

export async function listAuthors(): Promise<CmsAuthorRow[]> {
  const context = await getCmsRequestContext();
  const { data, error } = await context.supabase
    .from("authors")
    .select(
      "id,name,slug,bio,photo_url,facebook_url,instagram_url,x_url,tiktok_url,linkedin_url,personal_url,is_active,updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar autores: ${error.message}`);
  }
  return (data ?? []) as CmsAuthorRow[];
}

export async function getAuthorById(authorId: string): Promise<CmsAuthorRow | null> {
  const context = await getCmsRequestContext();
  const { data, error } = await context.supabase
    .from("authors")
    .select(
      "id,name,slug,bio,photo_url,facebook_url,instagram_url,x_url,tiktok_url,linkedin_url,personal_url,is_active,updated_at",
    )
    .eq("id", authorId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar autor: ${error.message}`);
  }
  return (data as CmsAuthorRow | null) ?? null;
}

export async function createAuthor(input: {
  name: string;
  slug: string;
  photoUrl: string;
  bio?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  personalUrl?: string;
}): Promise<void> {
  const context = await getCmsRequestContext();
  const { error } = await context.supabase.from("authors").insert({
    name: input.name,
    slug: input.slug,
    bio: input.bio ?? null,
    photo_url: input.photoUrl,
    facebook_url: input.facebookUrl ?? null,
    instagram_url: input.instagramUrl ?? null,
    x_url: input.xUrl ?? null,
    tiktok_url: input.tiktokUrl ?? null,
    linkedin_url: input.linkedinUrl ?? null,
    personal_url: input.personalUrl ?? null,
    created_by: context.userId,
    updated_by: context.userId,
  });

  if (error) {
    throw new Error(`No se pudo crear autor: ${error.message}`);
  }
}

export async function toggleAuthorActive(authorId: string, active: boolean): Promise<void> {
  const context = await getCmsRequestContext();
  const { error } = await context.supabase
    .from("authors")
    .update({
      is_active: active,
      updated_by: context.userId,
    })
    .eq("id", authorId);

  if (error) {
    throw new Error(`No se pudo actualizar autor: ${error.message}`);
  }
}

export async function updateAuthor(
  authorId: string,
  input: {
    name: string;
    slug: string;
    photoUrl: string;
    bio?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    xUrl?: string;
    tiktokUrl?: string;
    linkedinUrl?: string;
    personalUrl?: string;
  },
): Promise<void> {
  const context = await getCmsRequestContext();
  const { error } = await context.supabase
    .from("authors")
    .update({
      name: input.name,
      slug: input.slug,
      photo_url: input.photoUrl,
      bio: input.bio ?? null,
      facebook_url: input.facebookUrl ?? null,
      instagram_url: input.instagramUrl ?? null,
      x_url: input.xUrl ?? null,
      tiktok_url: input.tiktokUrl ?? null,
      linkedin_url: input.linkedinUrl ?? null,
      personal_url: input.personalUrl ?? null,
      updated_by: context.userId,
    })
    .eq("id", authorId);

  if (error) {
    throw new Error(`No se pudo actualizar autor: ${error.message}`);
  }
}

export async function deleteAuthor(authorId: string): Promise<void> {
  const context = await getCmsRequestContext();
  const { error } = await context.supabase.from("authors").delete().eq("id", authorId);

  if (error) {
    throw new Error(`No se pudo eliminar autor: ${error.message}`);
  }
}
