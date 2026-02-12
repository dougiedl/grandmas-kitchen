create table if not exists users (
  id uuid primary key,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  dietary_flags text[] not null default '{}',
  allergens text[] not null default '{}',
  dislikes text[] not null default '{}',
  spice_level text not null default 'medium',
  household_size int not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists grandma_personas (
  id text primary key,
  name text not null,
  cuisine text not null,
  style_summary text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists conversation_threads (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  persona_id text references grandma_personas(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_threads_user_created
  on conversation_threads (user_id, created_at desc);

create table if not exists messages (
  id uuid primary key,
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  parsed_entities jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_thread_created
  on messages (thread_id, created_at asc);

create table if not exists recipes (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  thread_id uuid references conversation_threads(id) on delete set null,
  title text not null,
  cuisine text,
  servings int,
  total_minutes int,
  is_favorite boolean not null default false,
  recipe_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_recipes_user_created
  on recipes (user_id, created_at desc);

create index if not exists idx_recipes_user_favorite_created
  on recipes (user_id, is_favorite, created_at desc);
