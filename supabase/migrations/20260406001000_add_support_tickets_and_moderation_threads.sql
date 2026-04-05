-- Description: Add support ticket system for client/coach/admin messaging and status workflows
-- Author: Copilot
-- Date: 2026-04-06

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  requester_role text not null check (requester_role in ('user', 'coach')),
  subject text not null,
  category text not null default 'general',
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  admin_assignee_id uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_requester_idx
  on public.support_tickets (requester_id, status, updated_at desc)
  where deleted_at is null;

create index if not exists support_tickets_status_idx
  on public.support_tickets (status, updated_at desc)
  where deleted_at is null;

create index if not exists support_tickets_category_idx
  on public.support_tickets (category, updated_at desc)
  where deleted_at is null;

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'coach', 'admin')),
  message text not null,
  created_at timestamptz not null default now(),
  check (length(trim(message)) > 0)
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at asc);

create index if not exists support_ticket_messages_sender_idx
  on public.support_ticket_messages (sender_id, created_at desc);

drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row
  execute function public.update_updated_at_column();

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

-- support_tickets policies

drop policy if exists "Requester/admin read support tickets" on public.support_tickets;
create policy "Requester/admin read support tickets"
  on public.support_tickets
  for select
  using (
    deleted_at is null
    and (
      requester_id = auth.uid()
      or public.is_admin(auth.uid())
    )
  );

drop policy if exists "Client/coach create support tickets" on public.support_tickets;
create policy "Client/coach create support tickets"
  on public.support_tickets
  for insert
  with check (
    requester_id = auth.uid()
    and requester_role in ('user', 'coach')
  );

drop policy if exists "Requester/admin update support tickets" on public.support_tickets;
create policy "Requester/admin update support tickets"
  on public.support_tickets
  for update
  using (requester_id = auth.uid() or public.is_admin(auth.uid()))
  with check (requester_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admin delete support tickets" on public.support_tickets;
create policy "Admin delete support tickets"
  on public.support_tickets
  for delete
  using (public.is_admin(auth.uid()));

-- support_ticket_messages policies

drop policy if exists "Ticket participants read support messages" on public.support_ticket_messages;
create policy "Ticket participants read support messages"
  on public.support_ticket_messages
  for select
  using (
    exists (
      select 1
      from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.deleted_at is null
        and (
          t.requester_id = auth.uid()
          or public.is_admin(auth.uid())
        )
    )
  );

drop policy if exists "Ticket participants insert support messages" on public.support_ticket_messages;
create policy "Ticket participants insert support messages"
  on public.support_ticket_messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.deleted_at is null
        and (
          (
            t.requester_id = auth.uid()
            and sender_role in ('user', 'coach')
            and sender_role = t.requester_role
          )
          or (
            public.is_admin(auth.uid())
            and sender_role = 'admin'
          )
        )
    )
  );

-- Realtime publishing for support workflows

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_tickets'
  ) then
    execute 'alter publication supabase_realtime add table public.support_tickets';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_ticket_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.support_ticket_messages';
  end if;
end
$$;
