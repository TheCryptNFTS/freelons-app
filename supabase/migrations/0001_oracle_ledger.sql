-- THE ORACLE LEDGER — schema + money-atomic Postgres functions.
-- Applied to project the-lounge (zrnslxmmioherpikxmsf) on 2026-07-05.
-- HEX is non-cashable points; nothing here moves real money.

create table if not exists oracle_duels (
  id text primary key,
  market_id text not null,
  market_title text not null,
  domain text not null,
  edge_prob_yes double precision not null,
  edge_side text not null check (edge_side in ('YES','NO')),
  edge_confidence double precision not null default 0,
  seal_hash text not null,
  published_at bigint not null,
  lock_ts bigint not null,
  status text not null default 'open' check (status in ('open','locked','resolved','void')),
  outcome text check (outcome in ('YES','NO')),
  outcome_source text,
  resolved_at bigint,
  edge_brier double precision,
  pot_follow bigint not null default 0,
  pot_fade bigint not null default 0
);
create index if not exists oracle_duels_status_pub on oracle_duels(status, published_at desc);

create table if not exists oracle_hex (
  wallet text primary key,
  balance bigint not null,
  last_faucet bigint not null default 0
);

create table if not exists oracle_stances (
  id text primary key,
  duel_id text not null references oracle_duels(id),
  wallet text not null,
  token_id bigint not null,
  stake text not null check (stake in ('FOLLOW','FADE')),
  own_prob_yes double precision not null,
  hex bigint not null,
  placed_at bigint not null,
  settled boolean not null default false,
  payout bigint,
  brier double precision,
  beat_edge boolean,
  unique (duel_id, wallet)
);
create index if not exists oracle_stances_duel on oracle_stances(duel_id);

create table if not exists oracle_ratings (
  token_id bigint primary key,
  owner text not null,
  resolved int not null default 0,
  sum_brier double precision not null default 0,
  sum_edge_brier double precision not null default 0,
  beat_edge_count int not null default 0,
  by_domain jsonb not null default '{}'::jsonb,
  updated_at bigint not null default 0
);

-- Reachable ONLY through the server (service_role bypasses RLS). Every write still
-- passes the SIWE / ownerOf / admin gates in the Next.js route handlers first.
alter table oracle_duels   enable row level security;
alter table oracle_hex     enable row level security;
alter table oracle_stances enable row level security;
alter table oracle_ratings enable row level security;

create or replace function oracle_place_stance(
  p_id text, p_duel text, p_wallet text, p_token bigint, p_stake text,
  p_prob double precision, p_hex bigint, p_hex_start bigint, p_min bigint, p_max bigint
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  d oracle_duels; now_ms bigint := (extract(epoch from now())*1000)::bigint;
  bal bigint; p double precision := greatest(0, least(1, p_prob));
begin
  select * into d from oracle_duels where id = p_duel for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'duel_not_found'); end if;
  if d.status = 'open' and now_ms >= d.lock_ts then update oracle_duels set status='locked' where id = p_duel; d.status := 'locked'; end if;
  if d.status <> 'open' then return jsonb_build_object('ok', false, 'error', 'duel_locked'); end if;
  if p_stake not in ('FOLLOW','FADE') then return jsonb_build_object('ok', false, 'error', 'bad_stake_side'); end if;
  if p_hex < p_min or p_hex > p_max then return jsonb_build_object('ok', false, 'error', 'bad_stake', 'detail', jsonb_build_object('min',p_min,'max',p_max)); end if;
  if exists (select 1 from oracle_stances where duel_id = p_duel and wallet = p_wallet) then return jsonb_build_object('ok', false, 'error', 'already_staked'); end if;
  insert into oracle_hex(wallet, balance, last_faucet) values (p_wallet, p_hex_start, 0) on conflict (wallet) do nothing;
  select balance into bal from oracle_hex where wallet = p_wallet for update;
  if bal < p_hex then return jsonb_build_object('ok', false, 'error', 'insufficient_hex'); end if;
  update oracle_hex set balance = balance - p_hex where wallet = p_wallet;
  insert into oracle_stances(id, duel_id, wallet, token_id, stake, own_prob_yes, hex, placed_at, settled)
    values (p_id, p_duel, p_wallet, p_token, p_stake, p, p_hex, now_ms, false);
  if p_stake = 'FOLLOW' then update oracle_duels set pot_follow = pot_follow + p_hex where id = p_duel;
  else update oracle_duels set pot_fade = pot_fade + p_hex where id = p_duel; end if;
  return jsonb_build_object('ok', true, 'hexBalance', bal - p_hex,
    'stance', jsonb_build_object('id',p_id,'duelId',p_duel,'wallet',p_wallet,'tokenId',p_token,'stake',p_stake,'ownProbYes',p,'hex',p_hex,'placedAt',now_ms,'settled',false));
