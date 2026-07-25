-- 006_create_arbiter_tables.sql
-- AIG v4 Arbiter — escrowed judging. PRD §8.
-- Adds bounties / rubrics / submissions / verdicts / escalations + agent_stats view.
-- Reuses existing points_ledger via new txn_type 'bounty_completed' (no schema change there).

-- ---------------- bounties ----------------
create table if not exists bounties (
  id            uuid primary key default gen_random_uuid(),
  poster_id     text        not null,           -- poster wallet address
  worker_id     text        not null,           -- assigned worker wallet (1 bounty–1 worker, MVP)
  brief         text        not null,
  amount_usdc   numeric     not null check (amount_usdc > 0 and amount_usdc <= 50),
  deadline      timestamptz not null,
  status        text        not null default 'DRAFT'
                  check (status in ('DRAFT','OPEN','SUBMITTED','JUDGED','RELEASED','REFUNDED','REFUSED')),
  escrow_tx     text,                            -- createBounty tx hash (or custodial deposit tx, fallback)
  created_at    timestamptz not null default now()
);

-- ---------------- rubrics (frozen after poster approval) ----------------
create table if not exists rubrics (
  id           uuid primary key default gen_random_uuid(),
  bounty_id    uuid not null references bounties(id) on delete cascade,
  items_json   jsonb not null,                   -- [{item_id, criterion, weight}], weights sum 100
  approved_at  timestamptz,
  frozen       boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------- submissions (content snapshot at submit-time) ----------------
create table if not exists submissions (
  id                uuid primary key default gen_random_uuid(),
  bounty_id         uuid not null references bounties(id) on delete cascade,
  content_snapshot  text not null,               -- frozen copy — anti-edit-after-judge
  source_url        text,
  submitted_at      timestamptz not null default now()
);

-- ---------------- verdicts (AI ↔ money contract; PRD §6) ----------------
create table if not exists verdicts (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  verdict_json  jsonb   not null,                -- full schema-valid Verdict JSON
  decision      text    not null check (decision in ('RELEASE','ESCALATE','FAIL','REFUSE')),
  confidence    integer not null check (confidence between 0 and 100),
  total_score   integer not null check (total_score between 0 and 100),
  verdict_hash  text    not null,                -- keccak256(canonical verdict json) — written on-chain at release
  release_tx    text,
  created_at    timestamptz not null default now()
);

-- ---------------- escalations (poster override — feeds override_rate) ----------------
create table if not exists escalations (
  id           uuid primary key default gen_random_uuid(),
  verdict_id   uuid not null references verdicts(id) on delete cascade,
  poster_action text not null check (poster_action in ('APPROVE','REJECT')),
  acted_at     timestamptz not null default now(),
  note         text
);

create index if not exists idx_rubrics_bounty       on rubrics(bounty_id);
create index if not exists idx_submissions_bounty    on submissions(bounty_id);
create index if not exists idx_verdicts_submission   on verdicts(submission_id);
create index if not exists idx_escalations_verdict   on escalations(verdict_id);

-- ---------------- agent_stats view (dashboard override_rate, PRD §10) ----------------
-- override_rate = poster-reversed verdicts ÷ verdicts a human actually reviewed (escalated ones).
-- A 'reversal' = arbiter recommended PASS(RELEASE/ESCALATE-pass) but poster REJECTed, or vice-versa.
-- MVP simplification: count REJECT actions as reversals over total human-reviewed verdicts.
create or replace view agent_stats as
select
  (select count(*) from verdicts)                                          as total_verdicts,
  (select count(*) from verdicts where decision = 'RELEASE')               as t1_auto_release,
  (select count(*) from verdicts where decision = 'REFUSE')                as refused,
  (select count(*) from escalations)                                       as human_reviewed,
  (select count(*) from escalations where poster_action = 'REJECT')        as overridden,
  case
    when (select count(*) from escalations) = 0 then 0
    else round(
      (select count(*) from escalations where poster_action = 'REJECT')::numeric
      / (select count(*) from escalations)::numeric, 4)
  end                                                                      as override_rate;
