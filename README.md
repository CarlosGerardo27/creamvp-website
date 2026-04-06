# CreaMVP Website

Sitio principal de CreaMVP, blog publico y CMS editorial con API para gestionar contenido.

## Que incluye este repositorio

- Sitio marketing en Astro para `https://creamvp.com`
- Blog publico con URLs SEO
- CMS editorial para blog, categorias, tags y autores
- API editorial para lectura, escritura, cambios de estado y previews
- Integracion con Supabase para auth, datos y Edge Functions

## Stack principal

- Astro
- Tailwind CSS
- Supabase
- Vercel
- Vitest
- Playwright
- Deno para tests de funciones

## Modulos principales

### Website

Paginas publicas de CreaMVP, landing, servicios, contacto, nosotros y blog.

### CMS

Panel operativo disponible en `/cms` con modulos para:

- blog
- categorias
- tags
- autores
- documentacion tecnica del API

### API

El proyecto cuenta con dos capas de API:

1. **Supabase Edge Functions** para el CMS editorial.
2. **Endpoint interno en Astro** para generar previews tokenizados.

#### Edge Functions disponibles

- `GET /cms-catalogs`
- `GET /cms-blog-post`
- `GET /cms-blog-posts`
- `POST /cms-blog-create`
- `PATCH /cms-blog-update`
- `PATCH /cms-blog-status`
- `DELETE /cms-blog-delete`

Estas rutas viven en [supabase/functions/README.md](./supabase/functions/README.md) y su documentacion operativa tambien esta expuesta dentro del proyecto en `/cms/documentation/api`.

#### Endpoint interno de preview

- `POST /api/cms/preview-token`

Este endpoint corre dentro de Astro, requiere autenticacion CMS y genera una URL temporal de preview para posts `draft` o `scheduled`.

## Estructura del proyecto

```text
.
|-- public/
|-- src/
|   |-- components/
|   |-- features/
|   |-- layouts/
|   |-- pages/
|   |   |-- api/
|   |   |-- blog/
|   |   `-- cms/
|   `-- styles/
|-- supabase/
|   |-- functions/
|   |-- 01_schema_inicial_cms.sql
|   |-- 02_fix_search_path_funciones.sql
|   |-- 03_rls_politicas_editoriales.sql
|   `-- 04_cms_api_request_log.sql
|-- tests/
`-- docs/
```

## Requisitos

- Node.js y npm
- Deno para `npm run test:api`
- Supabase CLI si vas a servir o desplegar Edge Functions localmente

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CMS_PREVIEW_TOKEN_SECRET=
```

Notas:

- `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` son necesarias para el sitio y el CMS.
- `SUPABASE_SERVICE_ROLE_KEY` y `CMS_PREVIEW_TOKEN_SECRET` son necesarias para el preview tokenizado y operaciones server-side.
- Las Edge Functions usan variables equivalentes del entorno de Supabase. Revisa [supabase/functions/README.md](./supabase/functions/README.md).

## Desarrollo local

### App web

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:4321`.

### CMS API docs

Con la app corriendo, la documentacion tecnica del API queda disponible en:

- `http://localhost:4321/cms/documentation/api`

### Edge Functions

Ejemplos de ejecucion local con Supabase CLI:

```bash
supabase functions serve cms-blog-create --env-file .env
supabase functions serve cms-blog-update --env-file .env
supabase functions serve cms-blog-status --env-file .env
supabase functions serve cms-blog-delete --env-file .env
supabase functions serve cms-catalogs --env-file .env
supabase functions serve cms-blog-post --env-file .env
supabase functions serve cms-blog-posts --env-file .env
```

## Base de datos y migraciones

El proyecto incluye SQL para levantar la base del CMS y sus politicas:

- `supabase/01_schema_inicial_cms.sql`
- `supabase/02_fix_search_path_funciones.sql`
- `supabase/03_rls_politicas_editoriales.sql`
- `supabase/04_cms_api_request_log.sql`

La migracion `04_cms_api_request_log.sql` soporta logging y rate limit del API editorial.

## Scripts principales

```bash
npm run dev
npm run build
npm run preview
npm run test:unit
npm run test:e2e
npm run test:api
npm run cms:migrate:blog
npm run cms:migrate:blog:apply
```

## Testing

- `npm run test:unit`: pruebas unitarias con Vitest
- `npm run test:e2e`: pruebas end-to-end con Playwright
- `npm run test:api`: pruebas de funciones con Deno

## Despliegue

- Sitio y app Astro: Vercel
- Auth, base de datos y Edge Functions: Supabase

Para desplegar funciones:

```bash
supabase functions deploy cms-blog-create
supabase functions deploy cms-blog-update
supabase functions deploy cms-blog-status
supabase functions deploy cms-blog-delete
supabase functions deploy cms-catalogs
supabase functions deploy cms-blog-post
supabase functions deploy cms-blog-posts
```

## URLs utiles

- Produccion: `https://creamvp.com`
- CMS: `https://creamvp.com/cms`
- API docs: `https://creamvp.com/cms/documentation/api`