end $$;

create or replace function oracle_resolve_duel(p_duel text, p_outcome text, p_source text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  d oracle_duels; now_ms bigint := (extract(epoch from now())*1000)::bigint;
  o int := case when p_outcome = 'YES' then 1 else 0 end; ebrier double precision;
  win_pool bigint; lose_pool bigint;
  s oracle_stances; s_win boolean; s_payout bigint; s_brier double precision; s_beat boolean;
  r oracle_ratings; dom jsonb; dom_res int; dom_sum double precision; n int := 0;
begin
  if p_outcome not in ('YES','NO') then return jsonb_build_object('ok', false, 'error', 'bad_outcome'); end if;
  select * into d from oracle_duels where id = p_duel for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'duel_not_found'); end if;
  if d.status = 'resolved' then return jsonb_build_object('ok', true, 'settled', 0, 'already', true); end if;
  ebrier := power(d.edge_prob_yes - o, 2);
  update oracle_duels set status='resolved', outcome=p_outcome, outcome_source=p_source, resolved_at=now_ms, edge_brier=ebrier where id = p_duel;
  select coalesce(sum(hex),0) into win_pool from oracle_stances where duel_id=p_duel and settled=false
    and ((stake='FOLLOW' and d.edge_side=p_outcome) or (stake='FADE' and d.edge_side<>p_outcome));
  select coalesce(sum(hex),0) into lose_pool from oracle_stances where duel_id=p_duel and settled=false
    and not ((stake='FOLLOW' and d.edge_side=p_outcome) or (stake='FADE' and d.edge_side<>p_outcome));
  for s in select * from oracle_stances where duel_id=p_duel and settled=false loop
    s_win := (s.stake='FOLLOW' and d.edge_side=p_outcome) or (s.stake='FADE' and d.edge_side<>p_outcome);
    s_brier := power(s.own_prob_yes - o, 2); s_beat := s_brier < ebrier;
    if s_win then s_payout := s.hex + case when win_pool > 0 then floor(lose_pool::numeric * s.hex / win_pool)::bigint else 0 end;
      update oracle_hex set balance = balance + s_payout where wallet = s.wallet;
    else s_payout := 0; end if;
    update oracle_stances set settled=true, payout=s_payout, brier=s_brier, beat_edge=s_beat where id = s.id;
    select * into r from oracle_ratings where token_id = s.token_id;
    if not found or r.owner <> s.wallet then
      insert into oracle_ratings(token_id, owner) values (s.token_id, s.wallet)
        on conflict (token_id) do update set owner=excluded.owner, resolved=0, sum_brier=0, sum_edge_brier=0, beat_edge_count=0, by_domain='{}'::jsonb;
      select * into r from oracle_ratings where token_id = s.token_id;
    end if;
    dom := coalesce(r.by_domain -> d.domain, jsonb_build_object('resolved',0,'sumBrier',0));
    dom_res := (dom->>'resolved')::int + 1; dom_sum := (dom->>'sumBrier')::double precision + s_brier;
    update oracle_ratings set resolved = r.resolved + 1, sum_brier = r.sum_brier + s_brier, sum_edge_brier = r.sum_edge_brier + ebrier,
      beat_edge_count = r.beat_edge_count + case when s_beat then 1 else 0 end,
      by_domain = r.by_domain || jsonb_build_object(d.domain, jsonb_build_object('resolved',dom_res,'sumBrier',dom_sum)),
      updated_at = now_ms where token_id = s.token_id;
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'settled', n, 'outcome', p_outcome, 'edgeBrier', ebrier);
end $$;

