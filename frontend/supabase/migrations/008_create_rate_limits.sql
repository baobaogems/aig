-- 008_create_rate_limits.sql
-- Phase 05 of plans/260920-0835-arbiter-self-serve-two-roles.
--
-- Two routes spend real money per call: POST /api/bounty (one LLM rubric call) and
-- POST /api/judge (one LLM grade call, plus possibly an on-chain release). Authentication
-- stops strangers; it does not stop one signed-in wallet from looping.
--
-- Serverless again rules out an in-memory counter: consecutive requests land on different
-- instances, so the counter must be shared.

create table if not exists rate_limits (
  id         bigserial primary key,
  bucket     text        not null,   -- '<route>:<address>'
  created_at timestamptz not null default now()
);

-- The only query this table serves: count rows in a bucket since a cutoff.
create index if not exists rate_limits_bucket_created_idx on rate_limits (bucket, created_at desc);

comment on table rate_limits is
  'Sliding-window request log for the LLM-spending routes. Rows older than the widest window are dead weight and safe to delete.';
