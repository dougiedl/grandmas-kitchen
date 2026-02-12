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
