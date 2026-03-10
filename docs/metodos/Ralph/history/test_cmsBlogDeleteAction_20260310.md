# Evidencia de pruebas - cmsBlogDeleteAction_20260310

## Archivos de test creados/actualizados

- `supabase/functions/cms-blog-delete/__tests__/delete-blog-validator.test.ts`
- `src/features/cms/blog/domain/validators.test.ts` (sin cambios funcionales, se mantiene en verde)
- `tests/ui/cms-auth.spec.ts` (regresion UI base, se mantiene en verde)

## Cobertura funcional

- Validador de delete (`postId`, `changeReason`) para nueva edge function `cms-blog-delete`.
- Regresion de suite web (Vitest + Playwright) para confirmar que los cambios no rompen UI CMS existente.

## Comandos ejecutados y resultado

1. `npm run build`
   - Resultado: OK
2. `npm run test:unit`
   - Resultado: OK
3. `npm run test:e2e`
   - Resultado: OK
4. `deno test supabase/functions/cms-blog-delete/__tests__/delete-blog-validator.test.ts`
   - Resultado: OK (2 tests pass)

## Edge cases cubiertos

- Payload delete con UUID invalido (rechazo 400).
- Payload minimo valido sin `changeReason`.
- Validacion de regresion UI en rutas protegidas CMS.
