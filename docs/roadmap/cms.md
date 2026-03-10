# CMS tipo Webflow para CreaMVP Website

## Propuesta de arquitectura y especificación (Versión final)

---

# Resumen ejecutivo

Se propone producir un **documento guía y especificación técnica** para implementar una experiencia de **edición tipo Webflow** para el sitio **CreaMVP Website**.

El objetivo es habilitar:

* **Edición visual y estructurada** de páginas comerciales (landings, servicios, casos de estudio).
* **Gestión más flexible del blog**.
* Mantener **alto rendimiento, SEO y control del frontend**, que actualmente utiliza **Astro**.

El documento presenta:

* objetivos
* alcance
* modelos de contenido
* requerimientos de UX
* arquitectura técnica
* roadmap MVP
* plan de migración
* criterios de aceptación
* riesgos y mitigaciones

---

# Infraestructura del CMS

El CMS se construirá utilizando **Supabase como backend de contenido**.

**Proyecto Supabase**

```
Supabase Project URL:
https://wmfwcpjkypbkkvtmkepn.supabase.co

Project ID:
wmfwcpjkypbkkvtmkepn
```

Supabase proveerá:

* PostgreSQL (base de datos CMS)
* Storage (assets e imágenes)
* Auth (roles editoriales)
* Edge Functions (webhooks / preview)
* API REST automática
* RPC queries para frontend

---

# Objetivos

### 1. Edición sin dependencia de desarrolladores

Habilitar edición visual de:

* landings
* páginas comerciales
* servicios
* casos de estudio

sin necesidad de modificar código.

---

### 2. Mantener SEO y rendimiento

El sitio continuará generándose mediante **Astro Static Build**.

Se conservará control total sobre:

* metadatos
* JSON-LD
* OpenGraph
* sitemap
* canonical tags

---

### 3. Facilitar gestión editorial

Permitir creación y edición de:

* artículos de blog
* páginas
* recursos

con:

* validación de campos
* workflows editoriales
* versionado básico

---

### 4. Mantener integraciones actuales

Se conservarán integraciones existentes:

* formularios (`forms.creamvp.com`)
* academia (`academia.creamvp.com`)
* analytics
* tracking

---

# Alcance

El CMS cubrirá los siguientes modelos de contenido.

## Modelos principales

* Pages (landings)
* Services
* Case Studies
* Blog posts
* Authors
* Tags / Categories
* FAQs
* Assets

---

## Interfaz editorial

La plataforma incluirá:

* preview de contenido
* control de estado editorial
* gestión de assets
* editor de bloques

Estados editoriales:

```
draft
scheduled
published
```

---

## Integraciones

El sistema soportará:

* formularios actuales
* analytics
* sitemap automático
* Open Graph metadata
* redirecciones básicas

---

## Migración de contenido

Se definirá una estrategia para migrar el contenido actual:

```
src/content/blog/*.md
```

hacia:

* CMS Supabase
* o un flujo híbrido

---

# Modelo de contenidos propuesto

---

# Página (Landing)

Campos:

```
title
slug
hero
blocks[]
seo
meta
```

### Hero

```
image
title
subtitle
cta
```

### Blocks

Tipos de bloques:

```
richText
features
testimonials
gallery
cta
faq
code
embed
```

### SEO

```
title
description
openGraph
canonical
```

### Meta

```
noindex
canonical
```

---

# Servicio

Campos:

```
title
slug
snippet
image
category
outcomes[]
caseStudies[]
seo
```

---

# Caso de estudio

Campos:

```
title
client
date
summary
problem
solution
results
gallery[]
relatedServices[]
seo
```

---

# Blog

Campos (modelo final):

```
status (draft|scheduled|published)
h1
metaDescription
slug
canonicalUrl
shortDescription
featuredImage
publishDate
updatedDate
authorId
categoryId
categorySlug
tags[]
schemaAuto
schemaOverride
faqs[]
contentMarkdown
seo
```

Detalle de campos editoriales:

```
h1
Texto principal del artículo (equivale al H1 visible en página)

metaDescription
Texto SEO para snippet de resultados en buscadores

slug
Identificador del post dentro de su categoría

canonicalUrl
URL canónica editable. Debe resolverse a /blog/[categoria]/[slug]

shortDescription
Resumen corto para tarjetas/listados (preview)

featuredImage
Imagen principal del post y miniaturas de listados (incluye alt obligatorio)

categoryId + categorySlug
Relación con colección Categories y slug de categoría para URL pública

tags[]
Relación de tags editoriales

contentMarkdown
Cuerpo del artículo en Markdown

schemaAuto
JSON-LD generado automáticamente al guardar

schemaOverride
Edición manual opcional del marcado Schema cuando se requiera

faqs[]
Sección de preguntas frecuentes para render en página y consumo por agentes de IA
```

