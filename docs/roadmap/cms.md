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

Campos:

```
draft (boolean)
title
snippet
image
publishDate
author
category
tags[]
faqs[]
content
seo
```

El campo `content` será compatible con:

```
markdown
rich blocks
```

---

# Author

Campos:

```
name
slug
bio
photo
socialLinks[]
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
* APIs

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
* mantener blog en Markdown inicialmente
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

---

## 5. Migración gradual

Migrar por:

```
categorías
años
bloques
```

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