create or replace function oracle_claim_daily(p_wallet text, p_daily bigint, p_start bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare now_ms bigint := (extract(epoch from now())*1000)::bigint; rec oracle_hex; day bigint := 86400000;
begin
  insert into oracle_hex(wallet, balance, last_faucet) values (p_wallet, p_start, 0) on conflict (wallet) do nothing;
  select * into rec from oracle_hex where wallet = p_wallet for update;
  if now_ms - rec.last_faucet >= day then
    update oracle_hex set balance = balance + p_daily, last_faucet = now_ms where wallet = p_wallet;
    return jsonb_build_object('claimed', true, 'balance', rec.balance + p_daily);
  end if;
  return jsonb_build_object('claimed', false, 'balance', rec.balance);
end $$;

create or replace function oracle_void_duel(p_duel text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d oracle_duels; s oracle_stances; n int := 0;
begin
  select * into d from oracle_duels where id = p_duel for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'duel_not_found'); end if;
  if d.status = 'resolved' then return jsonb_build_object('ok', false, 'error', 'already_resolved'); end if;
  for s in select * from oracle_stances where duel_id = p_duel and settled = false loop
    update oracle_hex set balance = balance + s.hex where wallet = s.wallet;
    update oracle_stances set settled = true, payout = s.hex where id = s.id;
    n := n + 1;
  end loop;
  update oracle_duels set status = 'void' where id = p_duel;
  return jsonb_build_object('ok', true, 'refunded', n);
end $$;

create or replace function oracle_tick_locks()
returns void language sql security definer set search_path = public as $$
  update oracle_duels set status='locked' where status='open' and (extract(epoch from now())*1000)::bigint >= lock_ts;
$$;

-- ---------------------------------------------------------------------------
-- HARDENING (secure end-state). The oracle tables + money functions are
-- reachable ONLY through the server's service_role key (which bypasses RLS).
-- anon / authenticated must NOT touch them directly via PostgREST — otherwise
-- these SECURITY DEFINER functions could be called straight from a browser,
-- bypassing the SIWE + ownerOf + admin gates in the Next.js route handlers.
revoke all on oracle_duels, oracle_hex, oracle_stances, oracle_ratings from anon, authenticated;
grant  all on oracle_duels, oracle_hex, oracle_stances, oracle_ratings to service_role;

revoke execute on function oracle_place_stance(text,text,text,bigint,text,double precision,bigint,bigint,bigint,bigint) from public, anon, authenticated;
revoke execute on function oracle_resolve_duel(text,text,text)                      from public, anon, authenticated;
revoke execute on function oracle_claim_daily(text,bigint,bigint)                   from public, anon, authenticated;
revoke execute on function oracle_void_duel(text)                                   from public, anon, authenticated;
revoke execute on function oracle_tick_locks()                                      from public, anon, authenticated;
grant  execute on function oracle_place_stance(text,text,text,bigint,text,double precision,bigint,bigint,bigint,bigint) to service_role;
grant  execute on function oracle_resolve_duel(text,text,text)                      to service_role;
grant  execute on function oracle_claim_daily(text,bigint,bigint)                   to service_role;
grant  execute on function oracle_void_duel(text)                                   to service_role;
grant  execute on function oracle_tick_locks()                                      to service_role;
