-- 03_rls_politicas_editoriales.sql
-- Objetivo: habilitar RLS para tablas CMS y permisos editoriales por role.
-- Alcance: policies para lectura/escritura + bootstrap controlado del primer admin.

begin;

create or replace function public.current_profile_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1;
$$;

create or replace function public.has_cms_role(required_roles public.user_role[])
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  if auth.uid() is null then
    return false;
  end if;

  v_role := public.current_profile_role();
  if v_role is null then
    return false;
  end if;

  return v_role = any(required_roles);
end;
$$;

create or replace function public.bootstrap_first_admin(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_admin_count integer;
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
  ) then
    raise exception 'Profile % does not exist', target_user_id;
  end if;

  select count(*)
  into v_existing_admin_count
  from public.profiles p
  where p.role = 'admin'
    and p.is_active = true
    and p.id <> target_user_id;

  if v_existing_admin_count > 0 then
    return false;
  end if;

  update public.profiles
  set role = 'admin',
      is_active = true,
      updated_at = timezone('utc', now())
  where id = target_user_id;

  return true;
end;
$$;

revoke all on function public.bootstrap_first_admin(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_first_admin(uuid) to service_role;

alter table if exists public.profiles enable row level security;
alter table if exists public.authors enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.tags enable row level security;
alter table if exists public.blog_posts enable row level security;
alter table if exists public.blog_post_tags enable row level security;
alter table if exists public.blog_faqs enable row level security;
alter table if exists public.blog_revisions enable row level security;

-- profiles

drop policy if exists profiles_select_self_or_editorial on public.profiles;
create policy profiles_select_self_or_editorial
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.has_cms_role(array['admin','editor','reviewer','developer']::public.user_role[])
);

drop policy if exists profiles_update_admin_only on public.profiles;
create policy profiles_update_admin_only
on public.profiles
for update
to authenticated
using (public.has_cms_role(array['admin']::public.user_role[]))
with check (public.has_cms_role(array['admin']::public.user_role[]));

-- authors

drop policy if exists authors_select_active_or_editorial on public.authors;
create policy authors_select_active_or_editorial
on public.authors
for select
to anon, authenticated
using (
  is_active = true
  or public.has_cms_role(array['admin','editor','reviewer','developer']::public.user_role[])
);

drop policy if exists authors_insert_editorial on public.authors;
create policy authors_insert_editorial
on public.authors
for insert
to authenticated
with check (public.has_cms_role(array['admin','editor']::public.user_role[]));

drop policy if exists authors_update_editorial on public.authors;
create policy authors_update_editorial
on public.authors
for update
to authenticated
using (public.has_cms_role(array['admin','editor']::public.user_role[]))
with check (public.has_cms_role(array['admin','editor']::public.user_role[]));

drop policy if exists authors_delete_admin on public.authors;
create policy authors_delete_admin
on public.authors
for delete
to authenticated
using (public.has_cms_role(array['admin']::public.user_role[]));

-- categories

drop policy if exists categories_select_active_or_editorial on public.categories;
create policy categories_select_active_or_editorial
on public.categories
for select
to anon, authenticated
using (
  is_active = true
  or public.has_cms_role(array['admin','editor','reviewer','developer']::public.user_role[])
);

drop policy if exists categories_insert_editorial on public.categories;
create policy categories_insert_editorial
on public.categories
for insert
to authenticated
with check (public.has_cms_role(array['admin','editor']::public.user_role[]));

drop policy if exists categories_update_editorial on public.categories;
create policy categories_update_editorial
on public.categories
for update
to authenticated
using (public.has_cms_role(array['admin','editor']::public.user_role[]))
with check (public.has_cms_role(array['admin','editor']::public.user_role[]));

drop policy if exists categories_delete_admin on public.categories;
create policy categories_delete_admin
on public.categories
for delete
to authenticated
using (public.has_cms_role(array['admin']::public.user_role[]));

-- tags

drop policy if exists tags_select_active_or_editorial on public.tags;
create policy tags_select_active_or_editorial
on public.tags
for select
to anon, authenticated
using (
  is_active = true
  or public.has_cms_role(array['admin','editor','reviewer','developer']::public.user_role[])
);

drop policy if exists tags_insert_editorial on public.tags;
create policy tags_insert_editorial
on public.tags
for insert
to authenticated
with check (public.has_cms_role(array['admin','editor']::public.user_role[]));

drop policy if exists tags_update_editorial on public.tags;
create policy tags_update_editorial
on public.tags
for update
to authenticated
using (public.has_cms_role(array['admin','editor']::public.user_role[]))
with check (public.has_cms_role(array['admin','editor']::public.user_role[]));

drop policy if exists tags_delete_admin on public.tags;
create policy tags_delete_admin
on public.tags
for delete
to authenticated
using (public.has_cms_role(array['admin']::public.user_role[]));

-- blog_posts

