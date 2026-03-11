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

## [2026-03-10 20:05] - Cierre de blockers Etapa 8 (astro check legacy + release readiness)

**Objetivo completado:** `stage8ReleaseBlockers_20260310`

**Request del usuario:**

> si procede con lo siguiente Abrir nuevo objetivo Ralph para cerrar blockers de Etapa 8 (astro check legacy + release readiness).

### Cambios realizados

- `src/pages/about.astro`: simplificado a redirect limpio `301` hacia `/nosotros`.
- `src/pages/contact.astro`: simplificado a redirect limpio `301` hacia `/contacto`.
- `src/components/BlogShare.astro`: guard de `EventTarget` a `Node` para click-outside estable.
- `src/components/ReadingProgress.astro`: tipado DOM seguro con `querySelector<HTMLElement>`.
- `src/components/navbar/navbar.astro`: tipado explicito de menu items y `badge` opcional.
- `src/layouts/Layout.astro`: correccion de `openGraph.article.authors` para contrato `astro-seo`.
- `tsconfig.json`: exclusion de artefactos de build/test para checks estables.
- `docs/roadmap/ruta-implementacion-cms.md`: Etapa 8 marcada como completada y sin blockers.
- `docs/metodos/Ralph/history/stage8ReleaseBlockers_20260310.md`: auditoria completa del objetivo.
- `docs/metodos/Ralph/history/test_stage8ReleaseBlockers_20260310.md`: evidencia de quality gates.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_stage8ReleaseBlockers_20260310.md`

### Historial

- `docs/metodos/Ralph/history/stage8ReleaseBlockers_20260310.md`

## [2026-03-10 20:18] - Fix UX de tags en editor CMS (multidropdown + actualizar tags)

**Objetivo completado:** `cmsTagMultidropdownFix_20260310`

**Request del usuario:**

> sntes de eso hay que hacer un casmbio en el cms para creacion de blogs , este campo debe tener un multidropdown y tener un boton para actualizar los tags , el usuario debe poder elegir y quitar tags ligados al blog , en el estado actual no esta dejando elegir o remover lo tags a voluntad de forma correcta

### Cambios realizados

- `src/components/cms/BlogEditorPanel.astro`: reemplazo del `select multiple` por multidropdown de tags con checkboxes, buscador, chips removibles y boton `Actualizar tags`.
- `src/features/cms/blog/ui/blog-editor-page.ts`: nueva gestion de estado de tags seleccionados, sincronizacion UI/select hidden, soporte de fallback para tags fuera de catalogo activo y accion explicita para persistir tags.
- `src/features/cms/blog/ui/blog-editor-page.test.ts`: nuevo test para seleccionar/remover/actualizar tags en modo edicion.
- `docs/metodos/Ralph/history/cmsTagMultidropdownFix_20260310.md`: auditoria completa del objetivo.
- `docs/metodos/Ralph/history/test_cmsTagMultidropdownFix_20260310.md`: evidencia de pruebas.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_cmsTagMultidropdownFix_20260310.md`

### Historial

- `docs/metodos/Ralph/history/cmsTagMultidropdownFix_20260310.md`

## [2026-03-10 20:45] - Acciones editoriales por estado + fecha de publicacion editable

**Objetivo completado:** `cmsEditorialActionsByStatus_20260310`

**Request del usuario:**

> otro detalle, para evitar confuciones vamos a hacer qque las acciones disponibles se muestren en funcion del estado actual del contenido del cms... Tambien deberiamos de tener una opcion para cambiar la fecha de publicacion...

### Cambios realizados

