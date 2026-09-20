-- 010_settlement.sql — v3 dispute mechanism.
--
-- Two facts the database could not previously hold:
--   1. WHEN work was handed in. Without it there is no settlement clock, and "the poster
--      stayed silent" cannot be distinguished from "nothing was ever submitted".
--   2. HOW MUCH of the escrow the worker got. v2 only knew "released" or nothing, so a
--      partial payment was unrepresentable — which is why a poster who found the work
--      half-usable had to choose between paying everything and paying nothing.
--
-- escrow_version exists so bounties opened on the v2 contract keep working after v3 ships.
-- They finish where they started; no money moves between contracts.

alter table bounties add column if not exists submitted_at timestamptz;
alter table bounties add column if not exists escrow_version smallint not null default 3;

-- Every row that existed before this migration was created against the v2 contract.
update bounties set escrow_version = 2 where created_at < now();

comment on column bounties.submitted_at is
  'When the arbiter recorded a plausible submission on-chain. Non-null shuts the poster''s unilateral refund.';
comment on column bounties.escrow_version is
  '2 = ArbiterEscrow v2 (frozen, finishing out). 3 = v3 with settle/markSubmitted/timeoutRelease.';

alter table verdicts add column if not exists worker_bps smallint;

comment on column verdicts.worker_bps is
  'Worker share of the escrow in basis points at settlement. 10000 = paid in full, 0 = nothing, in between = kill fee.';

-- The poster acting on a verdict is recorded in `escalations`; add the objection so a T1
-- override is visible in the same place as a T2 one, and counts toward override_rate.
alter table escalations drop constraint if exists escalations_poster_action_check;
alter table escalations add constraint escalations_poster_action_check
  check (poster_action in ('APPROVE', 'REJECT', 'OBJECT'));
