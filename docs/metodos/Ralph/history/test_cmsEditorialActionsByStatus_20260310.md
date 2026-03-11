# Test Evidence - cmsEditorialActionsByStatus_20260310

- Fecha: 2026-03-10
- Objetivo: ajustar acciones editoriales por estado y soportar fecha de publicacion editable en CMS blog

## Archivos de test creados/actualizados

- `src/features/cms/blog/ui/blog-editor-page.test.ts`
  - Cobertura de visibilidad de acciones por estado y flujo `Publicar cambios` sobre post publicado.
- `supabase/functions/cms-blog-status/__tests__/status-blog-service.test.ts`
  - Cobertura de persistencia de `publishDate` custom al publicar.

## Comandos ejecutados y resultado

1. `npm run test:unit`
- Resultado: OK
- Resumen: 6 test files, 28 tests passed

2. `npm run test:api`
- Resultado: OK
- Resumen: 19 tests passed, 0 failed

3. `npm run astro -- check`
- Resultado: OK
- Resumen: 0 errors, 0 warnings, 12 hints no bloqueantes

4. `npm run build`
- Resultado: OK
- Resumen: build server/client completado en verde

## Edge cases cubiertos

- Acciones visibles correctas por estado (`draft`, `scheduled`, `published`).
- Flujo `Publicar cambios`: `published -> draft -> update -> published`.
- `publishDate` aceptado solo cuando el destino es `published`.
- Persistencia de `publish_date` custom al publicar desde endpoint editorial.
