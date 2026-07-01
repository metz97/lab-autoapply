-- AutoApply lab — run in Supabase SQL editor or via CLI after 001–003 listing migrations.

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists autoapply_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  linkedin_url text,
  current_title text,
  years_experience int check (years_experience is null or years_experience >= 0),
  resume_url text,
  default_answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table autoapply_profiles enable row level security;

create policy "autoapply_profiles_select_own"
  on autoapply_profiles for select
  using (auth.uid () = user_id);

create policy "autoapply_profiles_insert_own"
  on autoapply_profiles for insert
  with check (auth.uid () = user_id);

create policy "autoapply_profiles_update_own"
  on autoapply_profiles for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "autoapply_profiles_delete_own"
  on autoapply_profiles for delete
  using (auth.uid () = user_id);

-- ---------------------------------------------------------------------------
-- API tokens (extension auth; store hash only)
-- ---------------------------------------------------------------------------
create table if not exists autoapply_tokens (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null,
  name text not null default 'Extension',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists autoapply_tokens_token_hash_idx on autoapply_tokens (token_hash);

create index if not exists autoapply_tokens_user_id_idx on autoapply_tokens (user_id);

alter table autoapply_tokens enable row level security;

create policy "autoapply_tokens_select_own"
  on autoapply_tokens for select
  using (auth.uid () = user_id);

create policy "autoapply_tokens_insert_own"
  on autoapply_tokens for insert
  with check (auth.uid () = user_id);

create policy "autoapply_tokens_update_own"
  on autoapply_tokens for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "autoapply_tokens_delete_own"
  on autoapply_tokens for delete
  using (auth.uid () = user_id);

-- ---------------------------------------------------------------------------
-- Applications (dashboard + extension sync)
-- ---------------------------------------------------------------------------
create table if not exists autoapply_applications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'linkedin',
  external_job_id text,
  job_title text not null,
  company text not null,
  location text,
  job_url text,
  status text not null check (
    status in (
      'queued',
      'applied',
      'failed',
      'needs_review',
      'skipped'
    )
  ),
  error_message text,
  applied_at timestamptz,
  screening_answers jsonb,
  created_at timestamptz not null default now()
);

create index if not exists autoapply_applications_user_created_idx
  on autoapply_applications (user_id, created_at desc);

create index if not exists autoapply_applications_user_status_idx
  on autoapply_applications (user_id, status);

alter table autoapply_applications enable row level security;

create policy "autoapply_applications_select_own"
  on autoapply_applications for select
  using (auth.uid () = user_id);

create policy "autoapply_applications_insert_own"
  on autoapply_applications for insert
  with check (auth.uid () = user_id);

create policy "autoapply_applications_update_own"
  on autoapply_applications for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "autoapply_applications_delete_own"
  on autoapply_applications for delete
  using (auth.uid () = user_id);
