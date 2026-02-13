create table if not exists style_catalog (
  id text primary key,
  cuisine text not null,
  region text,
  label text not null,
  aliases text[] not null default '{}',
  voice_profile jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_style_catalog_cuisine_active
  on style_catalog (cuisine, active);

create table if not exists thread_style_state (
  thread_id uuid primary key references conversation_threads(id) on delete cascade,
  inferred_style_id text references style_catalog(id) on delete set null,
  selected_style_id text references style_catalog(id) on delete set null,
  confidence numeric(4,2),
  reasoning_tags text[] not null default '{}',
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_thread_style_state_selected
  on thread_style_state (selected_style_id, updated_at desc);

create table if not exists user_style_preferences (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  style_id text not null references style_catalog(id) on delete cascade,
  weight numeric(6,2) not null default 0,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_style_pref_user_weight
  on user_style_preferences (user_id, weight desc, created_at desc);

create index if not exists idx_user_style_pref_style_created
  on user_style_preferences (style_id, created_at desc);

create table if not exists style_inference_events (
  id uuid primary key,
  user_id uuid references users(id) on delete set null,
  thread_id uuid references conversation_threads(id) on delete set null,
  input_excerpt text,
  inferred_style_id text references style_catalog(id) on delete set null,
  selected_style_id text references style_catalog(id) on delete set null,
  confidence numeric(4,2),
  accepted boolean,
  event_props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_style_inference_events_created
  on style_inference_events (created_at desc);

create index if not exists idx_style_inference_events_user_created
  on style_inference_events (user_id, created_at desc);
