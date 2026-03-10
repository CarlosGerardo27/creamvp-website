-- 02_fix_search_path_funciones.sql
-- Fix Supabase linter warning: function_search_path_mutable
-- Scope: existing trigger functions created in 01_schema_inicial_cms.sql

begin;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'write_blog_revision'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute 'alter function public.write_blog_revision() set search_path = public';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'set_updated_at'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute 'alter function public.set_updated_at() set search_path = public';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'blog_posts_before_write'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute 'alter function public.blog_posts_before_write() set search_path = public';
  end if;
end
$$;

commit;
