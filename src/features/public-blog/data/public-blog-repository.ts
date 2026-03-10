import { getCollection } from "astro:content";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PublicBlogCategory, PublicBlogFaq, PublicBlogPost, PublicBlogTag } from "../domain/types";
import {
  buildCanonicalUrl,
  buildPublicAuthor,
  normalizeTagRelation,
  type CmsAuthorRelationRow,
  type CmsTagRelationValue,
} from "./public-blog-mappers";

type CmsPostRow = {
  id: string;
  slug: string;
  category_slug: string;
  h1: string | null;
  short_description: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  publish_date: string | null;
  updated_at: string | null;
  canonical_url: string | null;
  content_markdown: string | null;
  authors: CmsAuthorRelationRow | CmsAuthorRelationRow[] | null;
  categories: { name: string | null; slug: string | null } | { name: string | null; slug: string | null }[] | null;
};

type CmsTagRelationRow = {
  blog_post_id: string;
  tags: CmsTagRelationValue;
};

type CmsFaqRow = {
  blog_post_id: string;
  position: number | null;
  question: string | null;
  answer: string | null;
};

let cachedPostsPromise: Promise<PublicBlogPost[]> | null = null;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseDate(value: string | null | undefined, fallback: string | null | undefined): Date {
  const parsed = new Date(value ?? fallback ?? Date.now());
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function readSupabasePublicConfig(): { supabaseUrl: string; supabaseAnonKey: string } | null {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return { supabaseUrl, supabaseAnonKey };
}

function createSupabasePublicClient(): SupabaseClient | null {
  const config = readSupabasePublicConfig();
  if (!config) {
    return null;
  }

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function asRelationObject<T extends Record<string, unknown>>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return value;
}

async function listCmsPublishedPosts(): Promise<PublicBlogPost[]> {
  const client = createSupabasePublicClient();
  if (!client) {
    return [];
  }

  try {
    const { data: postRows, error: postsError } = await client
      .from("blog_posts")
      .select(
        "id,slug,category_slug,h1,short_description,meta_description,featured_image_url,featured_image_alt,publish_date,updated_at,canonical_url,content_markdown,authors(name,bio,photo_url,facebook_url,instagram_url,x_url,tiktok_url,linkedin_url,personal_url),categories(name,slug)",
      )
      .eq("status", "published")
      .order("publish_date", { ascending: false });

    if (postsError) {
      console.warn(`[public-blog] No se pudieron cargar posts CMS publicados: ${postsError.message}`);
      return [];
    }

    const posts = (postRows ?? []) as CmsPostRow[];
    if (!posts.length) {
      return [];
    }

    const postIds = posts.map((post) => post.id);
    const [tagsResult, faqsResult] = await Promise.all([
      client.from("blog_post_tags").select("blog_post_id,tags(name,slug)").in("blog_post_id", postIds),
      client
        .from("blog_faqs")
        .select("blog_post_id,position,question,answer")
        .in("blog_post_id", postIds)
        .order("position", { ascending: true }),
    ]);

    if (tagsResult.error) {
      console.warn(`[public-blog] No se pudieron cargar tags CMS publicados: ${tagsResult.error.message}`);
    }
    if (faqsResult.error) {
      console.warn(`[public-blog] No se pudieron cargar FAQs CMS publicados: ${faqsResult.error.message}`);
    }

    const tagsByPost = new Map<string, PublicBlogTag[]>();
    for (const row of (tagsResult.data ?? []) as CmsTagRelationRow[]) {
      const rowTags = normalizeTagRelation(row.tags);
      if (!rowTags.length) {
        continue;
      }
      const existing = tagsByPost.get(row.blog_post_id) ?? [];
      existing.push(...rowTags);
      tagsByPost.set(row.blog_post_id, existing);
    }

    const faqsByPost = new Map<string, PublicBlogFaq[]>();
    for (const row of (faqsResult.data ?? []) as CmsFaqRow[]) {
      const question = String(row.question ?? "").trim();
      const answer = String(row.answer ?? "").trim();
      if (!question || !answer) {
        continue;
      }
      const existing = faqsByPost.get(row.blog_post_id) ?? [];
      existing.push({
        question,
        answer,
        position: Number(row.position ?? 0),
      });
      faqsByPost.set(row.blog_post_id, existing);
    }

    return posts.map((post) => {
      const authorRelation = asRelationObject(post.authors);
      const categoryRelation = asRelationObject(post.categories);
      const categorySlug = String(post.category_slug ?? "").trim();
      const title = String(post.h1 ?? "").trim() || post.slug;
      const snippet = String(post.short_description ?? post.meta_description ?? "").trim();
      const imageSrc = String(post.featured_image_url ?? "").trim() || "/opengraph.png";
      const imageAlt = String(post.featured_image_alt ?? "").trim() || title;
      const publishDate = parseDate(post.publish_date, post.updated_at);
      const updatedAt = post.updated_at ? parseDate(post.updated_at, null) : null;
      const tags = (tagsByPost.get(post.id) ?? [])
        .filter((tag) => tag.name && tag.slug)
        .filter((tag, index, self) => self.findIndex((item) => item.slug === tag.slug) === index);
      const faqs = (faqsByPost.get(post.id) ?? []).sort((a, b) => a.position - b.position);
      const author = buildPublicAuthor(authorRelation);

      return {
        source: "cms",
        slug: post.slug,
        categorySlug,
        categoryName: String(categoryRelation?.name ?? "").trim() || humanizeSlug(categorySlug),
        title,
        snippet,
        authorName: author.name,
        author,
        publishDate,
        updatedAt,
        imageSrc,
        imageAlt,
        contentMarkdown: String(post.content_markdown ?? "").trim(),
        canonicalUrl:
          String(post.canonical_url ?? "").trim() || buildCanonicalUrl(categorySlug, post.slug),
        tags,
        faqs,
      } satisfies PublicBlogPost;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.warn(`[public-blog] Error al consultar CMS publicado: ${message}`);
    return [];
  }
}

async function listMarkdownPublishedPosts(): Promise<PublicBlogPost[]> {
  const entries = await getCollection("blog", ({ data }) => !data.draft && data.publishDate < new Date());

  return entries.map((entry) => {
    const categoryName = String(entry.data.category ?? "").trim() || "Blog";
    const categorySlug = slugify(categoryName) || "general";
    const title = String(entry.data.title ?? "").trim() || entry.slug;
    const snippet = String(entry.data.snippet ?? "").trim();
    const authorName = String(entry.data.author ?? "").trim() || "CreaMVP";
    const imageSrc = String(entry.data.image?.src ?? "").trim() || "/opengraph.png";
    const imageAlt = String(entry.data.image?.alt ?? "").trim() || title;
    const tags = (entry.data.tags ?? []).map((tag) => ({
      name: String(tag).trim(),
      slug: slugify(String(tag)),
    }));
    const faqs = (entry.data.faqs ?? []).map((faq, index) => ({
      question: String(faq.question ?? "").trim(),
      answer: String(faq.answer ?? "").trim(),
      position: index,
    }));

    return {
      source: "markdown",
      slug: entry.slug,
      categorySlug,
      categoryName,
      title,
      snippet,
      authorName,
      author: {
        name: authorName,
        bio: null,
        photoUrl: null,
        socialLinks: {
          facebookUrl: null,
          instagramUrl: null,
          xUrl: null,
          tiktokUrl: null,
          linkedinUrl: null,
          personalUrl: null,
        },
      },
      publishDate: entry.data.publishDate,
      updatedAt: entry.data.publishDate,
      imageSrc,
      imageAlt,
      contentMarkdown: String(entry.body ?? "").trim(),
      canonicalUrl: buildCanonicalUrl(categorySlug, entry.slug),
      tags,
      faqs,
    } satisfies PublicBlogPost;
  });
}

async function loadUnifiedPublishedPosts(): Promise<PublicBlogPost[]> {
  const [markdownPosts, cmsPosts] = await Promise.all([
    listMarkdownPublishedPosts(),
    listCmsPublishedPosts(),
  ]);

  const byCanonicalKey = new Map<string, PublicBlogPost>();

  for (const post of markdownPosts) {
    const key = `${post.categorySlug}::${post.slug}`;
    byCanonicalKey.set(key, post);
  }

  for (const post of cmsPosts) {
    const key = `${post.categorySlug}::${post.slug}`;
    byCanonicalKey.set(key, post);
  }

  return Array.from(byCanonicalKey.values()).sort(
    (a, b) => b.publishDate.getTime() - a.publishDate.getTime(),
  );
}

export async function listPublishedBlogPosts(): Promise<PublicBlogPost[]> {
  if (!cachedPostsPromise) {
    cachedPostsPromise = loadUnifiedPublishedPosts();
  }
  return cachedPostsPromise;
}

export async function listPublishedBlogCategories(): Promise<PublicBlogCategory[]> {
  const posts = await listPublishedBlogPosts();
  const grouped = new Map<string, PublicBlogCategory>();

  for (const post of posts) {
    const existing = grouped.get(post.categorySlug);
    if (existing) {
      existing.postsCount += 1;
      continue;
    }

    grouped.set(post.categorySlug, {
      slug: post.categorySlug,
      name: post.categoryName,
      postsCount: 1,
    });
  }

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function listPublishedBlogPostsByCategory(categorySlug: string): Promise<PublicBlogPost[]> {
  const normalizedCategory = categorySlug.trim().toLowerCase();
  const posts = await listPublishedBlogPosts();
  return posts.filter((post) => post.categorySlug === normalizedCategory);
}

export async function getPublishedBlogPostByPath(
  categorySlug: string,
  slug: string,
): Promise<PublicBlogPost | null> {
  const normalizedCategory = categorySlug.trim().toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedCategory || !normalizedSlug) {
    return null;
  }

  const posts = await listPublishedBlogPosts();
  return (
    posts.find(
      (post) => post.categorySlug === normalizedCategory && post.slug === normalizedSlug,
    ) ?? null
  );
}

export async function resolveLegacyBlogSlug(slug: string): Promise<PublicBlogPost | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return null;
  }

  const posts = await listPublishedBlogPosts();
  const matches = posts.filter((post) => post.slug === normalizedSlug);
  if (!matches.length) {
    return null;
  }

  matches.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  return matches[0] ?? null;
}
