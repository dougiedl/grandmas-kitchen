create table if not exists knowledge_embedding_cache (
  key text primary key,
  model text not null,
  text_value text not null,
  embedding jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_embedding_cache_model_updated
  on knowledge_embedding_cache (model, updated_at desc);
