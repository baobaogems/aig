-- Migration 005: nano_record() — atomic aggregate-increment + batched points flush
-- Run in Supabase SQL editor after 004. Powers v3.1 nanopay aggregation.
--
-- Why a function: many concurrent nanopayments must increment the SAME
-- (buyer, merchant) row without lost updates. INSERT ... ON CONFLICT DO UPDATE
-- is atomic; read-modify-write from the app would race. Points are flushed to
-- points_ledger only once accumulated unawarded volume reaches $0.01, so the
-- ledger is not flooded and points track real USD volume (anti micro-spam).

create or replace function nano_record(
  p_buyer    text,
  p_merchant text,
  p_amount   numeric
)
returns table(call_count bigint, total_usdc numeric, points_delta numeric)
language plpgsql
as $$
declare
  v_total   numeric;
  v_awarded numeric;
  v_count   bigint;
  v_delta   numeric := 0;
begin
  insert into nano_agents (buyer, merchant, call_count, total_usdc)
    values (p_buyer, p_merchant, 1, p_amount)
  on conflict (buyer, merchant) do update
    set call_count = nano_agents.call_count + 1,
        total_usdc = nano_agents.total_usdc + p_amount
  returning nano_agents.call_count, nano_agents.total_usdc, nano_agents.points_awarded
    into v_count, v_total, v_awarded;

  -- Flush batched points once unawarded volume >= $0.01 (1 point per $1 volume).
  if v_total - v_awarded >= 0.01 then
    v_delta := v_total - v_awarded;
    update nano_agents
      set points_awarded = v_total
      where buyer = p_buyer and merchant = p_merchant;
  end if;

  return query select v_count, v_total, v_delta;
end;
$$;