Reglas obligatorias de publicación:

```
status inicial = draft
publish permitido solo si h1/metaDescription/slug/canonicalUrl/featuredImage/category/contentMarkdown están completos
unique key = (categorySlug, slug)
```

El campo `contentMarkdown` será compatible con:

```
markdown
rich blocks
```

---

# Estructura de URLs del Blog (obligatoria)

La estructura canónica de entradas del blog será:

```
https://creamvp.com/blog/[categoria]/[slug]
```

Ejemplo:

```
https://creamvp.com/blog/automatizacion/como-ahorrar-10-horas-semanales
```

Reglas de routing:

* Ruta de listado general: `/blog`
* Ruta de listado por categoría: `/blog/[categoria]`
* Ruta de detalle: `/blog/[categoria]/[slug]`
* Se debe crear ruta Astro equivalente: `src/pages/blog/[categoria]/[slug].astro`

Reglas de slugs:

* `categoria` y `slug` son obligatorios para publicar.
* Solo minúsculas, números y guiones (`a-z`, `0-9`, `-`).
* Sin acentos, sin espacios, sin caracteres especiales.
* Unicidad compuesta obligatoria en CMS: `(categoria_slug, post_slug)`.

Compatibilidad y transición:

* Si existe tráfico histórico en `/blog/[slug]`, debe redirigir con `301` a `/blog/[categoria]/[slug]`.
* Canonical siempre debe apuntar a la nueva ruta con categoría.

---

# Requisitos SEO + descubribilidad para motores e IA

Cada entrada de blog publicada debe cumplir:

* `h1`, `metaDescription`, `categorySlug`, `slug`, `author`, `publishDate`, `featuredImage.alt`.
* `canonical` a `https://creamvp.com/blog/[categoria]/[slug]`.
* Open Graph y Twitter Card consistentes con canonical e imagen principal.
* JSON-LD `BlogPosting` obligatorio.
* JSON-LD `BreadcrumbList` obligatorio (`Inicio > Blog > Categoría > Artículo`).
* JSON-LD `FAQPage` cuando el post tenga FAQs.
* Inclusión automática en sitemap de todas las URLs publicadas.
* Noindex prohibido para posts `published` (salvo caso editorial explícito).

Para facilitar consumo por agentes de IA:

* HTML semántico limpio (`article`, `header`, `main`, `section`, `time`).
* Un único `h1` por post.
* Fecha de publicación y fecha de actualización visibles en markup.
* Enlaces internos a categoría y contenidos relacionados.
* Evitar contenido clave solo en JS cliente; contenido principal debe renderizarse en HTML estático.

---

# Administración CMS del Blog (tipo Webflow)

La pantalla de administración de entradas de blog debe permitir editar, como mínimo:

* H1
* metaDescription
* slug
* canonicalUrl
* shortDescription
* featuredImage
* category
* tags
* contentMarkdown
* author
* schemaAuto/schemaOverride
* faqs
* status editorial (`draft`, `scheduled`, `published`)

Comportamientos obligatorios:

* Guardado crea entradas como `draft` por defecto.
* Botones editoriales visibles: `Save Draft`, `Publish`, `Revert to Draft`.
* Validaciones antes de publicar: campos requeridos + slug/canonical válidos.
* Preview en `desktop/tablet/mobile` con token para contenido no publicado.

---

# Author

Campos:

```
name
slug
bio
photo
socialLinks
facebookUrl
instagramUrl
xUrl
tiktokUrl
linkedinUrl
personalUrl
```

---

# Tag / Category

Campos:

```
name
slug
description
seo
```

---

# Asset

Campos:

```
id
url
alt
widths[]
mimeType
generatedFormats
focalPoint
```

Formatos generados automáticamente:

```
webp
avif
```

---

# Requerimientos de edición (UX)

El CMS debe ofrecer una experiencia similar a **Webflow**.

---

# Editor visual

Para:

* landings
* páginas de servicio

Características:

* drag & drop de bloques
* reordenamiento de secciones
* edición inline

---

# Editor de artículos

Debe soportar:

* markdown
* rich text
* bloques

Bloques soportados:

```
code
embed
faq
cta
testimonial
gallery
```

---

# Vista previa

El sistema debe permitir:

```
desktop preview
tablet preview
mobile preview
```

y preview de contenido **no publicado** mediante token.

---

# Gestión de assets

Debe permitir:

* subida de imágenes
* generación automática de tamaños
* conversión a `webp` y `avif`
* metadata focal point

