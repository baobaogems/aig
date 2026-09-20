-- 009_open_bounties.sql
-- Phase 03 + 04 of plans/260920-0835-arbiter-self-serve-two-roles.
--
-- Until now a bounty named its worker at creation, so the poster had to know who would do
-- the job before posting it. An open bounty has no worker until someone claims it on-chain,
-- so the column has to allow null.
--
-- claim_tx mirrors escrow_tx: the DB records WHICH transaction made the assignment, so the
-- row can always be re-derived from the chain if they ever disagree. The chain is the truth;
-- these columns are a cache of it.

alter table bounties alter column worker_id drop not null;
alter table bounties add column if not exists claim_tx text;

comment on column bounties.worker_id is
  'Wallet that claimed the bounty, or null while it is still open. Only ever written from an on-chain read.';
comment on column bounties.claim_tx is
  'The claim() transaction that assigned worker_id. Null for bounties assigned at creation.';
