-- KigaliDeals Agent Foundation
-- Run this in your Supabase SQL Editor.
-- This creates two tables: agent_tasks (inbox) and agent_runs (logbook).

-- THE INBOX: work to be done by agents
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  priority int not null default 5,
  attempts int not null default 0,
  max_attempts int not null default 3,
  result jsonb,
  error text,
  scheduled_for timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agent_tasks_pickup_idx
  on public.agent_tasks (status, scheduled_for, priority)
  where status = 'pending';

create index if not exists agent_tasks_agent_idx
  on public.agent_tasks (agent, status);

-- THE LOGBOOK: every agent execution, for observability and cost tracking
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.agent_tasks(id) on delete set null,
  agent text not null,
  action text not null,
  model text,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10, 6),
  latency_ms int,
  status text not null,
  input jsonb,
  output jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists agent_runs_agent_time_idx
  on public.agent_runs (agent, created_at desc);

-- Row Level Security: lock these tables down.
-- Only the service role key can access them (which bypasses RLS automatically).
alter table public.agent_tasks enable row level security;
alter table public.agent_runs enable row level security;

-- No policies are created, which means no access for anon or authenticated users.
-- This is intentional. Agents run server-side only.
