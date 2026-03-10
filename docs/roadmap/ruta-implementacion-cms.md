# Ruta de ImplementaciÃ³n CMS (CreaMVP)

Documento operativo para ejecutar el CMS de CreaMVP por etapas, con pasos marcables y criterios claros para agentes de IA.

---

## Estado actual (corte 2026-03-10 14:57 -06:00)

- Etapas completadas: `1`, `3`, `5`, `6`.
- Etapas en progreso: `4`, `7`, `8`.
- Etapas pendientes: `0`, `2`, `9`.
- Bloqueadores activos:
  - Falta ejecutar carga real de migracion markdown -> CMS: `npm run cms:migrate:blog:apply -- --email <email> --password <password>`.
  - `npm run astro -- check` mantiene 19 errores legacy fuera del alcance CMS actual.

---

## 1) Estado inicial y alcance

- [x] Existe proyecto de Supabase creado.
- [x] Existe tabla `auth.users` (default de Supabase).
- [x] Tablas CMS iniciales creadas en Supabase (migraciÃ³n `01_schema_inicial_cms.sql` aplicada).
- [x] Panel base de login/editorial creado en el sitio (`/cms/login`, `/cms`, `/cms/forbidden`).
- [x] Endpoints editoriales versionados en cÃ³digo para creaciÃ³n/publicaciÃ³n de blogs por API.

Alcance de esta ruta:

- Implementar CMS funcional con prioridad en Blog.
- Cumplir URL pÃºblica: `https://creamvp.com/blog/[categoria]/[slug]`.
- Habilitar panel de administraciÃ³n tipo Webflow para ediciÃ³n manual.
- Habilitar API para creaciÃ³n automÃ¡tica (IA) con estado inicial `draft`.

---

## 2) Reglas obligatorias de ejecuciÃ³n

- [ ] Consultar y cumplir `docs/metodos/agentrules.json` antes de cada etapa.
- [ ] Mantener alineaciÃ³n con `docs/roadmap/cms.md` (contratos de contenido y SEO).
- [ ] No avanzar de etapa sin completar los checks de calidad de la etapa actual.
- [ ] Registrar avances en `docs/metodos/Ralph/Ralph_WIP.json` por iteraciÃ³n.

---

## 3) Roadmap por etapas (checklist ejecutable)

## Etapa 0 - PreparaciÃ³n tÃ©cnica (base de trabajo)

Objetivo: dejar entorno y convenciones listas para construir sin retrabajo.

- [ ] Crear rama de implementaciÃ³n CMS.
- [x] Definir variables de entorno requeridas en `.env.example` y entorno local.
- [x] Definir estructura de carpetas para capa CMS (`src/features/cms/...` o equivalente).
- [ ] Definir convenciÃ³n de nombres para slugs, estados y DTOs.
- [ ] Confirmar estrategia de despliegue (Vercel + Supabase + Edge Functions).

Entregables:

- [ ] Checklist de entorno validado.
- [ ] Convenciones de proyecto documentadas en este archivo o docs tÃ©cnicos.

---

## Etapa 1 - Modelo de datos CMS en Supabase (desde cero)

Objetivo: crear todas las tablas mÃ­nimas necesarias para blog + editorial.

### 1.1 Tablas nÃºcleo (mÃ­nimas)

- [x] `profiles` (vinculada 1:1 con `auth.users.id`, datos de perfil editorial y rol).
- [x] `authors`.
- [x] `categories`.
- [x] `tags`.
- [x] `blog_posts`.
- [x] `blog_post_tags` (N:N entre posts y tags).
- [x] `blog_faqs`.
- [x] `blog_revisions` (versionado bÃ¡sico).

### 1.2 Campos crÃ­ticos obligatorios

