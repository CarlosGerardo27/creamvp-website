# Ruta de Implementación CMS (CreaMVP)

Documento operativo para ejecutar el CMS de CreaMVP por etapas, con pasos marcables y criterios claros para agentes de IA.

---

## 1) Estado inicial y alcance

- [x] Existe proyecto de Supabase creado.
- [x] Existe tabla `auth.users` (default de Supabase).
- [x] Tablas CMS iniciales creadas en Supabase (migración `01_schema_inicial_cms.sql` aplicada).
- [x] Panel base de login/editorial creado en el sitio (`/cms/login`, `/cms`, `/cms/forbidden`).
- [ ] No existen endpoints editoriales para creación/publicación de blogs por API.

Alcance de esta ruta:

- Implementar CMS funcional con prioridad en Blog.
- Cumplir URL pública: `https://creamvp.com/blog/[categoria]/[slug]`.
- Habilitar panel de administración tipo Webflow para edición manual.
- Habilitar API para creación automática (IA) con estado inicial `draft`.

---

## 2) Reglas obligatorias de ejecución

- [ ] Consultar y cumplir `docs/metodos/agentrules.json` antes de cada etapa.
- [ ] Mantener alineación con `docs/roadmap/cms.md` (contratos de contenido y SEO).
- [ ] No avanzar de etapa sin completar los checks de calidad de la etapa actual.
- [ ] Registrar avances en `docs/metodos/Ralph/Ralph_WIP.json` por iteración.

---

## 3) Roadmap por etapas (checklist ejecutable)

## Etapa 0 - Preparación técnica (base de trabajo)

Objetivo: dejar entorno y convenciones listas para construir sin retrabajo.

- [ ] Crear rama de implementación CMS.
- [x] Definir variables de entorno requeridas en `.env.example` y entorno local.
- [x] Definir estructura de carpetas para capa CMS (`src/features/cms/...` o equivalente).
- [ ] Definir convención de nombres para slugs, estados y DTOs.
- [ ] Confirmar estrategia de despliegue (Vercel + Supabase + Edge Functions).

Entregables:

- [ ] Checklist de entorno validado.
- [ ] Convenciones de proyecto documentadas en este archivo o docs técnicos.

---

## Etapa 1 - Modelo de datos CMS en Supabase (desde cero)

Objetivo: crear todas las tablas mínimas necesarias para blog + editorial.

### 1.1 Tablas núcleo (mínimas)

- [x] `profiles` (vinculada 1:1 con `auth.users.id`, datos de perfil editorial y rol).
- [x] `authors`.
- [x] `categories`.
- [x] `tags`.
- [x] `blog_posts`.
- [x] `blog_post_tags` (N:N entre posts y tags).
- [x] `blog_faqs`.
- [x] `blog_revisions` (versionado básico).

### 1.2 Campos críticos obligatorios

- [x] `profiles.id` = `auth.users.id` (PK + FK 1:1).
- [x] `profiles.role` con enum: `admin|editor|reviewer|developer`.
- [x] `profiles.full_name`, `avatar_url`, `is_active`, `created_at`, `updated_at`.
- [x] `blog_posts.status` con enum: `draft|scheduled|published`.
- [x] `blog_posts.h1`, `meta_description`, `slug`, `canonical_url`, `short_description`.
- [x] `blog_posts.featured_image_*` (url, alt, metadata mínima).
- [x] `blog_posts.category_id`, `category_slug`.
- [x] `blog_posts.content_markdown`.
- [x] `blog_posts.schema_auto`, `schema_override`.
- [x] `blog_posts.publish_date`, `updated_at`, `created_at`.

### 1.3 Constraints y consistencia

- [x] Trigger/sync para crear `profiles` cuando se crea `auth.users` (o proceso administrativo equivalente).
- [x] Constraint de unicidad compuesta: `(category_slug, slug)`.
- [x] Validación de formato slug (`a-z0-9-`).
- [x] Triggers `updated_at`.
- [x] FKs correctas entre posts, categories, authors y tags.

Entregables:

- [x] Migraciones SQL versionadas.
- [x] Esquema aplicado en Supabase sin errores.

---

## Etapa 2 - Seguridad, permisos y autenticación editorial

