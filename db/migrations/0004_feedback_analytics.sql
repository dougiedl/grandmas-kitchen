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