- [x] `profiles.id` = `auth.users.id` (PK + FK 1:1).
- [x] `profiles.role` con enum: `admin|editor|reviewer|developer`.
- [x] `profiles.full_name`, `avatar_url`, `is_active`, `created_at`, `updated_at`.
- [x] `blog_posts.status` con enum: `draft|scheduled|published`.
- [x] `blog_posts.h1`, `meta_description`, `slug`, `canonical_url`, `short_description`.
- [x] `blog_posts.featured_image_*` (url, alt, metadata mÃ­nima).
- [x] `blog_posts.category_id`, `category_slug`.
- [x] `blog_posts.content_markdown`.
- [x] `blog_posts.schema_auto`, `schema_override`.
- [x] `blog_posts.publish_date`, `updated_at`, `created_at`.

### 1.3 Constraints y consistencia

- [x] Trigger/sync para crear `profiles` cuando se crea `auth.users` (o proceso administrativo equivalente).
- [x] Constraint de unicidad compuesta: `(category_slug, slug)`.
- [x] ValidaciÃ³n de formato slug (`a-z0-9-`).
- [x] Triggers `updated_at`.
- [x] FKs correctas entre posts, categories, authors y tags.

Entregables:

- [x] Migraciones SQL versionadas.
- [x] Esquema aplicado en Supabase sin errores.

---

## Etapa 2 - Seguridad, permisos y autenticaciÃ³n editorial

Objetivo: habilitar acceso seguro al CMS y control por roles.

### 2.1 Login CMS

- [x] Crear pÃ¡gina de login: `/cms/login`.
- [x] Integrar Supabase Auth (email/password o magic link definido).
- [x] Manejar sesiÃ³n y logout.
- [x] RedirecciÃ³n post-login a `/cms`.

### 2.2 Guardas de rutas CMS

- [x] Proteger todas las rutas `/cms/*` (guardia frontend para pÃ¡ginas CMS actuales).
- [x] Bloquear acceso no autenticado.
- [x] Mostrar vista de â€œsin permisosâ€ para roles insuficientes.

### 2.3 RLS y polÃ­ticas

- [x] Definir polÃ­ticas RLS por tabla CMS.
- [x] Resolver permisos leyendo `profiles.role` del usuario autenticado.
- [x] `admin/editor`: crear y editar drafts.
- [x] `admin/reviewer`: publicar y devolver a draft.
- [x] Solo lectura para roles no editoriales en panel.
- [x] Definir bootstrap de primer usuario `admin` en `profiles`.

Entregables:

- [x] Login funcional.
- [x] Rutas CMS protegidas.
- [x] MigraciÃ³n RLS aplicada (`supabase/03_rls_politicas_editoriales.sql`).
- [ ] RLS validado con pruebas de permisos por rol.

---

## Etapa 3 - API editorial para blog (manual + IA)

Objetivo: exponer endpoints para crear/editar/cambiar estado.

### 3.1 Endpoints mÃ­nimos (Edge Functions)

- [x] `POST /functions/v1/cms-blog-create`.
- [x] `PATCH /functions/v1/cms-blog-update`.
- [x] `PATCH /functions/v1/cms-blog-status`.
- [x] `DELETE /functions/v1/cms-blog-delete`.

### 3.2 Reglas obligatorias de negocio

- [x] `cms-blog-create` siempre crea entradas en `draft`.
- [x] `cms-blog-status` soporta:
- [x] `draft -> published`
- [x] `published -> draft`
- [x] `draft -> scheduled`
- [x] `scheduled -> published`
- [x] ValidaciÃ³n de payload con schema antes de persistir.
- [x] Registro de auditorÃ­a (`createdBy`, `updatedBy`, timestamps, cambios de estado).

### 3.3 Seguridad API

- [x] Requerir autenticaciÃ³n en endpoints de escritura.
- [x] Aplicar permisos por rol (`profiles.role`) en cada transiciÃ³n de estado.
- [x] Agregar rate limit y logging de eventos relevantes.

Entregables:

- [x] Endpoints desplegados y testeados.
- [x] DocumentaciÃ³n de contratos request/response.