Objetivo: habilitar acceso seguro al CMS y control por roles.

### 2.1 Login CMS

- [x] Crear página de login: `/cms/login`.
- [x] Integrar Supabase Auth (email/password o magic link definido).
- [x] Manejar sesión y logout.
- [x] Redirección post-login a `/cms`.

### 2.2 Guardas de rutas CMS

- [x] Proteger todas las rutas `/cms/*` (guardia frontend para páginas CMS actuales).
- [x] Bloquear acceso no autenticado.
- [x] Mostrar vista de “sin permisos” para roles insuficientes.

### 2.3 RLS y políticas

- [x] Definir políticas RLS por tabla CMS.
- [x] Resolver permisos leyendo `profiles.role` del usuario autenticado.
- [x] `admin/editor`: crear y editar drafts.
- [x] `admin/reviewer`: publicar y devolver a draft.
- [x] Solo lectura para roles no editoriales en panel.
- [x] Definir bootstrap de primer usuario `admin` en `profiles`.

Entregables:

- [x] Login funcional.
- [x] Rutas CMS protegidas.
- [x] Migración RLS aplicada (`supabase/03_rls_politicas_editoriales.sql`).
- [ ] RLS validado con pruebas de permisos por rol.

---

## Etapa 3 - API editorial para blog (manual + IA)

Objetivo: exponer endpoints para crear/editar/cambiar estado.

### 3.1 Endpoints mínimos (Edge Functions)

- [ ] `POST /functions/v1/cms-blog-create`.
- [ ] `PATCH /functions/v1/cms-blog-update`.
- [ ] `PATCH /functions/v1/cms-blog-status`.

### 3.2 Reglas obligatorias de negocio

- [ ] `cms-blog-create` siempre crea entradas en `draft`.
- [ ] `cms-blog-status` soporta:
- [ ] `draft -> published`
- [ ] `published -> draft`
- [ ] `draft -> scheduled`
- [ ] `scheduled -> published`
- [ ] Validación de payload con schema antes de persistir.
- [ ] Registro de auditoría (`createdBy`, `updatedBy`, timestamps, cambios de estado).

### 3.3 Seguridad API

- [ ] Requerir autenticación en endpoints de escritura.
- [ ] Aplicar permisos por rol (`profiles.role`) en cada transición de estado.
- [ ] Agregar rate limit y logging de eventos relevantes.

Entregables:

- [ ] Endpoints desplegados y testeados.
- [ ] Documentación de contratos request/response.

---

## Etapa 4 - Panel CMS tipo Webflow (UI editorial)

Objetivo: interfaz editorial para operación diaria del blog.

### 4.1 Vistas principales

- [ ] `/cms` dashboard.
- [ ] `/cms/blog` listado con búsqueda/filtros/estado.
- [ ] `/cms/blog/new` creación de entrada.
- [ ] `/cms/blog/[id]` edición de entrada.
- [ ] `/cms/authors` gestión de autores.
- [ ] `/cms/categories` gestión de categorías.
- [ ] `/cms/tags` gestión de tags.

### 4.2 Formulario editorial de blog (obligatorio)

- [ ] H1.
- [ ] metaDescription.
- [ ] slug.
- [ ] canonicalUrl.
- [ ] shortDescription.
- [ ] featuredImage.
- [ ] category.
- [ ] tags.
- [ ] contentMarkdown.
- [ ] author.
- [ ] schemaAuto + schemaOverride.
- [ ] faqs.
- [ ] status.

### 4.3 Acciones editoriales

- [ ] Botón `Save Draft`.
- [ ] Botón `Publish`.
- [ ] Botón `Revert to Draft`.
- [ ] Preview tokenizado (`desktop/tablet/mobile`) para no publicados.

Entregables:

- [ ] Panel funcional extremo a extremo.
- [ ] Flujo editorial manual completo operando.

---

## Etapa 5 - Integración con frontend público (Astro)

Objetivo: render público SEO-friendly y estructura de rutas final.

### 5.1 Rutas públicas blog

- [ ] `/blog` (listado general).
- [ ] `/blog/[categoria]` (listado por categoría).
- [ ] `/blog/[categoria]/[slug]` (detalle).

### 5.2 Compatibilidad legacy