- `src/components/cms/BlogEditorPanel.astro`: nuevo campo `Fecha de publicacion (opcional)` y boton `Publicar cambios`.
- `src/features/cms/blog/domain/types.ts`: contrato de status extendido con `publishDate`.
- `src/features/cms/blog/ui/blog-editor-page.ts`: visibilidad de acciones por estado (`new/draft/scheduled/published`) y flujo `Publicar cambios`.
- `src/features/cms/blog/ui/blog-editor-page.test.ts`: nuevos casos para visibilidad y flujo de publicacion de cambios.
- `supabase/functions/cms-blog-status/validators/status-blog-validator.ts`: validacion de `publishDate` (solo para `published`).
- `supabase/functions/cms-blog-status/services/status-blog-service.ts`: propagacion de `publishDate`.
- `supabase/functions/cms-blog-status/repositories/status-blog-repository.ts`: persistencia de `publish_date` custom.
- `supabase/functions/cms-blog-status/handlers/status-blog-handler.ts`: logging de request actualizado con `publishDate`.
- `supabase/functions/cms-blog-status/__tests__/status-blog-service.test.ts`: prueba de publish con fecha custom.
- `docs/roadmap/ruta-implementacion-cms.md`: checklist de Etapa 4.3 actualizado con acciones por estado, `Publicar cambios` y fecha de publicacion editable.
- `docs/metodos/Ralph/history/cmsEditorialActionsByStatus_20260310.md`: auditoria del objetivo.
- `docs/metodos/Ralph/history/test_cmsEditorialActionsByStatus_20260310.md`: evidencia de pruebas.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_cmsEditorialActionsByStatus_20260310.md`

### Historial

- `docs/metodos/Ralph/history/cmsEditorialActionsByStatus_20260310.md`

## [2026-03-10 21:01] - UX de autores alineada a blog (listado + editor dedicado)

**Objetivo completado:** `cmsAuthorsUxListEditorFlow_20260310`

**Request del usuario:**

> La seccion de autores no tiene la misma experiencia de usuario que blog... primero listado y luego pagina de edicion al hacer click en editar.

### Cambios realizados

- `src/pages/cms/authors/index.astro`: nueva vista de listado central de autores con busqueda/filtro y menu de acciones.
- `src/pages/cms/authors/new.astro`: nueva vista dedicada para creacion de autores.
- `src/pages/cms/authors/[id].astro`: nueva ruta dinamica para edicion por ID (SSR on-demand).
- `src/pages/cms/authors.astro`: eliminado (flujo legacy de formulario+listado en una sola pantalla).
- `src/components/cms/AuthorEditorPanel.astro`: nuevo panel de editor reutilizable para create/edit.
- `src/features/cms/taxonomy/ui/taxonomy-page.ts`: nuevos inicializadores `initAuthorsListPage` y `initAuthorEditorPage`.
- `src/features/cms/taxonomy/data/taxonomy-repository.ts`: agregado `getAuthorById`.
- `src/features/cms/taxonomy/ui/taxonomy-page.test.ts`: nueva suite unitaria para listado/editor de autores.
- `docs/roadmap/ruta-implementacion-cms.md`: etapa 4.1 actualizada con rutas nuevas de autores.
- `docs/metodos/Ralph/history/cmsAuthorsUxListEditorFlow_20260310.md`: auditoria del objetivo.
- `docs/metodos/Ralph/history/test_cmsAuthorsUxListEditorFlow_20260310.md`: evidencia de pruebas.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_cmsAuthorsUxListEditorFlow_20260310.md`

### Historial

- `docs/metodos/Ralph/history/cmsAuthorsUxListEditorFlow_20260310.md`

## [2026-03-10 21:15] - Nueva documentacion tecnica API CMS en /cms/documentation/api

**Objetivo completado:** `cmsApiDocumentationPage_20260310`

**Request del usuario:**

> Crear `http://localhost:4321/cms/documentation/api` con documentacion detallada de endpoints, campos y parametros para uso por developers.

### Cambios realizados

- `src/pages/cms/documentation/api.astro`: nueva pagina de documentacion API CMS con contratos reales de create/update/status/delete y preview token.
- `src/pages/cms/index.astro`: acceso directo a `API Docs` en el dashboard CMS.
- `docs/metodos/Ralph/history/cmsApiDocumentationPage_20260310.md`: auditoria del objetivo.
- `docs/metodos/Ralph/history/test_cmsApiDocumentationPage_20260310.md`: evidencia de validaciones.

### Tests

- Evidencia: `docs/metodos/Ralph/history/test_cmsApiDocumentationPage_20260310.md`

### Historial

- `docs/metodos/Ralph/history/cmsApiDocumentationPage_20260310.md`