---

## Etapa 4 - Panel CMS tipo Webflow (UI editorial)

Objetivo: interfaz editorial para operaciÃ³n diaria del blog.

### 4.1 Vistas principales

- [x] `/cms` dashboard.
- [x] `/cms/blog` listado con bÃºsqueda/filtros/estado.
- [x] `/cms/blog/new` creaciÃ³n de entrada.
- [x] `/cms/blog/[id]` edicion de entrada.
- [x] `/cms/authors` gestiÃ³n de autores.
- [x] `/cms/categories` gestiÃ³n de categorÃ­as.
- [x] `/cms/tags` gestiÃ³n de tags.

Nota operativa UI: la ruta exacta `/cms/blog/[id]` ya esta habilitada (SSR on-demand). `/cms/blog/edit?id=<uuid>` se conserva solo como compatibilidad y redirige a la ruta dinamica.

### 4.2 Formulario editorial de blog (obligatorio)

- [x] H1.
- [x] metaDescription.
- [x] slug.
- [x] canonicalUrl.
- [x] shortDescription.
- [x] featuredImage.
- [x] category.
- [x] tags.
- [x] contentMarkdown.
- [x] author.
- [x] schemaAuto + schemaOverride.
- [x] faqs.
- [x] status.

### 4.3 Acciones editoriales

- [x] Boton `Save Draft`.
- [x] Boton `Publish`.
- [x] Boton `Revert to Draft`.
- [x] Boton `Delete` (solo `admin`, con confirmacion).
- [x] Preview tokenizado para entradas no publicadas (`draft`/`scheduled`).

Entregables:

- [ ] Panel funcional extremo a extremo.
- [ ] Flujo editorial manual completo operando.

---

## Etapa 5 - IntegraciÃ³n con frontend pÃºblico (Astro)

Objetivo: render pÃºblico SEO-friendly y estructura de rutas final.

### 5.1 Rutas pÃºblicas blog

- [x] `/blog` (listado general).
- [x] `/blog/[categoria]` (listado por categorÃ­a).
- [x] `/blog/[categoria]/[slug]` (detalle).

### 5.2 Compatibilidad legacy

- [x] Redirecciones `301` desde `/blog/[slug]` a `/blog/[categoria]/[slug]`.
- [x] ActualizaciÃ³n de links internos a la nueva estructura.

### 5.3 SEO tÃ©cnico y contenido para IA

- [x] Canonical correcto por entrada.
- [x] OpenGraph y Twitter Card por entrada.
- [x] JSON-LD `BlogPosting`.
- [x] JSON-LD `BreadcrumbList`.
- [x] JSON-LD `FAQPage` cuando aplique.
- [x] Sitemap actualizado con rutas nuevas.
- [x] HTML semÃ¡ntico + un `h1` por entrada.

Entregables:

- [x] Blog pÃºblico operativo con nuevas URLs.
- [x] SEO validado en rutas clave.

---

## Etapa 6 - CMS de autores (detalle requerido)

Objetivo: soportar autores con perfil completo para blog.

- [x] Crear CRUD de `authors` en panel CMS.
- [x] Campos obligatorios: `name`, `photo`.
- [x] Campos de redes: `facebook`, `instagram`, `x`, `tiktok`, `linkedin`, `personalUrl`.
- [x] Vincular autor en cada entrada de blog.
- [x] Render de autor en pÃ¡gina pÃºblica del blog.

Entregables:

- [x] CMS de autores funcional.
- [x] Autor visible y consistente en frontend pÃºblico.

---

## Etapa 7 - MigraciÃ³n de contenido actual (Markdown -> CMS)

Objetivo: pasar contenido existente sin pÃ©rdida SEO.

