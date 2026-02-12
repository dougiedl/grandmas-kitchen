alter table if exists recipes
  add column if not exists is_promoted boolean not null default false;

create index if not exists idx_recipes_user_promoted_created
  on recipes (user_id, is_promoted, created_at desc);
