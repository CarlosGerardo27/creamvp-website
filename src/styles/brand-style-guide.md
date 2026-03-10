# Brand Style Guide (Tailwind)

## Paleta oficial

- `primary_blue`: `#507BFA`
- `accent_yellow`: `#F7C52D`
- `black`: `#000000`
- `white`: `#FFFFFF`
- `light_gray`: `#E2E2E2`
- `muted_gray`: `#6B7280`

## Reglas de uso

1. Usar esta paleta como base para todo componente nuevo.
2. Evitar colores hardcodeados repetidos en clases; preferir tokens de tema.
3. Mantener contraste legible en fondos oscuros (`black`) y claros (`white`).
4. En CMS, aplicar tema bajo alcance `.cms-theme` para no afectar el sitio publico.

## Referencia visual del sitio publico

- Base predominante: `bg-white` con tipografia en `gray/slate`.
- Tokens frecuentes detectados: `text-gray-600`, `text-gray-800`, `text-slate-500`, `text-slate-600`, `text-blue-400`, `bg-gray-100`.
- Regla: el CMS puede tener superficie oscura, pero debe mantener continuidad con esta base en tipografia, espaciado y contraste.

## Implementacion actual (CMS)

- Archivo de tema CMS: `src/styles/cms-theme.css`
- Integracion: `src/layouts/CmsLayout.astro`
- Estrategia: override de tokens Tailwind (`--color-slate-*`, `--color-cyan-*`) solo dentro de `.cms-theme`.
- Formularios CMS: `input/select/textarea` con fondo blanco, texto negro y placeholders grises para mejorar legibilidad editorial.

## Excepcion editorial

Se conservan los estilos actuales de botones de flujo editorial:

- `schedule`
- `publish`
- `eliminar`
- `generar preview`
- `revert to draft`
