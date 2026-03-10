-- 04_cms_api_request_log.sql
-- Objetivo: habilitar logging de requests CMS API para trazabilidad y rate limiting.
-- Alcance: tabla de auditoria para edge functions editoriales de blog.

begin;

create table if not exists public.cms_api_request_log (
  id bigserial primary key,
  request_id uuid not null default gen_random_uuid(),
  endpoint text not null,
  method text not null,
  action text,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role public.user_role,
  status_code integer not null,
  request_meta jsonb not null default '{}'::jsonb,
  response_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists cms_api_request_log_endpoint_idx
  on public.cms_api_request_log(endpoint);

create index if not exists cms_api_request_log_user_id_idx
  on public.cms_api_request_log(user_id);

create index if not exists cms_api_request_log_created_at_idx
  on public.cms_api_request_log(created_at desc);

create unique index if not exists cms_api_request_log_request_id_uq
  on public.cms_api_request_log(request_id);

alter table if exists public.cms_api_request_log enable row level security;

drop policy if exists cms_api_request_log_admin_read on public.cms_api_request_log;
create policy cms_api_request_log_admin_read
on public.cms_api_request_log
for select
to authenticated
using (public.has_cms_role(array['admin']::public.user_role[]));

commit;

