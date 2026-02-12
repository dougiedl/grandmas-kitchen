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
  is_promoted boolean not null default false,
  recipe_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_recipes_user_created
  on recipes (user_id, created_at desc);

create index if not exists idx_recipes_user_favorite_created
  on recipes (user_id, is_favorite, created_at desc);

create index if not exists idx_recipes_user_promoted_created
  on recipes (user_id, is_promoted, created_at desc);

create table if not exists recipe_feedback (
  id uuid primary key,
  recipe_id uuid not null references recipes(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_recipe_feedback_recipe_created
  on recipe_feedback (recipe_id, created_at desc);

create index if not exists idx_recipe_feedback_category_created
  on recipe_feedback (category, created_at desc);

create table if not exists analytics_events (
  id uuid primary key,
  user_id uuid references users(id) on delete set null,
  event_name text not null,
  event_props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_name_created
  on analytics_events (event_name, created_at desc);

create index if not exists idx_analytics_events_user_created
  on analytics_events (user_id, created_at desc);

create table if not exists eval_prompt_cases (
  id uuid primary key,
  slug text not null unique,
  cuisine text not null,
  persona_name text not null,
  prompt text not null,
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists eval_runs (
  id uuid primary key,
  started_by_user_id uuid references users(id) on delete set null,
  model_name text,
  total_cases int not null,
  completed_cases int not null default 0,
  avg_total_score numeric(5,2),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_eval_runs_started_at
  on eval_runs (started_at desc);

create table if not exists eval_results (
  id uuid primary key,
  run_id uuid not null references eval_runs(id) on delete cascade,
  case_id uuid not null references eval_prompt_cases(id) on delete cascade,
  total_score numeric(5,2) not null,
  realism_score numeric(5,2) not null,
  structure_score numeric(5,2) not null,
  grandma_score numeric(5,2) not null,
  speed_alignment_score numeric(5,2) not null,
  notes text,
  output_recipe_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (run_id, case_id)
);

create index if not exists idx_eval_results_run_score
  on eval_results (run_id, total_score desc);

create table if not exists user_taste_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  last_persona_id text,
  last_cuisine text,
  last_regional_style text,
  total_generations int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists user_preference_signals (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  thread_id uuid references conversation_threads(id) on delete set null,
  cuisine text not null,
  signal_key text not null,
  signal_label text not null,
  confidence numeric(4,2) not null,
  source text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_preference_signals_user_cuisine_created
  on user_preference_signals (user_id, cuisine, created_at desc);

create index if not exists idx_user_preference_signals_user_signal
  on user_preference_signals (user_id, signal_key, created_at desc);

create table if not exists knowledge_embedding_cache (
  key text primary key,
  model text not null,
  text_value text not null,
  embedding jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_embedding_cache_model_updated
  on knowledge_embedding_cache (model, updated_at desc);
