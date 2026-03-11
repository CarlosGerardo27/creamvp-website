# cmsTagMultidropdownFix_20260310

- Estado final: completado
- Tier: B
- Fecha de cierre: 2026-03-10 20:18 (-06:00)
- Request del usuario:

> sntes de eso hay que hacer un casmbio en el cms para creacion de blogs , este campo debe tener un multidropdown y tener un boton para actualizar los tags , el usuario debe poder elegir y quitar tags ligados al blog , en el estado actual no esta dejando elegir o remover lo tags a voluntad de forma correcta

## Resumen del objetivo

Corregir la UX del campo de tags en el editor CMS de blog para permitir seleccionar y remover tags sin depender del `select multiple` nativo, y agregar una accion explicita para persistir cambios de tags en modo edicion.

## Iteraciones ejecutadas

1. `cmsTagMultidropdownFix_20260310_1` (exploration)
- Se identifico que el bloqueo de UX venia del `<select multiple>` nativo.
- Se reviso el contrato de `cms-blog-update`: requiere `patch` no vacio para cualquier update.

2. `cmsTagMultidropdownFix_20260310_2` (planning)
- Se definio estrategia de multidropdown con checkboxes, chips removibles y busqueda.
- Se definio boton `Actualizar tags` con `patch` minimo (`slug`) para cumplir contrato del endpoint.

3. `cmsTagMultidropdownFix_20260310_3` (execution)
- Se actualizo `BlogEditorPanel.astro` con:
  - boton toggle de tags
  - dropdown con buscador y lista de checkboxes
  - chips de seleccion actual con boton `Quitar`
  - boton `Actualizar tags`
  - `select` hidden para compatibilidad interna
- Se actualizo `blog-editor-page.ts` con:
  - estado interno de tags seleccionados
  - sincronizacion UI <-> select hidden
  - soporte para tags fuera de catalogo activo (fallback por ID)
  - evento de persistencia `Actualizar tags`
- Se actualizo `blog-editor-page.test.ts` con caso nuevo de seleccionar/remover/actualizar tags.

## Validacion ejecutada

- `npm run test:unit` -> 6 archivos, 26 tests en verde.
- `npm run astro -- check` -> 0 errors, 0 warnings (12 hints no bloqueantes).
- `npm run build` -> build completo en verde.

## Evidencia de tests

- Ver `docs/metodos/Ralph/history/test_cmsTagMultidropdownFix_20260310.md`

## Archivos impactados

- `src/components/cms/BlogEditorPanel.astro`
- `src/features/cms/blog/ui/blog-editor-page.ts`
- `src/features/cms/blog/ui/blog-editor-page.test.ts`
- `docs/metodos/Ralph/Ralph_WIP.json`

