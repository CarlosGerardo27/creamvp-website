# Contratos API Editorial CMS (Etapa 3)

Endpoints implementados como Supabase Edge Functions:

- `POST /functions/v1/cms-blog-create`
- `PATCH /functions/v1/cms-blog-update`
- `PATCH /functions/v1/cms-blog-status`
- `DELETE /functions/v1/cms-blog-delete`

Todas las rutas:

- Requieren `Authorization: Bearer <jwt>`
- Responden JSON con formato:

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "endpoint": "cms-blog-create"
  }
}
```

Errores:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje legible",
    "details": {}
  }
}
```

## 1) POST `/functions/v1/cms-blog-create`

Rol permitido:

- `admin`
- `editor`

Regla:

- Siempre crea en `draft` (ignora cualquier `status` en payload).

Payload minimo:

```json
{
  "slug": "como-automatizar-reportes",
  "categoryId": "uuid"
}
```

Payload extendido:

```json
{
  "slug": "como-automatizar-reportes",
  "categoryId": "uuid",
  "h1": "Como automatizar reportes",
  "metaDescription": "Guia paso a paso...",
  "canonicalUrl": "https://creamvp.com/blog/automatizacion/como-automatizar-reportes",
  "shortDescription": "Resumen breve para listados",
  "featuredImage": {
    "url": "https://.../imagen.webp",
    "alt": "Panel de analitica",
    "metadata": { "width": 1600, "height": 900 }
  },
  "authorId": "uuid",
  "contentMarkdown": "# Titulo\nContenido...",
  "schemaOverride": {},
  "seo": {},
  "tags": ["uuid", "uuid"],
  "faqs": [
    { "question": "Que es?", "answer": "..." }
  ]
}
```

## 2) PATCH `/functions/v1/cms-blog-update`

Rol permitido:

- `admin`
- `editor`

Regla:

- No permite cambio de `status` (usar endpoint de status).
- Pensado para editar campos editoriales en `draft`/`scheduled`.

Payload:

```json
{
  "postId": "uuid",
  "patch": {
    "h1": "Nuevo H1",
    "metaDescription": "Nuevo meta",
    "slug": "nuevo-slug",
    "categoryId": "uuid",
    "featuredImage": {
      "url": "https://.../new.webp",
      "alt": "Imagen nueva"
    },
    "contentMarkdown": "## Actualizacion"
  },
  "tags": ["uuid"],
  "faqs": [
    { "question": "Actualizado?", "answer": "Si" }
  ]
}
```

## 3) PATCH `/functions/v1/cms-blog-status`

Transiciones permitidas:

- `draft -> published`
- `published -> draft`
- `draft -> scheduled`
- `scheduled -> published`

Permisos por transicion:

- `draft -> scheduled`: `admin`, `editor`
- `scheduled -> published`: `admin`, `reviewer`
- `draft -> published`: `admin`, `reviewer`
- `published -> draft`: `admin`, `reviewer`

Payload:

```json
{
  "postId": "uuid",
  "status": "scheduled",
  "scheduledPublishAt": "2026-03-15T10:00:00.000Z",
  "changeReason": "Programado para campana de lanzamiento"
}
```

## 4) DELETE `/functions/v1/cms-blog-delete`

Rol permitido:

- `admin`

Regla:

- Elimina permanentemente el post y sus relaciones (`blog_post_tags`, `blog_faqs`, `blog_revisions`) por cascada FK.

Payload:

```json
{
  "postId": "uuid",
  "changeReason": "Depuracion editorial"
}
```

## Rate limit y logging

- Se registra cada request en `public.cms_api_request_log`.
- Rate limiting por `usuario + endpoint`:
  - `cms-blog-create`: 30 req / 60s
  - `cms-blog-update`: 60 req / 60s
  - `cms-blog-status`: 30 req / 60s
  - `cms-blog-delete`: 10 req / 60s

Migracion requerida:

- `supabase/04_cms_api_request_log.sql`

