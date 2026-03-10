# Tests - cmsPublicBlogRoutesAndSeoParity_20260310

## Objetivo

Evidencia de validacion para rutas publicas de blog por categoria, redirect legacy y paridad SEO/UX del detalle.

## Archivos de test

- `tests/ui/blog-routes.spec.ts` (nuevo)
- `tests/ui/cms-auth.spec.ts` (existente, ejecutado para regresion)

## Comandos ejecutados

1. `npm run build` -> OK
2. `npm run test:e2e` -> OK (6 tests)

## Casos cubiertos

- `/blog` listado general con links canonicos por categoria.
- `/blog/[categoria]` listado filtrado por categoria.
- `/blog/[categoria]/[slug]` detalle con elementos editoriales clave.
- redirect legacy de `/blog/[slug]` hacia ruta canonica.

## Resultado

- Sin regresiones en auth CMS.
- Rutas publicas nuevas y redirect legacy funcionando.