drop policy if exists blog_posts_select_published_or_editorial on public.blog_posts;
create policy blog_posts_select_published_or_editorial
on public.blog_posts
for select
to anon, authenticated
using (
  status = 'published'
  or public.has_cms_role(array['admin','editor','reviewer','developer']::public.user_role[])
);

drop policy if exists blog_posts_insert_editorial_draft on public.blog_posts;
create policy blog_posts_insert_editorial_draft
on public.blog_posts
for insert
to authenticated
with check (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and status = 'draft'
);

drop policy if exists blog_posts_update_editorial_draft_or_scheduled on public.blog_posts;
create policy blog_posts_update_editorial_draft_or_scheduled
on public.blog_posts
for update
to authenticated
using (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and status in ('draft', 'scheduled')
)
with check (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and status in ('draft', 'scheduled')
);

drop policy if exists blog_posts_update_reviewer_publish_flow on public.blog_posts;
create policy blog_posts_update_reviewer_publish_flow
on public.blog_posts
for update
to authenticated
using (public.has_cms_role(array['admin','reviewer']::public.user_role[]))
with check (
  public.has_cms_role(array['admin','reviewer']::public.user_role[])
  and status in ('draft', 'scheduled', 'published')
);

drop policy if exists blog_posts_delete_admin on public.blog_posts;
create policy blog_posts_delete_admin
on public.blog_posts
for delete
to authenticated
using (public.has_cms_role(array['admin']::public.user_role[]));

-- blog_post_tags

drop policy if exists blog_post_tags_select_by_post_visibility on public.blog_post_tags;
create policy blog_post_tags_select_by_post_visibility
on public.blog_post_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_post_tags.blog_post_id
      and (
        bp.status = 'published'
        or public.has_cms_role(array['admin','editor','reviewer','developer']::public.user_role[])
      )
  )
);

drop policy if exists blog_post_tags_insert_editorial on public.blog_post_tags;
create policy blog_post_tags_insert_editorial
on public.blog_post_tags
for insert
to authenticated
with check (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_post_tags.blog_post_id
      and bp.status in ('draft', 'scheduled')
  )
);

drop policy if exists blog_post_tags_update_editorial on public.blog_post_tags;
create policy blog_post_tags_update_editorial
on public.blog_post_tags
for update
to authenticated
using (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_post_tags.blog_post_id
      and bp.status in ('draft', 'scheduled')
  )
)
with check (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_post_tags.blog_post_id
      and bp.status in ('draft', 'scheduled')
  )
);

drop policy if exists blog_post_tags_delete_editorial on public.blog_post_tags;
create policy blog_post_tags_delete_editorial
on public.blog_post_tags
for delete
to authenticated
using (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_post_tags.blog_post_id
      and bp.status in ('draft', 'scheduled')
  )
);

-- blog_faqs

drop policy if exists blog_faqs_select_by_post_visibility on public.blog_faqs;
create policy blog_faqs_select_by_post_visibility
on public.blog_faqs
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_faqs.blog_post_id
      and (
        bp.status = 'published'
        or public.has_cms_role(array['admin','editor','reviewer','developer']::public.user_role[])
      )
  )
);

drop policy if exists blog_faqs_insert_editorial on public.blog_faqs;
create policy blog_faqs_insert_editorial
on public.blog_faqs
for insert
to authenticated
with check (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_faqs.blog_post_id
      and bp.status in ('draft', 'scheduled')
  )
);

drop policy if exists blog_faqs_update_editorial on public.blog_faqs;
create policy blog_faqs_update_editorial
on public.blog_faqs
for update
to authenticated
using (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_faqs.blog_post_id
      and bp.status in ('draft', 'scheduled')
  )
)
with check (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_faqs.blog_post_id
      and bp.status in ('draft', 'scheduled')
  )
);

drop policy if exists blog_faqs_delete_editorial on public.blog_faqs;
create policy blog_faqs_delete_editorial
on public.blog_faqs
for delete
to authenticated
using (
  public.has_cms_role(array['admin','editor']::public.user_role[])
  and exists (
    select 1
    from public.blog_posts bp
    where bp.id = blog_faqs.blog_post_id
      and bp.status in ('draft', 'scheduled')
  )
);

-- blog_revisions

drop policy if exists blog_revisions_select_editorial on public.blog_revisions;
create policy blog_revisions_select_editorial
on public.blog_revisions
for select
to authenticated
using (public.has_cms_role(array['admin','editor','reviewer','developer']::public.user_role[]));

drop policy if exists blog_revisions_insert_editorial_trigger on public.blog_revisions;
create policy blog_revisions_insert_editorial_trigger
on public.blog_revisions
for insert
to authenticated
with check (public.has_cms_role(array['admin','editor','reviewer']::public.user_role[]));

drop policy if exists blog_revisions_delete_admin on public.blog_revisions;
create policy blog_revisions_delete_admin
on public.blog_revisions
for delete
to authenticated
using (public.has_cms_role(array['admin']::public.user_role[]));

commit;
