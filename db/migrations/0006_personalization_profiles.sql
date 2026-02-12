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