---

# Control editorial

Estados:

```
draft
scheduled
published
```

Workflows:

```
editor -> reviewer -> published
```

---

# Versionado

Se almacenará:

* historial de cambios
* rollback a versiones previas

---

# Roles

```
admin
editor
reviewer
developer
```

---

# API editorial (ingesta por IA + control de estado)

Se debe permitir creación y actualización de entradas de blog vía API para automatización (incluyendo agentes de IA).

Endpoints mínimos (implementados como Supabase Edge Functions):

```
POST   /functions/v1/cms-blog-create
PATCH  /functions/v1/cms-blog-update
PATCH  /functions/v1/cms-blog-status
```

Contrato esperado:

* `cms-blog-create` crea posts en estado `draft` siempre.
* `cms-blog-status` permite transición:

```
draft -> published
published -> draft
draft -> scheduled
scheduled -> published
```

* `cms-blog-update` permite actualizar campos editoriales sin publicar.
* Todas las operaciones deben validar esquema de entrada antes de escribir en DB.
* Todas las operaciones deben registrar `createdBy`, `updatedBy` y `updatedAt`.

Seguridad y gobernanza:

* Autenticación obligatoria para endpoints de escritura.
* `admin` y `editor` pueden crear/editar borradores.
* `admin` y `reviewer` pueden publicar/despublicar.
* Rate limit y logging para prevenir abuso de generación automática.
* Webhook de publicación dispara rebuild al pasar a `published`.

---

# Diagrama del layout CMS (referencia Webflow)

Objetivo: replicar la experiencia editorial observada en Webflow, manteniendo nuestra arquitectura `Astro + Supabase`.

---

## Vista 1: Gestión de colecciones (tabla de entradas)

```mermaid
flowchart LR
    TB[Topbar colección<br/>Search | Filter | Select | Export | + New Item]
    SB[Sidebar CMS<br/>Collections<br/>Pages | Services | Case Studies | Blog | Authors | Tags | Assets]
    LT[Listado central<br/>Name | Published | Status | Created | Modified]
    AC[Acciones<br/>Seleccionar | Cambiar estado | Abrir item]

    TB --> LT
    SB --> LT
    LT --> AC
```

**Estructura esperada:**

* Panel izquierdo fijo con colecciones y conteos.
* Panel principal con tabla filtrable y búsqueda rápida.
* Topbar con acciones globales de colección.
* Estados visibles por fila: `draft`, `scheduled`, `published`.

---

## Vista 2: Edición de entrada (form + contenido)

```mermaid
flowchart LR
    ET[Topbar editor<br/>Not published/Queued | Save draft | Publish now]
    ES[Sidebar de navegación<br/>Colecciones + lista de entradas]
    FM[Formulario principal<br/>Basic info | Slug | Relaciones | Imágenes | Body/Blocks]
    SD[Sección de publicación<br/>Featured | SEO indexing | Item ID | Archive/Delete/Duplicate]
    PV[Preview<br/>Desktop | Tablet | Mobile | Token preview]

    ES --> FM
    ET --> FM
    FM --> SD
    FM --> PV
```

**Bloques del editor (MVP):**

```
richText
features
testimonials
gallery
cta
faq
code
embed
```

---

## Layout objetivo (wireframe de alto nivel)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Topbar: Breadcrumb / Search / Filter / Status / Save draft / Publish now    │
├───────────────┬──────────────────────────────────────────────┬───────────────┤
│ Sidebar CMS   │ Panel principal                              │ Panel lateral │
│ Collections   │ - Tabla (vista lista)                        │ (contextual)  │
│ y navegación  │ - Formulario + bloques (vista edición)       │ SEO / Preview │
│ de entradas   │ - Gestión de assets y relaciones             │ y acciones    │
├───────────────┴──────────────────────────────────────────────┴───────────────┤
│ Barra inferior contextual: estado editorial, id, archive, duplicate, delete  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# Arquitectura técnica

## Stack principal

```
Frontend
Astro

Backend CMS
Supabase

Database
PostgreSQL (Supabase)

Assets
Supabase Storage

Auth
Supabase Auth

Preview API
Supabase Edge Functions

Hosting
Vercel
```

---

# Flujo de publicación

```
Editor modifica contenido
↓
Contenido guardado en Supabase
↓
Webhook dispara rebuild
↓
Astro rebuild
↓
Nuevo contenido publicado
```

Opcional:

```
Incremental Static Regeneration
```

---

# Roadmap MVP

## Fase 0 — Preparación

Duración estimada:

```
1 semana
```

Tareas:

