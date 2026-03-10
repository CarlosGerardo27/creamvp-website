#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import {
  parseMarkdownBlogDocument,
  renderInventoryMarkdown,
  toCmsMigrationPost,
} from "../src/features/cms/migration/domain/markdown-blog-migration.mjs";

function printHelp() {
  console.log(`
Uso:
  node scripts/migrate-markdown-blog-to-cms.mjs [opciones]

Opciones:
  --apply                    Ejecuta escrituras reales en Supabase (default: dry-run)
  --all-draft                Fuerza que todas las entradas migradas queden en draft
  --source <dir>             Directorio origen markdown (default: src/content/blog)
  --env-file <path>          Archivo .env a leer (default: .env)
  --inventory <path>         Archivo markdown para inventario (default: docs/roadmap/blog-markdown-inventory.md)
  --email <email>            Email editorial para auth (requerido en --apply)
  --password <password>      Password editorial para auth (requerido en --apply)
  --help                     Muestra ayuda
`);
}

function parseArgs(argv) {
  const args = {
    apply: false,
    allDraft: false,
    source: "src/content/blog",
    envFile: ".env",
    inventory: "docs/roadmap/blog-markdown-inventory.md",
    email: "",
    password: "",
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--apply") {
      args.apply = true;
      continue;
    }
    if (token === "--all-draft") {
      args.allDraft = true;
      continue;
    }
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    const next = argv[index + 1] ?? "";
    if (token === "--source") {
      args.source = next;
      index += 1;
      continue;
    }
    if (token === "--env-file") {
      args.envFile = next;
      index += 1;
      continue;
    }
    if (token === "--inventory") {
      args.inventory = next;
      index += 1;
      continue;
    }
    if (token === "--email") {
      args.email = next;
      index += 1;
      continue;
    }
    if (token === "--password") {
      args.password = next;
      index += 1;
      continue;
    }

    throw new Error(`Argumento no reconocido: ${token}`);
  }

  return args;
}

async function readEnvFileMap(envFilePath) {
  const map = {};
  let raw = "";
  try {
    raw = await fs.readFile(envFilePath, "utf8");
  } catch {
    return map;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [rawKey, ...rawValueParts] = trimmed.split("=");
    const key = rawKey.replace(/^\uFEFF/, "").trim();
    const value = rawValueParts.join("=").trim();
    if (!key) {
      continue;
    }
    map[key] = value;
  }

  return map;
}

function resolveConfig(args, envMap) {
  const supabaseUrl = (process.env.PUBLIC_SUPABASE_URL ?? envMap.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey =
    (process.env.PUBLIC_SUPABASE_ANON_KEY ?? envMap.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  return {
    supabaseUrl,
    supabaseAnonKey,
    email: (args.email || process.env.CMS_MIGRATION_EMAIL || "").trim(),
    password: (args.password || process.env.CMS_MIGRATION_PASSWORD || "").trim(),
  };
}

async function listMarkdownFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b, "es"));
}

function avatarUrl(authorName) {
  const encoded = encodeURIComponent(authorName);
  return `https://ui-avatars.com/api/?name=${encoded}&background=507BFA&color=ffffff&size=256`;
}

