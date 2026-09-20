-- 007_create_auth_nonces.sql
-- Phase 01 of plans/260920-0835-arbiter-self-serve-two-roles.
-- Sign-In With Ethereum (EIP-4361): the wallet IS the account. One table, one job —
-- hand out a single-use nonce and remember that it was used.
--
-- Why a table and not an in-memory Map: the app runs on Vercel serverless, so two requests
-- (GET /api/auth/nonce then POST /api/auth/siwe) can land on different instances. An
-- in-memory nonce would verify on one instance and be unknown on the next.

create table if not exists auth_nonces (
  nonce       text        primary key,            -- 32 random bytes, base64url
  address     text,                                -- filled in on successful verify (audit trail)
  created_at  timestamptz not null default now(),
  used_at     timestamptz                          -- non-null => spent, must never verify again
);

-- Sweeping expired nonces is cheap and keeps the table from growing without bound.
create index if not exists auth_nonces_created_at_idx on auth_nonces (created_at);

comment on table auth_nonces is
  'Single-use SIWE nonces. A row with used_at set is spent; a row older than 5 minutes is expired.';