* inventario de páginas actuales
* definición de bloques
* diseño de esquema CMS

---

## Fase 1 — Infraestructura CMS

Duración:

```
2–3 semanas
```

Tareas:

* crear tablas CMS en Supabase
* configurar storage
* roles editoriales
* APIs editoriales (`cms-blog-create`, `cms-blog-update`, `cms-blog-status`)
* políticas RLS y permisos por rol para creación/publicación

---

## Fase 2 — Integración Astro

Duración:

```
2–3 semanas
```

Tareas:

* adaptadores para consumir Supabase
* preview endpoints
* mapeo bloques → componentes

---

## Fase 3 — UX editor

Duración:

```
1–2 semanas
```

Tareas:

* interfaz de edición
* ordenamiento de bloques
* preview funcional

---

## Fase 4 — Migración

Duración:

```
1–2 semanas
```

Tareas:

* migrar landings
* migrar blog al CMS con rutas `/blog/[categoria]/[slug]`
* habilitar redirecciones `301` desde rutas legacy
* pruebas de publicación

---

# Tiempo estimado total

```
6–10 semanas
```

dependiendo de:

* complejidad de landings
* número de bloques
* recursos disponibles

---

# Plan de migración desde Markdown

---

## 1. Inventario

Listar todos los posts actuales.

```
src/content/blog
```

---

## 2. Mapping

Mapear:

```
frontmatter → schema CMS
slug legacy → (categorySlug + slug)
excerpt legacy → shortDescription
image legacy → featuredImage
```

---

## 3. Script de migración

Script que convierta:

```
markdown
frontmatter
```

a registros en Supabase.

---

## 4. Validación

Verificar:

* imágenes
* enlaces
* SEO metadata
* canonical en formato `/blog/[categoria]/[slug]`
* Schema JSON-LD (`BlogPosting`, `BreadcrumbList`, `FAQPage` cuando aplique)

---

## 5. Migración gradual

Migrar por:

```
categorías
años
bloques
```

---

## 6. Migración de rutas SEO

Implementar y validar:

* generación de nuevas rutas `/blog/[categoria]/[slug]`
* redirecciones `301` desde rutas legacy `/blog/[slug]`
* actualización de enlaces internos del sitio hacia nueva estructura
* regeneración de sitemap con nuevas URLs canónicas

---

# Criterios de aceptación (MVP)

El MVP será considerado completo cuando:

### Editor visual

* soporte al menos **5 bloques configurables**

---

### Preview funcional

* preview protegido por token
* desktop / mobile

---

### Integración Astro

* render correcto de bloques
* SEO metadata funcional

---

### Rutas y SEO del blog

* posts publicados disponibles en `/blog/[categoria]/[slug]`
* redirects `301` funcionales desde `/blog/[slug]`
* canonical correcto por entrada
* `BlogPosting` + `BreadcrumbList` válidos en JSON-LD
* URLs de blog indexadas en sitemap

---

### Administración CMS del blog

* formulario editorial incluye `h1`, `metaDescription`, `slug`, `canonicalUrl`, `shortDescription`, `featuredImage`, `category`, `tags`, `contentMarkdown`, `author`, `schemaAuto/schemaOverride`, `faqs`
* `status` inicial de toda entrada creada es `draft`
* transición `published -> draft` disponible desde panel editorial
* vista previa funcional antes de publicar

---

### API y automatización por IA

* endpoint de creación API genera entradas en `draft`
* endpoint de cambio de estado permite publicar y volver a draft
* validación de esquema obligatoria en endpoints de escritura
* endpoints protegidos con autenticación + permisos por rol

---

### Publicación

* webhooks funcionando
* rebuild automático

---

### Roles

* admin
* editor

funcionales.

---

# Riesgos

---

## Lock-in tecnológico

Mitigación:

* esquema documentado
* export de base de datos

---

## Desalineación CMS vs frontend

Mitigación:

* contrato de bloques
* tests visuales

---

## Impacto en SEO

Mitigación:

* QA SEO
* validación JSON-LD
* pruebas Lighthouse

---

# Costes operativos

Costes:

* desarrollo inicial
* operación Supabase
* almacenamiento de assets

Se recomienda comenzar con:

```
Supabase plan básico
```

y escalar según uso.

---

# Próximos pasos

### 1️⃣ Revisión interna

Validar propuesta.

---

### 2️⃣ Confirmar arquitectura

```
Astro + Supabase CMS
```

---

### 3️⃣ Crear Kanban técnico

Tareas por:

* backend
* frontend
* migración
* QA

---

### 4️⃣ Iniciar fase 0

Inventario de páginas y definición de bloques.
