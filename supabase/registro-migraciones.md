# Registro de Migraciones Supabase

## Convencion

- Carpeta: `supabase/`
- Formato de nombre: `NN_nombre_claro.sql`
- Regla: no editar migraciones aplicadas; agregar una nueva incremental.

## Historial

| N | Archivo | Descripcion | Estado |
|---|---|---|---|
| 01 | `01_schema_inicial_cms.sql` | Esquema inicial CMS blog-first (tablas base + triggers iniciales) | Aplicada |
| 02 | `02_fix_search_path_funciones.sql` | Corrige `search_path` mutable en funciones trigger (`set_updated_at`, `blog_posts_before_write`, `write_blog_revision`) | Aplicada |
| 03 | `03_rls_politicas_editoriales.sql` | Habilita RLS CMS, define politicas por `profiles.role` y agrega `bootstrap_first_admin(uuid)` para alta controlada del primer admin | Aplicada |
| 04 | `04_cms_api_request_log.sql` | Crea tabla de auditoria para requests de edge functions CMS y soporte de rate limiting por usuario/endpoint | Aplicada |
