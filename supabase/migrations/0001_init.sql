-- ============================================================================
-- Fitness Recipe Community App — Initial Schema
-- ============================================================================
-- How to use this file:
-- 1. Open your Supabase project → SQL Editor → New query.
-- 2. Paste the ENTIRE content of this file.
-- 3. Click "Run".
-- It is safe to re-run: every statement uses "if not exists" / "or replace"
-- where possible, but re-running will NOT wipe existing data.
-- ============================================================================

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- One row per registered user. Mirrors auth.users (managed by Supabase Auth).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public user profile, one row per auth.users row.';

-- Username must be short, lowercase-ish, no spaces (enforced loosely here,
-- the app also validates on the client for a friendlier error message).
alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format check (username ~ '^[a-z0-9_.]{3,30}$');

-- Automatically create a profile row whenever a new auth user signs up.
-- The username is taken from the "username" field passed during sign up
-- (supabase.auth.signUp({ options: { data: { username } } })).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES
-- Simple lookup table so categories can be managed/extended later.
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 3. RECIPES
-- ----------------------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,

  title text not null check (char_length(title) between 2 and 100),
  description text check (char_length(description) <= 2000),
  tags text[] not null default '{}',

  main_image_url text not null,
  additional_image_urls text[] not null default '{}',
  video_url text,

  -- ingredients: [{ "amount": 100, "unit": "g", "name": "Reis" }, ...]
  ingredients jsonb not null default '[]',
  -- steps: [{ "order": 1, "text": "Reis kochen." }, ...]
  steps jsonb not null default '[]',

  calories int check (calories >= 0),
  protein_g numeric check (protein_g >= 0),
  carbohydrates_g numeric check (carbohydrates_g >= 0),
  fat_g numeric check (fat_g >= 0),
  fiber_g numeric check (fiber_g >= 0),

  servings int not null default 1 check (servings between 1 and 50),
  prep_time_minutes int check (prep_time_minutes >= 0),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),

  like_count int not null default 0,
  comment_count int not null default 0,

  -- 'published' = visible in feeds, 'removed' = hidden (moderation / admin)
  status text not null default 'published' check (status in ('published', 'removed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_author_id_idx on public.recipes (author_id);
create index if not exists recipes_category_id_idx on public.recipes (category_id);
create index if not exists recipes_created_at_idx on public.recipes (created_at desc);
create index if not exists recipes_like_count_idx on public.recipes (like_count desc);
create index if not exists recipes_tags_idx on public.recipes using gin (tags);
create index if not exists recipes_title_trgm_idx on public.recipes using gin (to_tsvector('simple', title));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. LIKES
-- ----------------------------------------------------------------------------
create table if not exists public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists likes_recipe_id_idx on public.likes (recipe_id);

create or replace function public.handle_like_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.recipes set like_count = like_count + 1 where id = new.recipe_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.recipes set like_count = greatest(like_count - 1, 0) where id = old.recipe_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_after_insert on public.likes;
create trigger likes_after_insert
  after insert on public.likes
  for each row execute procedure public.handle_like_change();

drop trigger if exists likes_after_delete on public.likes;
create trigger likes_after_delete
  after delete on public.likes
  for each row execute procedure public.handle_like_change();

-- ----------------------------------------------------------------------------
-- 5. SAVED RECIPES ("Gespeichert")
-- ----------------------------------------------------------------------------
create table if not exists public.saved_recipes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists saved_recipes_user_id_idx on public.saved_recipes (user_id);

-- ----------------------------------------------------------------------------
-- 6. COMMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  status text not null default 'visible' check (status in ('visible', 'removed')),
  created_at timestamptz not null default now()
);

create index if not exists comments_recipe_id_idx on public.comments (recipe_id, created_at desc);

create or replace function public.handle_comment_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.recipes set comment_count = comment_count + 1 where id = new.recipe_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.recipes set comment_count = greatest(comment_count - 1, 0) where id = old.recipe_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_after_insert on public.comments;
create trigger comments_after_insert
  after insert on public.comments
  for each row execute procedure public.handle_comment_change();

drop trigger if exists comments_after_delete on public.comments;
create trigger comments_after_delete
  after delete on public.comments
  for each row execute procedure public.handle_comment_change();

-- ----------------------------------------------------------------------------
-- 7. REPORTS (Meldungen) — prepared for a future admin panel
-- ----------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid references public.recipes (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reason text not null check (reason in ('spam', 'inappropriate', 'misinformation', 'offensive', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz not null default now(),
  constraint reports_target_check check (
    (recipe_id is not null and comment_id is null) or
    (recipe_id is null and comment_id is not null)
  )
);

create index if not exists reports_status_idx on public.reports (status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.recipes enable row level security;
alter table public.likes enable row level security;
alter table public.saved_recipes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES: readable by everyone, editable only by the owner.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- CATEGORIES: readable by everyone. Writes reserved for admins (future admin UI).
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- RECIPES: published recipes are public. Authors always see their own
-- (including removed ones). Only the author may insert/update/delete.
drop policy if exists "Published recipes are viewable by everyone" on public.recipes;
create policy "Published recipes are viewable by everyone"
  on public.recipes for select
  using (status = 'published' or author_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can create recipes" on public.recipes;
create policy "Authenticated users can create recipes"
  on public.recipes for insert
  with check (auth.uid() = author_id);

drop policy if exists "Authors can update their own recipes" on public.recipes;
create policy "Authors can update their own recipes"
  on public.recipes for update
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

drop policy if exists "Authors can delete their own recipes" on public.recipes;
create policy "Authors can delete their own recipes"
  on public.recipes for delete
  using (auth.uid() = author_id or public.is_admin());

-- LIKES: everyone can see like rows (needed to know if the current user
-- liked a recipe), but a user can only create/delete their own like.
drop policy if exists "Likes are viewable by everyone" on public.likes;
create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

drop policy if exists "Users can like recipes" on public.likes;
create policy "Users can like recipes"
  on public.likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unlike their own like" on public.likes;
create policy "Users can unlike their own like"
  on public.likes for delete
  using (auth.uid() = user_id);

-- SAVED RECIPES: fully private to the owner.
drop policy if exists "Users see their own saved recipes" on public.saved_recipes;
create policy "Users see their own saved recipes"
  on public.saved_recipes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can save recipes" on public.saved_recipes;
create policy "Users can save recipes"
  on public.saved_recipes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unsave their own saved recipe" on public.saved_recipes;
create policy "Users can unsave their own saved recipe"
  on public.saved_recipes for delete
  using (auth.uid() = user_id);

-- COMMENTS: visible comments are public. Author (or admin) may delete.
drop policy if exists "Visible comments are viewable by everyone" on public.comments;
create policy "Visible comments are viewable by everyone"
  on public.comments for select
  using (status = 'visible' or user_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can comment" on public.comments;
create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id or public.is_admin());

-- REPORTS: a user can create reports and see their own; admins see all.
drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users see their own reports, admins see all" on public.reports;
create policy "Users see their own reports, admins see all"
  on public.reports for select
  using (auth.uid() = reporter_id or public.is_admin());

drop policy if exists "Admins update reports" on public.reports;
create policy "Admins update reports"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- STORAGE BUCKETS (images, videos, avatars)
-- ============================================================================
-- Files are stored under a folder named after the uploading user's id, e.g.
-- "recipe-images/<user_id>/<filename>". This lets us allow public read
-- access while only letting a user write/delete inside their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-videos', 'recipe-videos', true, 104857600, array['video/mp4', 'video/quicktime'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Public read access for app media" on storage.objects;
create policy "Public read access for app media"
  on storage.objects for select
  using (bucket_id in ('recipe-images', 'recipe-videos', 'avatars'));

drop policy if exists "Users upload into their own folder" on storage.objects;
create policy "Users upload into their own folder"
  on storage.objects for insert
  with check (
    bucket_id in ('recipe-images', 'recipe-videos', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users manage their own files" on storage.objects;
create policy "Users manage their own files"
  on storage.objects for update
  using (
    bucket_id in ('recipe-images', 'recipe-videos', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete their own files" on storage.objects;
create policy "Users delete their own files"
  on storage.objects for delete
  using (
    bucket_id in ('recipe-images', 'recipe-videos', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
