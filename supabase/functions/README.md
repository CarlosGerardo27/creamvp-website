# Supabase Edge Functions (CMS)

Funciones implementadas:

- `cms-blog-create`
- `cms-blog-update`
- `cms-blog-status`
- `cms-blog-delete`
- `cms-catalogs`
- `cms-blog-post`
- `cms-blog-posts`

Convención de arquitectura:

- `index.ts` solo entrypoint.
- `handlers/` para request-response.
- `services/` para reglas de negocio.
- `validators/` para contrato de payload.
- `repositories/` para acceso a datos.
- `_shared/` para módulos comunes (`auth`, `http`, `logger`, `rate-limit`, etc.).

## Variables de entorno requeridas

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (recomendado para logging/rate-limit)

## Dependencia de base de datos

Para logging/rate-limit, aplicar migración:

- `supabase/04_cms_api_request_log.sql`

## Deploy sugerido

```bash
supabase functions deploy cms-blog-create
supabase functions deploy cms-blog-update
supabase functions deploy cms-blog-status
supabase functions deploy cms-blog-delete
supabase functions deploy cms-catalogs
supabase functions deploy cms-blog-post
supabase functions deploy cms-blog-posts
```

Prueba local (si usas Supabase CLI):

```bash
supabase functions serve cms-blog-create --env-file .env
supabase functions serve cms-blog-update --env-file .env
supabase functions serve cms-blog-status --env-file .env
supabase functions serve cms-blog-delete --env-file .env
supabase functions serve cms-catalogs --env-file .env
supabase functions serve cms-blog-post --env-file .env
supabase functions serve cms-blog-posts --env-file .env
```
