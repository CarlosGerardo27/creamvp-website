# cmsEditorialActionsByStatus_20260310

- Estado final: completado
- Tier: B
- Fecha de cierre: 2026-03-10 20:36 (-06:00)
- Request del usuario:

> otro detalle, para evitar confuciones vamos a hacer qque las acciones disponibles se muestren en funcion del estado actual del contenido del cms ... Tambien deberiamos de tener una opcion para cambiar la fecha de publicacion ...

## Resumen del objetivo

Se ajusto el editor de blog del CMS para que las acciones visibles dependan del estado editorial actual, se agrego flujo explicito de `Publicar cambios` para contenido publicado y se habilito fecha de publicacion editable.

## Iteraciones ejecutadas

1. `cmsEditorialActionsByStatus_20260310_1` (exploration)
- Se verifico que `update` no permite editar contenido en `published`.
- Se identifico que `cms-blog-status` no admitia campo dedicado para `publish_date`.

2. `cmsEditorialActionsByStatus_20260310_2` (planning)
- Plan de UI por estado (`new`, `draft`, `scheduled`, `published`).
- Plan de API para soportar `publishDate` en `cms-blog-status`.
- Plan de pruebas unitarias (UI) y API (Deno).

3. `cmsEditorialActionsByStatus_20260310_3` (execution)
- UI blog editor:
  - Botones visibles por estado editorial.
  - Boton `Publicar cambios` para posts en `published`.
  - Input `Fecha de publicacion (opcional)`.
- Flujo `Publicar cambios`:
  - `published -> draft` (status endpoint)
  - `update` de patch + tags + faqs
  - `draft -> published` (status endpoint, con `publishDate` opcional)
- API `cms-blog-status`:
  - Nuevo campo `publishDate` (validacion + persistencia + logging).

## Validacion ejecutada

- `npm run test:unit` -> 6 files, 28 tests en verde.
- `npm run test:api` -> 19 tests Deno en verde.
- `npm run astro -- check` -> 0 errors, 0 warnings (12 hints no bloqueantes).
- `npm run build` -> build completo en verde.

## Evidencia de tests

- Ver: `docs/metodos/Ralph/history/test_cmsEditorialActionsByStatus_20260310.md`

## Archivos impactados

- `src/components/cms/BlogEditorPanel.astro`
- `src/features/cms/blog/domain/types.ts`
- `src/features/cms/blog/ui/blog-editor-page.ts`
- `src/features/cms/blog/ui/blog-editor-page.test.ts`
- `supabase/functions/cms-blog-status/validators/status-blog-validator.ts`
- `supabase/functions/cms-blog-status/services/status-blog-service.ts`
- `supabase/functions/cms-blog-status/repositories/status-blog-repository.ts`
- `supabase/functions/cms-blog-status/handlers/status-blog-handler.ts`
- `supabase/functions/cms-blog-status/__tests__/status-blog-service.test.ts`
- `docs/metodos/Ralph/Ralph_WIP.json`