async function ensureCategory(client, userId, categoryName, categorySlug) {
  const existingRes = await client
    .from("categories")
    .select("id,name,is_active")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (existingRes.error) {
    throw new Error(`Error consultando category '${categorySlug}': ${existingRes.error.message}`);
  }

  if (existingRes.data?.id) {
    const updates = {};
    if (!existingRes.data.is_active) {
      updates.is_active = true;
    }
    if (String(existingRes.data.name ?? "").trim() !== categoryName) {
      updates.name = categoryName;
    }
    if (Object.keys(updates).length > 0) {
      const updateRes = await client
        .from("categories")
        .update({ ...updates, updated_by: userId })
        .eq("id", existingRes.data.id);
      if (updateRes.error) {
        throw new Error(`No se pudo actualizar category '${categorySlug}': ${updateRes.error.message}`);
      }
    }

    return { id: existingRes.data.id, created: false };
  }

  const insertRes = await client
    .from("categories")
    .insert({
      name: categoryName,
      slug: categorySlug,
      description: null,
      seo: {},
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (insertRes.error || !insertRes.data?.id) {
    throw new Error(`No se pudo crear category '${categorySlug}': ${insertRes.error?.message ?? "sin id"}`);
  }

  return { id: insertRes.data.id, created: true };
}

async function ensureAuthor(client, userId, authorName, authorSlug) {
  const existingRes = await client
    .from("authors")
    .select("id,name,is_active,photo_url")
    .eq("slug", authorSlug)
    .maybeSingle();

  if (existingRes.error) {
    throw new Error(`Error consultando author '${authorSlug}': ${existingRes.error.message}`);
  }

  if (existingRes.data?.id) {
    const updates = {};
    if (!existingRes.data.is_active) {
      updates.is_active = true;
    }
    if (String(existingRes.data.name ?? "").trim() !== authorName) {
      updates.name = authorName;
    }
    if (!String(existingRes.data.photo_url ?? "").trim()) {
      updates.photo_url = avatarUrl(authorName);
    }

    if (Object.keys(updates).length > 0) {
      const updateRes = await client
        .from("authors")
        .update({ ...updates, updated_by: userId })
        .eq("id", existingRes.data.id);
      if (updateRes.error) {
        throw new Error(`No se pudo actualizar author '${authorSlug}': ${updateRes.error.message}`);
      }
    }

    return { id: existingRes.data.id, created: false };
  }

  const insertRes = await client
    .from("authors")
    .insert({
      name: authorName,
      slug: authorSlug,
      bio: null,
      photo_url: avatarUrl(authorName),
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (insertRes.error || !insertRes.data?.id) {
    throw new Error(`No se pudo crear author '${authorSlug}': ${insertRes.error?.message ?? "sin id"}`);
  }

  return { id: insertRes.data.id, created: true };
}

async function ensureTag(client, userId, tagName, tagSlug) {
  const existingRes = await client
    .from("tags")
    .select("id,name,is_active")
    .eq("slug", tagSlug)
    .maybeSingle();

  if (existingRes.error) {
    throw new Error(`Error consultando tag '${tagSlug}': ${existingRes.error.message}`);
  }

  if (existingRes.data?.id) {
    const updates = {};
    if (!existingRes.data.is_active) {
      updates.is_active = true;
    }
    if (String(existingRes.data.name ?? "").trim() !== tagName) {
      updates.name = tagName;
    }

    if (Object.keys(updates).length > 0) {
      const updateRes = await client
        .from("tags")
        .update({ ...updates, updated_by: userId })
        .eq("id", existingRes.data.id);
      if (updateRes.error) {
        throw new Error(`No se pudo actualizar tag '${tagSlug}': ${updateRes.error.message}`);
      }
    }

    return { id: existingRes.data.id, created: false };
  }

  const insertRes = await client
    .from("tags")
    .insert({
      name: tagName,
      slug: tagSlug,
      description: null,
      seo: {},
      is_active: true,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (insertRes.error || !insertRes.data?.id) {
    throw new Error(`No se pudo crear tag '${tagSlug}': ${insertRes.error?.message ?? "sin id"}`);
  }

  return { id: insertRes.data.id, created: true };
}

async function ensureTags(client, userId, tags) {
  const tagIds = [];
  let createdCount = 0;

  for (const tag of tags) {
    const res = await ensureTag(client, userId, tag.name, tag.slug);
    if (res.created) {
      createdCount += 1;
    }
    tagIds.push(res.id);
  }

  return { tagIds, createdCount };
}

async function upsertBlogPostAsDraft(client, userId, cmsPost, categoryId, authorId) {
  const existingRes = await client
    .from("blog_posts")
    .select("id")
    .eq("category_slug", cmsPost.categorySlug)
    .eq("slug", cmsPost.slug)
    .maybeSingle();

  if (existingRes.error) {
    throw new Error(`Error consultando blog_post ${cmsPost.categorySlug}/${cmsPost.slug}: ${existingRes.error.message}`);
  }

  const draftPayload = {
    status: "draft",
    h1: cmsPost.title,
    meta_description: cmsPost.snippet,
    slug: cmsPost.slug,
    canonical_url: cmsPost.canonicalUrl,
    short_description: cmsPost.snippet,
    featured_image_url: cmsPost.imageSrc,
    featured_image_alt: cmsPost.imageAlt,
    category_id: categoryId,
    author_id: authorId,
    content_markdown: cmsPost.contentMarkdown,
    publish_date: null,
    updated_by: userId,
  };

  if (existingRes.data?.id) {
    const updateRes = await client
      .from("blog_posts")
      .update(draftPayload)
      .eq("id", existingRes.data.id)
      .select("id")
      .single();

    if (updateRes.error || !updateRes.data?.id) {
      throw new Error(`No se pudo actualizar blog_post ${cmsPost.slug}: ${updateRes.error?.message ?? "sin id"}`);
    }

    return { id: updateRes.data.id, created: false };
  }

  const insertRes = await client
    .from("blog_posts")
    .insert({
      ...draftPayload,
      created_by: userId,
    })
    .select("id")
    .single();

  if (insertRes.error || !insertRes.data?.id) {
    throw new Error(`No se pudo crear blog_post ${cmsPost.slug}: ${insertRes.error?.message ?? "sin id"}`);
  }

  return { id: insertRes.data.id, created: true };
}

async function syncPostTags(client, postId, tagIds) {
  const deleteRes = await client.from("blog_post_tags").delete().eq("blog_post_id", postId);
  if (deleteRes.error) {
    throw new Error(`No se pudo limpiar tags del post ${postId}: ${deleteRes.error.message}`);
  }

  if (!tagIds.length) {
    return;
  }

  const insertRows = tagIds.map((tagId) => ({
    blog_post_id: postId,
    tag_id: tagId,
  }));

  const insertRes = await client.from("blog_post_tags").insert(insertRows);
  if (insertRes.error) {
    throw new Error(`No se pudieron insertar tags del post ${postId}: ${insertRes.error.message}`);
  }
}

async function syncPostFaqs(client, postId, faqs) {
  const deleteRes = await client.from("blog_faqs").delete().eq("blog_post_id", postId);
  if (deleteRes.error) {
    throw new Error(`No se pudo limpiar FAQs del post ${postId}: ${deleteRes.error.message}`);
  }

  if (!faqs.length) {
    return;
  }

  const rows = faqs.map((faq) => ({
    blog_post_id: postId,
    position: faq.position,
    question: faq.question,
    answer: faq.answer,
  }));

  const insertRes = await client.from("blog_faqs").insert(rows);
  if (insertRes.error) {
    throw new Error(`No se pudieron insertar FAQs del post ${postId}: ${insertRes.error.message}`);
  }
}

async function publishPost(client, userId, postId, publishDateIso) {
  const updateRes = await client
    .from("blog_posts")
    .update({
      status: "published",
      publish_date: publishDateIso,
      updated_by: userId,
    })
    .eq("id", postId)
    .select("id")
    .single();

  if (updateRes.error || !updateRes.data?.id) {
    throw new Error(`No se pudo publicar post ${postId}: ${updateRes.error?.message ?? "sin id"}`);
  }
}

function printSummary(summary) {
  console.log("\nResumen migracion");
  console.log(`- archivos procesados: ${summary.files}`);
  console.log(`- posts creados: ${summary.postsCreated}`);
  console.log(`- posts actualizados: ${summary.postsUpdated}`);
  console.log(`- categories creadas: ${summary.categoriesCreated}`);
  console.log(`- authors creados: ${summary.authorsCreated}`);
  console.log(`- tags creados: ${summary.tagsCreated}`);
  console.log(`- estado final forced draft: ${summary.forceDraft ? "si" : "no"}`);
  console.log(`- modo: ${summary.apply ? "apply" : "dry-run"}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const rootDir = process.cwd();
  const sourceDir = path.resolve(rootDir, args.source);
  const envFilePath = path.resolve(rootDir, args.envFile);
  const inventoryPath = path.resolve(rootDir, args.inventory);

  const files = await listMarkdownFiles(sourceDir);
  if (!files.length) {
    throw new Error(`No se encontraron archivos markdown en ${sourceDir}`);
  }

  const parsedPosts = [];
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const relativeFile = path.relative(rootDir, filePath).replace(/\\/g, "/");
    parsedPosts.push(parseMarkdownBlogDocument(relativeFile, raw));
  }

  await fs.mkdir(path.dirname(inventoryPath), { recursive: true });
  const inventoryMarkdown = renderInventoryMarkdown(parsedPosts);
  await fs.writeFile(inventoryPath, inventoryMarkdown, "utf8");
  console.log(`[migrate-blog] Inventario generado en ${inventoryPath}`);

  const cmsPosts = parsedPosts.map((post) => toCmsMigrationPost(post, { forceDraft: args.allDraft }));
  console.log(`[migrate-blog] Archivos markdown detectados: ${cmsPosts.length}`);

  if (!args.apply) {
    cmsPosts.forEach((post) => {
      console.log(`- ${path.basename(post.sourceFile)} => /blog/${post.categorySlug}/${post.slug} (${post.status})`);
    });
    printSummary({
      apply: false,
      files: cmsPosts.length,
      postsCreated: 0,
      postsUpdated: 0,
      categoriesCreated: 0,
      authorsCreated: 0,
      tagsCreated: 0,
      forceDraft: args.allDraft,
    });
    return;
  }

  const envMap = await readEnvFileMap(envFilePath);
  const config = resolveConfig(args, envMap);

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_ANON_KEY para ejecutar apply.");
  }
  if (!config.email || !config.password) {
    throw new Error("Para --apply debes proporcionar --email y --password (o env CMS_MIGRATION_EMAIL/CMS_MIGRATION_PASSWORD).");
  }

  const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const authRes = await client.auth.signInWithPassword({ email: config.email, password: config.password });
  if (authRes.error || !authRes.data.user?.id) {
    throw new Error(`No se pudo autenticar usuario editorial: ${authRes.error?.message ?? "sin user"}`);
  }

  const userId = authRes.data.user.id;
  const profileRes = await client
    .from("profiles")
    .select("role,is_active")
    .eq("id", userId)
    .maybeSingle();

  if (profileRes.error || !profileRes.data) {
    throw new Error(`No se pudo cargar perfil editorial: ${profileRes.error?.message ?? "sin perfil"}`);
  }
  if (!profileRes.data.is_active) {
    throw new Error("El perfil editorial esta inactivo.");
  }

  const role = String(profileRes.data.role ?? "");
  if (!["admin", "editor"].includes(role)) {
    throw new Error(`Rol '${role}' no autorizado para migracion.`);
  }

  if (!args.allDraft && role !== "admin") {
    const hasPublished = cmsPosts.some((post) => post.status === "published");
    if (hasPublished) {
      throw new Error("Para publicar durante migracion se requiere rol admin o usar --all-draft.");
    }
  }

  const summary = {
    apply: true,
    files: cmsPosts.length,
    postsCreated: 0,
    postsUpdated: 0,
    categoriesCreated: 0,
    authorsCreated: 0,
    tagsCreated: 0,
    forceDraft: args.allDraft,
  };

  for (const cmsPost of cmsPosts) {
    console.log(`[migrate-blog] Procesando ${path.basename(cmsPost.sourceFile)} ...`);

    const category = await ensureCategory(client, userId, cmsPost.categoryName, cmsPost.categorySlug);
    if (category.created) {
      summary.categoriesCreated += 1;
    }

    const author = await ensureAuthor(client, userId, cmsPost.authorName, cmsPost.authorSlug);
    if (author.created) {
      summary.authorsCreated += 1;
    }

    const tagsResult = await ensureTags(client, userId, cmsPost.tags);
    summary.tagsCreated += tagsResult.createdCount;

    const postRes = await upsertBlogPostAsDraft(client, userId, cmsPost, category.id, author.id);
    if (postRes.created) {
      summary.postsCreated += 1;
    } else {
      summary.postsUpdated += 1;
    }

    await syncPostTags(client, postRes.id, tagsResult.tagIds);
    await syncPostFaqs(client, postRes.id, cmsPost.faqs);

    if (cmsPost.status === "published") {
      await publishPost(client, userId, postRes.id, cmsPost.publishDateIso);
    }
  }

  await client.auth.signOut();
  printSummary(summary);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[migrate-blog] ERROR: ${message}`);
  process.exitCode = 1;
});
