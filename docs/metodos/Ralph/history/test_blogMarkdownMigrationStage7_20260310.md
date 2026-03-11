# test_blogMarkdownMigrationStage7_20260310

## Objetivo

Evidencia de pruebas/validaciones para cierre de Etapa 7 (migracion real Markdown -> CMS).

## Archivos/areas cubiertas

- `scripts/migrate-markdown-blog-to-cms.mjs` (flujo apply real)
- `src/features/cms/migration/domain/markdown-blog-migration.mjs` (mapper ya cubierto por unit tests)
- `src/pages/blog/preview/[id].astro` (validacion runtime en produccion con token)
- `src/pages/blog/[categoria]/[slug].astro` (validacion runtime en produccion de URL publicada)

## Comandos ejecutados

1. `npm run cms:migrate:blog:apply`
- Resultado: OK
- Salida clave: 1 post creado, 1 categoria creada, 1 autor creado, 4 tags creados.

2. Query de verificacion DB (service role)
- Resultado: OK
- Post validado:
  - `category_slug`: `automatizacion`
  - `slug`: `automatiza-tu-negocio-multiplicar-resultados`
  - `status`: `published`
  - `tagsCount`: `4`
  - `faqsCount`: `3`

3. `npm run test:unit`
- Resultado: OK
- Suite: 6 files, 25 tests en verde.

4. `npm run build`
- Resultado: OK

5. Validacion HTTP produccion
- Preview tokenizado: `GET /blog/preview/<draft-id>?pt=<token>` -> `200`
- Publicado: `GET /blog/automatizacion/automatiza-tu-negocio-multiplicar-resultados` -> `200`

## Edge cases cubiertos

- Ejecucion `--apply` sin `CMS_MIGRATION_PASSWORD` usando fallback seguro de `SUPABASE_SERVICE_ROLE_KEY` + actor editorial.
- Preview token firmado con `CMS_PREVIEW_TOKEN_SECRET` contra post en `draft`.
- Publicacion visible en ruta final SEO `blog/[categoria]/[slug]`.