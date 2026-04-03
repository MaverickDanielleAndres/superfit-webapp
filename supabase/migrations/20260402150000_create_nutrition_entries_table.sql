create table if not exists public.nutrition_entries (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    logged_at timestamptz not null default now(),
    meal_slot text not null default 'breakfast',
    quantity numeric not null default 1,
    food_item_id text not null,
    food_item jsonb not null,
    notes text
);

create index if not exists idx_nutrition_entries_user_id on public.nutrition_entries(user_id);
create index if not exists idx_nutrition_entries_logged_at on public.nutrition_entries(logged_at desc);
create index if not exists idx_nutrition_entries_user_logged_at on public.nutrition_entries(user_id, logged_at desc);

alter table public.nutrition_entries enable row level security;

drop policy if exists "Users can read own nutrition entries" on public.nutrition_entries;
create policy "Users can read own nutrition entries"
on public.nutrition_entries
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own nutrition entries" on public.nutrition_entries;
create policy "Users can insert own nutrition entries"
on public.nutrition_entries
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own nutrition entries" on public.nutrition_entries;
create policy "Users can update own nutrition entries"
on public.nutrition_entries
for update
using (auth.uid() = user_id);

drop policy if exists "Users can delete own nutrition entries" on public.nutrition_entries;
create policy "Users can delete own nutrition entries"
on public.nutrition_entries
for delete
using (auth.uid() = user_id);
