-- =============================================================================
-- FormaSpace AI - Supabase PostgreSQL Schema & Row Level Security (RLS)
-- =============================================================================

create extension if not exists "uuid-ossp";

-- 1. Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  plan_id text not null default 'starter',
  credits integer not null default 15,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Subscription Plans (admin configurable)
create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  monthly_price numeric(10, 2) not null default 0,
  annual_price numeric(10, 2) not null default 0,
  credits_per_month integer not null default 15,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 3. Design Categories (admin configurable)
create table if not exists public.design_categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  group_name text not null default 'Interior',
  description text not null default '',
  cover_image text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0
);

-- 4. Project Folders
create table if not exists public.project_folders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default '#172B3A',
  created_at timestamptz not null default now()
);

-- 5. Projects
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  folder_id uuid references public.project_folders(id) on delete set null,
  title text not null,
  category text not null default 'Living Room',
  style text not null default 'Modern Luxury',
  cover_image text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. AI Designs & History
create table if not exists public.designs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  feature_type text not null,
  category text not null,
  room_type text not null,
  style text not null,
  intervention_level text not null default 'Medium',
  prompt text not null default '',
  settings jsonb not null default '{}'::jsonb,
  original_image_url text not null,
  generated_image_url text not null,
  variations jsonb not null default '[]'::jsonb,
  detected_objects jsonb not null default '[]'::jsonb,
  credits_used integer not null default 1,
  is_saved boolean not null default false,
  is_demo_mode boolean not null default true,
  provider text not null default 'demo',
  created_at timestamptz not null default now()
);

-- 7. Floor Plans
create table if not exists public.floor_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  source_plan_url text not null,
  furnished_2d_url text not null,
  render_3d_url text not null,
  layout_style text not null,
  furniture_arrangement text not null,
  rooms jsonb not null default '[]'::jsonb,
  is_demo_mode boolean not null default true,
  created_at timestamptz not null default now()
);

-- 8. Video Walkthrough Projects
create table if not exists public.video_projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  source_image_url text not null,
  camera_movement text not null,
  duration_seconds integer not null default 6,
  angles jsonb not null default '[]'::jsonb,
  status text not null default 'preview_ready',
  video_url text,
  requires_external_provider boolean not null default true,
  created_at timestamptz not null default now()
);

-- 9. Saved Furniture Collection
create table if not exists public.furniture_collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  design_id uuid references public.designs(id) on delete set null,
  product_id text not null,
  product_name text not null,
  category text not null,
  material text not null,
  approx_price numeric(10, 2) not null,
  image_url text not null,
  product_url text not null,
  is_demo_product boolean not null default true,
  created_at timestamptz not null default now()
);

-- 10. Renovation Budget Estimates
create table if not exists public.budget_estimates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  inputs jsonb not null,
  breakdown jsonb not null,
  estimated_total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- 11. Credit Transactions
create table if not exists public.credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- 12. Newsletter & Error Logs
create table if not exists public.newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.error_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  endpoint text not null,
  error_message text not null,
  severity text not null default 'error',
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security (Per-User Isolation)
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.project_folders enable row level security;
alter table public.projects enable row level security;
alter table public.designs enable row level security;
alter table public.floor_plans enable row level security;
alter table public.video_projects enable row level security;
alter table public.furniture_collections enable row level security;
alter table public.budget_estimates enable row level security;
alter table public.credit_transactions enable row level security;

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users manage own folders" on public.project_folders for all using (auth.uid() = user_id);
create policy "Users manage own projects" on public.projects for all using (auth.uid() = user_id);
create policy "Users manage own designs" on public.designs for all using (auth.uid() = user_id);
create policy "Users manage own floor_plans" on public.floor_plans for all using (auth.uid() = user_id);
create policy "Users manage own video_projects" on public.video_projects for all using (auth.uid() = user_id);
create policy "Users manage own furniture_collections" on public.furniture_collections for all using (auth.uid() = user_id);
create policy "Users manage own budget_estimates" on public.budget_estimates for all using (auth.uid() = user_id);
create policy "Users view own credit_transactions" on public.credit_transactions for select using (auth.uid() = user_id);

