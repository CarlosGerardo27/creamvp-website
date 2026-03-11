## [2026-03-10 12:05] - Ajuste de paleta CMS y gobernanza de estilos

**Objetivo completado:** `cmsPaletteAndStyleGovernance_20260310`

**Request del usuario:**

> Ajustar colores CMS a paleta oficial, documentar reglas de estilo en agentrules y en src/styles.

### Cambios realizados

- `src/styles/cms-theme.css`: tokens de paleta CMS y reglas de inputs en fondo blanco/texto negro/placeholder gris.
- `src/layouts/CmsLayout.astro`: integracion de tema CMS scopeado con `.cms-theme`.
- `docs/metodos/agentrules.json`: nueva gobernanza de estilos (`style_rules`) y baseline visual publico.
- `src/styles/brand-style-guide.md`: documentacion de paleta, baseline y estrategia de tema.
- `docs/metodos/Ralph/history/cmsPaletteAndStyleGovernance_20260310.md`: auditoria del objetivo.
- `docs/metodos/Ralph/history/test_cmsPaletteAndStyleGovernance_20260310.md`: evidencia de pruebas.
- `docs/metodos/Ralph/Ralph_WIP.json`: reset tras archivado.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_cmsPaletteAndStyleGovernance_20260310.md`

### Historial

- `docs/metodos/Ralph/history/cmsPaletteAndStyleGovernance_20260310.md`

## [2026-03-10 12:45] - Rutas publicas de blog por categoria y redirect legacy

**Objetivo completado:** `cmsPublicBlogRoutesAndSeoParity_20260310`

**Request del usuario:**

> Continuar ruta de implementacion CMS manteniendo estilo del blog actual y estructura publica `/blog`, `/blog/[categoria]`, `/blog/[categoria]/[slug]`.

### Cambios realizados

- `src/features/public-blog/domain/types.ts`: nuevos tipos para contenido publico de blog.
- `src/features/public-blog/data/public-blog-repository.ts`: adapter unificado CMS published + fallback markdown.
- `src/pages/blog.astro`: listado general actualizado con links canonicos por categoria.
- `src/pages/blog/[categoria].astro`: nuevo listado por categoria.
- `src/pages/blog/[categoria]/[slug].astro`: nuevo detalle canonico con layout editorial (brief, tags, FAQ, reading progress, share).
- `src/pages/blog/[slug].astro`: redirect legacy 301 al path canonico.
- `tests/ui/blog-routes.spec.ts`: suite e2e para rutas publicas y redirect.
- `docs/roadmap/ruta-implementacion-cms.md`: checks de etapa 5 y e2e de rutas publicas marcados.
- `docs/metodos/Ralph/history/cmsPublicBlogRoutesAndSeoParity_20260310.md`: historial del objetivo.
- `docs/metodos/Ralph/history/test_cmsPublicBlogRoutesAndSeoParity_20260310.md`: evidencia de pruebas.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_cmsPublicBlogRoutesAndSeoParity_20260310.md`

### Historial

- `docs/metodos/Ralph/history/cmsPublicBlogRoutesAndSeoParity_20260310.md`

## [2026-03-10 13:26] - Etapa 6 completada: CMS de autores + autor publico

**Objetivo completado:** `cmsAuthorsStage6AndQa_20260310`

**Request del usuario:**

> continua con las etapas siguientes

### Cambios realizados

- `src/features/cms/taxonomy/domain/types.ts`: contrato de autor ampliado con bio y redes sociales.
- `src/features/cms/taxonomy/data/taxonomy-repository.ts`: soporte de `updateAuthor` y `deleteAuthor`, junto con persistencia completa de campos sociales.
- `src/features/cms/taxonomy/ui/taxonomy-page.ts`: CRUD de autores en UI con menu de acciones, modo edicion y validacion de `photo` obligatoria.
- `src/pages/cms/authors.astro`: formulario de autores ampliado con campos sociales + tabla con acciones.
- `src/features/public-blog/domain/types.ts`: `PublicBlogPost` ahora incluye objeto `author` enriquecido.
- `src/features/public-blog/data/public-blog-mappers.ts`: nuevo modulo de mapeos y contratos para autor/tags/canonical.
- `src/features/public-blog/data/public-blog-repository.ts`: consulta y mapeo de autor CMS enriquecido con fallback seguro.
- `src/pages/blog/[categoria]/[slug].astro`: nueva seccion `Sobre el autor` con foto/iniciales, bio y links sociales.
- `src/features/public-blog/data/public-blog-repository.test.ts`: pruebas unitarias de mapeo para autor y tags.
- `tests/ui/blog-routes.spec.ts`: validacion E2E del bloque de autor en detalle de blog.
- `docs/roadmap/ruta-implementacion-cms.md`: Etapa 6 marcada como completada.
- `docs/metodos/Ralph/history/cmsAuthorsStage6AndQa_20260310.md`: auditoria del objetivo.
- `docs/metodos/Ralph/history/test_cmsAuthorsStage6AndQa_20260310.md`: evidencia de pruebas.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_cmsAuthorsStage6AndQa_20260310.md`

### Historial

- `docs/metodos/Ralph/history/cmsAuthorsStage6AndQa_20260310.md`

## [2026-03-10 20:00] - Etapa 7 completada: migracion real Markdown -> CMS + validacion preview/publicacion

**Objetivo completado:** `blogMarkdownMigrationStage7_20260310`

**Request del usuario:**

> Si procede con lo siguiente , recuerda seguir apegandote a [Ralph_loop.json](docs/metodos/Ralph/Ralph_loop.json)

### Cambios realizados

- `scripts/migrate-markdown-blog-to-cms.mjs`: soporte de fallback con `SUPABASE_SERVICE_ROLE_KEY` y `--actor-user-id` para ejecutar `--apply` sin password editorial en entorno local.
- `docs/roadmap/ruta-implementacion-cms.md`: Etapa 7 marcada como completada, evidencias de migracion real y validacion productiva agregadas.
- `docs/metodos/Ralph/history/blogMarkdownMigrationStage7_20260310.md`: auditoria completa del objetivo.
- `docs/metodos/Ralph/history/test_blogMarkdownMigrationStage7_20260310.md`: evidencia de pruebas y validaciones.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_blogMarkdownMigrationStage7_20260310.md`

### Historial

- `docs/metodos/Ralph/history/blogMarkdownMigrationStage7_20260310.md`
