-- migration_01.sql
-- Initial CMS schema for CreaMVP blog-first implementation.
-- Includes base tables + core triggers.
-- Note: RLS policies are planned for a later migration.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'user_role'
      and n.nspname = 'public'
  ) then
    create type public.user_role as enum ('admin', 'editor', 'reviewer', 'developer');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'blog_post_status'
      and n.nspname = 'public'
  ) then
    create type public.blog_post_status as enum ('draft', 'scheduled', 'published');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'editor',
  full_name text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_is_active_idx on public.profiles(is_active);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    'editor'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  bio text,
  photo_url text,
  facebook_url text,
  instagram_url text,
  x_url text,
  tiktok_url text,
  linkedin_url text,
  personal_url text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists authors_slug_uq on public.authors(slug);
create index if not exists authors_is_active_idx on public.authors(is_active);

drop trigger if exists set_authors_updated_at on public.authors;
create trigger set_authors_updated_at
before update on public.authors
for each row
execute function public.set_updated_at();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  seo jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists categories_slug_uq on public.categories(slug);
create index if not exists categories_is_active_idx on public.categories(is_active);

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  seo jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists tags_slug_uq on public.tags(slug);
create index if not exists tags_is_active_idx on public.tags(is_active);

drop trigger if exists set_tags_updated_at on public.tags;
create trigger set_tags_updated_at
before update on public.tags
for each row
execute function public.set_updated_at();

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  status public.blog_post_status not null default 'draft',
  h1 text,
  meta_description text,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  canonical_url text,
  short_description text,
  featured_image_url text,
  featured_image_alt text,
  featured_image_metadata jsonb not null default '{}'::jsonb,
  publish_date timestamptz,
  scheduled_publish_at timestamptz,
  updated_date timestamptz,
  author_id uuid references public.authors(id) on delete set null,
  category_id uuid not null references public.categories(id) on delete restrict,
  category_slug text not null check (category_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  content_markdown text,
  schema_auto jsonb,
  schema_override jsonb,
  seo jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint blog_posts_publish_requirements_chk
    check (
      status <> 'published'
      or (
        h1 is not null and btrim(h1) <> ''
        and meta_description is not null and btrim(meta_description) <> ''
        and canonical_url is not null and btrim(canonical_url) <> ''
        and short_description is not null and btrim(short_description) <> ''
        and featured_image_url is not null and btrim(featured_image_url) <> ''
        and featured_image_alt is not null and btrim(featured_image_alt) <> ''
        and content_markdown is not null and btrim(content_markdown) <> ''
        and author_id is not null
        and category_id is not null
      )
    )
);

create unique index if not exists blog_posts_category_slug_slug_uq
  on public.blog_posts(category_slug, slug);
create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_publish_date_idx on public.blog_posts(publish_date desc);
create index if not exists blog_posts_category_slug_idx on public.blog_posts(category_slug);
create index if not exists blog_posts_author_id_idx on public.blog_posts(author_id);
create index if not exists blog_posts_category_id_idx on public.blog_posts(category_id);

create or replace function public.blog_posts_before_write()
returns trigger
language plpgsql
as $$
declare
  v_category_slug text;
begin
  select c.slug
  into v_category_slug
  from public.categories c
  where c.id = new.category_id;

  if v_category_slug is null then
    raise exception 'Invalid category_id % for blog post', new.category_id;
  end if;

  new.category_slug := v_category_slug;

  if new.canonical_url is null or btrim(new.canonical_url) = '' then
    new.canonical_url := format('https://creamvp.com/blog/%s/%s', new.category_slug, new.slug);
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT' and new.publish_date is null then
      new.publish_date := timezone('utc', now());
    elsif tg_op = 'UPDATE' and old.status is distinct from 'published' and new.publish_date is null then
      new.publish_date := timezone('utc', now());
    end if;
  end if;

  new.updated_date := timezone('utc', now());
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists blog_posts_before_write_trigger on public.blog_posts;
create trigger blog_posts_before_write_trigger
before insert or update on public.blog_posts
for each row
execute function public.blog_posts_before_write();

create table if not exists public.blog_post_tags (
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blog_post_id, tag_id)
);

create index if not exists blog_post_tags_tag_id_idx on public.blog_post_tags(tag_id);

create table if not exists public.blog_faqs (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  question text not null,
  answer text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (blog_post_id, position)
);

create index if not exists blog_faqs_blog_post_id_idx on public.blog_faqs(blog_post_id);

drop trigger if exists set_blog_faqs_updated_at on public.blog_faqs;
create trigger set_blog_faqs_updated_at
before update on public.blog_faqs
for each row
execute function public.set_updated_at();

create table if not exists public.blog_revisions (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  revision_number integer not null,
  status public.blog_post_status not null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  change_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (blog_post_id, revision_number)
);

create index if not exists blog_revisions_blog_post_id_idx on public.blog_revisions(blog_post_id);

create or replace function public.write_blog_revision()
returns trigger
language plpgsql
as $$
declare
  v_next_revision integer;
begin
  select coalesce(max(br.revision_number), 0) + 1
  into v_next_revision
  from public.blog_revisions br
  where br.blog_post_id = new.id;

  insert into public.blog_revisions (
    blog_post_id,
    revision_number,
    status,
    snapshot,
    changed_by,
    change_reason
  )
  values (
    new.id,
    v_next_revision,
    new.status,
    to_jsonb(new),
    new.updated_by,
    case when tg_op = 'INSERT' then 'initial_create' else 'post_update' end
  );

  return new;
end;
$$;

drop trigger if exists blog_posts_write_revision_trigger on public.blog_posts;
create trigger blog_posts_write_revision_trigger
after insert or update on public.blog_posts
for each row
execute function public.write_blog_revision();

commit;

