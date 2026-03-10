# Evidencia de pruebas - cmsDynamicPreviewUiTesting_20260310

## Archivos de test creados/actualizados

- `src/features/cms/blog/domain/validators.test.ts`
- `src/features/cms/preview/domain/preview-token.test.ts`
- `tests/ui/cms-auth.spec.ts`

## Cobertura funcional

- `validators.test.ts`: validaciones de slug, campos obligatorios, parseo JSON y parseo de fecha opcional.
- `preview-token.test.ts`: emision y verificacion de token HMAC, validacion de postId y expiracion.
- `cms-auth.spec.ts` (Playwright): render de `/cms/login` y redireccion a login cuando se visita ruta protegida `/cms/blog/[id]` sin sesion.

## Comandos ejecutados y resultado

1. `npm run build`
   - Resultado: OK
2. `npm run test:unit`
   - Resultado: OK (9 tests pass)
3. `npm run test:e2e`
   - Resultado: OK (2 tests pass)
4. `npm run astro -- check`
   - Resultado: FAIL por errores legacy fuera del alcance CMS (paginas/componentes no relacionados con esta etapa).

## Edge cases cubiertos

- Token preview invalido por firma incorrecta.
- Token preview expirado.
- Token preview para post diferente al solicitado.
- Ruta CMS protegida sin sesion activa.
- Parseo de fecha sin depender de zona horaria local.