- [x] Inventario de `src/content/blog`.
- [x] Script de mapeo `frontmatter -> schema CMS`.
- [x] Migrar slugs actuales a formato `(categorySlug, slug)`.
- [x] Definir categorÃ­a para entradas sin categorÃ­a.
- [ ] Cargar entradas iniciales en `draft` o `published` segÃºn polÃ­tica acordada.
- [ ] Verificar imÃ¡genes, enlaces internos y metadata SEO.

Entregables:

- [x] Script de migraciÃ³n versionado.
- [ ] Lote inicial migrado y validado.

Nota operativa Etapa 7:

- Script disponible: `npm run cms:migrate:blog` (dry-run) y `npm run cms:migrate:blog:apply -- --email <email> --password <password>`.
- Inventario actual generado en `docs/roadmap/blog-markdown-inventory.md`.

---

## Etapa 8 - Testing, QA y quality gates

Objetivo: asegurar estabilidad antes de release.

- [x] Unit tests para utilidades, validadores y mapeos CMS.
- [x] Tests de API para create/update/status + permisos por rol.
- [x] Tests de UI para flujo editorial (crear draft, publicar, volver a draft).
- [x] Suite base Playwright UI (login CMS + guardas de rutas protegidas).
- [x] E2E de rutas pÃºblicas: `/blog`, `/blog/[categoria]`, `/blog/[categoria]/[slug]`.
- [x] ValidaciÃ³n SEO automatizada de metadatos crÃ­ticos.
- [x] Ejecutar `npm run build`.
- [ ] Ejecutar `npm run astro -- check`.

Nota QA:

- `npm run astro -- check` sigue reportando 19 errores legacy fuera de mÃ³dulos CMS (por ejemplo `src/pages/about.astro`, `src/pages/contact.astro`, `src/components/BlogShare.astro`, `src/layouts/Layout.astro`).
- Los mÃ³dulos CMS y rutas pÃºblicas de blog de esta etapa validan en verde con `npm run test:api`, `npm run test:unit`, `npm run test:e2e` y `npm run build`.
- La suite API actual cubre contratos y permisos en create/update/status y el flujo de delete via validator/service.

Entregables:

- [x] Evidencia de pruebas y comandos ejecutados.
- [ ] Cero blockers abiertos para release.

---

## Etapa 9 - Release y operaciÃ³n inicial

Objetivo: salir a producciÃ³n con control y observabilidad.

- [ ] Desplegar migraciones y funciones en entorno objetivo.
- [ ] Configurar variables y secretos en hosting.
- [ ] Validar login CMS en producciÃ³n.
- [ ] Validar flujo IA: crear draft por API.
- [ ] Validar publicaciÃ³n y webhook de rebuild.
- [ ] Validar redirecciones 301 y sitemap en producciÃ³n.
- [ ] Plan de rollback documentado.

Entregables:

- [ ] CMS activo en producciÃ³n.
- [ ] Primer contenido creado manualmente y por API, ambos publicados correctamente.

---

## 4) DefiniciÃ³n de terminado (DoD)

Se considera completada la implementaciÃ³n cuando:

- [ ] Panel CMS autenticado estÃ¡ operativo para usuarios editoriales.
- [ ] Blog pÃºblico funciona en `blog/[categoria]/[slug]`.
- [ ] Endpoints API permiten crear drafts y cambiar estado (`publish` / `revert to draft`).
- [ ] SEO tÃ©cnico y JSON-LD cumplen lo definido en `cms.md`.
- [ ] Pruebas obligatorias y quality gates pasan en verde.

---

## 5) Secuencia recomendada para agente IA

Orden sugerido (sin saltos):

- [ ] Etapa 0
- [x] Etapa 1
- [ ] Etapa 2 (pendiente de validacion formal de RLS por rol en entorno integrado)
- [x] Etapa 3
- [ ] Etapa 4 (en progreso)
- [x] Etapa 5
- [x] Etapa 6
- [ ] Etapa 7 (en progreso)
- [ ] Etapa 8 (en progreso)
- [ ] Etapa 9



