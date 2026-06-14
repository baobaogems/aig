-- Migration 004: Create nano_agents table (v3.1 aggregation + anti-abuse)
-- Run in Supabase SQL editor before deploying the v3.1 nanopay aggregate logic.
--
-- Why: v3 P2/P3 wrote one payment_sessions row + one points_ledger row PER
-- nanopayment. At agentic scale (thousands/min of sub-cent payments) that floods
-- both tables and lets micro-spam farm points. v3.1 instead keeps ONE rolling
-- aggregate row per (buyer agent, merchant) and batches points to real USD volume.

create table nano_agents (
  id              uuid primary key default gen_random_uuid(),
  buyer           text not null,                 -- agent wallet (payer)
  merchant        text not null,                 -- seller wallet (lowercased)
  call_count      bigint not null default 0,     -- number of nanopayments
  total_usdc      numeric not null default 0,    -- cumulative USDC received (sub-cent ok)
  points_awarded  numeric not null default 0,    -- volume already flushed to points_ledger (1:1)
  first_at        timestamptz default now(),
  last_at         timestamptz default now(),
  unique (buyer, merchant)                        -- one rolling row per agent+merchant (upsert key)
);

-- Dashboard reads aggregates per merchant
create index on nano_agents (merchant);

-- Keep last_at fresh on update (reuse the v1 trigger fn if present, else define)
create or replace function update_nano_last_at()
returns trigger as $$
begin new.last_at = now(); return new; end;
$$ language plpgsql;

create trigger nano_agents_last_at
  before update on nano_agents
  for each row execute function update_nano_last_at();