- [ ] Redirecciones `301` desde `/blog/[slug]` a `/blog/[categoria]/[slug]`.
- [ ] Actualización de links internos a la nueva estructura.

### 5.3 SEO técnico y contenido para IA

- [ ] Canonical correcto por entrada.
- [ ] OpenGraph y Twitter Card por entrada.
- [ ] JSON-LD `BlogPosting`.
- [ ] JSON-LD `BreadcrumbList`.
- [ ] JSON-LD `FAQPage` cuando aplique.
- [ ] Sitemap actualizado con rutas nuevas.
- [ ] HTML semántico + un `h1` por entrada.

Entregables:

- [ ] Blog público operativo con nuevas URLs.
- [ ] SEO validado en rutas clave.

---

## Etapa 6 - CMS de autores (detalle requerido)

Objetivo: soportar autores con perfil completo para blog.

- [ ] Crear CRUD de `authors` en panel CMS.
- [ ] Campos obligatorios: `name`, `photo`.
- [ ] Campos de redes: `facebook`, `instagram`, `x`, `tiktok`, `linkedin`, `personalUrl`.
- [ ] Vincular autor en cada entrada de blog.
- [ ] Render de autor en página pública del blog.

Entregables:

- [ ] CMS de autores funcional.
- [ ] Autor visible y consistente en frontend público.

---

## Etapa 7 - Migración de contenido actual (Markdown -> CMS)

Objetivo: pasar contenido existente sin pérdida SEO.

- [ ] Inventario de `src/content/blog`.
- [ ] Script de mapeo `frontmatter -> schema CMS`.
- [ ] Migrar slugs actuales a formato `(categorySlug, slug)`.
- [ ] Definir categoría para entradas sin categoría.
- [ ] Cargar entradas iniciales en `draft` o `published` según política acordada.
- [ ] Verificar imágenes, enlaces internos y metadata SEO.

Entregables:

- [ ] Script de migración versionado.
- [ ] Lote inicial migrado y validado.

---

## Etapa 8 - Testing, QA y quality gates

Objetivo: asegurar estabilidad antes de release.

- [ ] Unit tests para utilidades, validadores y mapeos CMS.
- [ ] Tests de API para create/update/status + permisos por rol.
- [ ] Tests de UI para flujo editorial (crear draft, publicar, volver a draft).
- [ ] E2E de rutas públicas: `/blog`, `/blog/[categoria]`, `/blog/[categoria]/[slug]`.
- [ ] Validación SEO automatizada de metadatos críticos.
- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar `npm run astro -- check`.

Entregables:

- [ ] Evidencia de pruebas y comandos ejecutados.
- [ ] Cero blockers abiertos para release.

---

## Etapa 9 - Release y operación inicial

Objetivo: salir a producción con control y observabilidad.

- [ ] Desplegar migraciones y funciones en entorno objetivo.
- [ ] Configurar variables y secretos en hosting.
- [ ] Validar login CMS en producción.
- [ ] Validar flujo IA: crear draft por API.
- [ ] Validar publicación y webhook de rebuild.
- [ ] Validar redirecciones 301 y sitemap en producción.
- [ ] Plan de rollback documentado.

Entregables:

- [ ] CMS activo en producción.
- [ ] Primer contenido creado manualmente y por API, ambos publicados correctamente.

---

## 4) Definición de terminado (DoD)

Se considera completada la implementación cuando:

- [ ] Panel CMS autenticado está operativo para usuarios editoriales.
- [ ] Blog público funciona en `blog/[categoria]/[slug]`.
- [ ] Endpoints API permiten crear drafts y cambiar estado (`publish` / `revert to draft`).
- [ ] SEO técnico y JSON-LD cumplen lo definido en `cms.md`.
- [ ] Pruebas obligatorias y quality gates pasan en verde.

---

## 5) Secuencia recomendada para agente IA

Orden sugerido (sin saltos):

- [ ] Etapa 0
- [x] Etapa 1
- [ ] Etapa 2
- [ ] Etapa 3
- [ ] Etapa 4
- [ ] Etapa 5
- [ ] Etapa 6
- [ ] Etapa 7
- [ ] Etapa 8
- [ ] Etapa 9
