# The Oracle Ledger — Launch Runbook

A HEX-only, non-cashable "beat the AI" calibration game inside the Freelons HEX
SIGNAL app. A daily **Duel** seals an Edge probability on an objective public
market; holders **FOLLOW/FADE** and give their own probability; the HEX pot is
pari-mutuel (zero-sum, never minted) and scores are Brier-calibrated. HEX is
points — nothing here moves real money.

> Code is merged to `main` (`github.com/TheCryptNFTS/freelons-app`). This runbook
> is the remaining, human-only work to make it live behind a domain.

---

## 1. Database — ✅ already done

The schema + atomic money functions are applied to the production Supabase
project **the-lounge** (`zrnslxmmioherpikxmsf`) and hardened:

- `oracle_duels`, `oracle_hex`, `oracle_stances`, `oracle_ratings` — RLS **on**,
  **no policies** → reachable only through the server's service-role key.
- Atomic RPCs `oracle_place_stance` / `oracle_resolve_duel` / `oracle_claim_daily`
  / `oracle_void_duel` / `oracle_tick_locks` — `EXECUTE` revoked from
  `anon`/`authenticated`, granted to `service_role` only.
- Tables are empty (production-clean).

Source of truth / re-apply anywhere: [`supabase/migrations/0001_oracle_ledger.sql`](supabase/migrations/0001_oracle_ledger.sql).

## 2. Environment variables (Vercel → Settings → Environment Variables, **Production**)

**Required — the feature will not work correctly without these:**

| Variable | Value / source |
| --- | --- |
| `SUPABASE_URL` | `https://zrnslxmmioherpikxmsf.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` secret. **Server-only, never expose.** |
| `FREELONS_AUTH_SECRET` | A strong random string. 🔒 **Security-critical** — `lib/siwe.ts` falls back to the public `"dev-auth-secret-change-me"` if unset, which makes SIWE session cookies forgeable. |
| `FREELONS_ADMIN_SECRET` | A strong random string — gates `/api/oracle/publish`, `/resolve`, `/void`. |
| `CRON_SECRET` | A strong random string — Vercel sends it as `Authorization: Bearer` to the daily cron. Without it the cron endpoint returns 401 (fails safe; the duel won't rotate). |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect project id (already used by the existing app). |

Generate strong secrets: `openssl rand -hex 32`

**Optional — sensible defaults if omitted:**

| Variable | Default behaviour |
| --- | --- |
| `EDGE_API_URL` / `EDGE_READ_TOKEN` | Unset → the daily candidate comes from a built-in **fixture** market, so the game runs with no live Edge. Set both to pull real signals from the Edge agent. |
| `ORACLE_ALLOW_DEMO` | **Leave UNSET in prod.** Set to `1` only locally to let non-wallet handles play. Unset = every HEX/rating write requires SIWE + on-chain `ownerOf`. |
| `ORACLE_HEX_START` / `ORACLE_HEX_DAILY` / `ORACLE_HEX_MIN` / `ORACLE_HEX_MAX` | `1000 / 100 / 10 / 500`. |

If `SUPABASE_*` is missing at first it is only a **soft** blocker: `db()` throws
lazily and is imported only by the `/api/oracle/*` handlers, so just `/oracle`
and those endpoints error — the rest of the site is unaffected.

## 3. Deploy

The GitHub repo isn't linked to a Vercel project yet. From the repo root:

```bash
vercel link          # select or create the project for the target domain
vercel --prod        # deploy main
```

Or connect `TheCryptNFTS/freelons-app` in the Vercel dashboard so every push to
`main` auto-deploys.

**Domain:** this is the separate HEX SIGNAL holder app (the main site lives in the
`freelon/phase3/freelon-city-site` repo), so it most naturally lives on a
**subdomain** (e.g. `app.` or `hex.freeloncity.com`). Attach it in
Vercel → Settings → Domains.

## 4. Daily cron — already wired

[`vercel.json`](vercel.json) schedules one call/day:

```
GET /api/oracle/cron   @  0 14 * * *   (14:00 UTC)
```

One idempotent pass: **resolve** the current duel if its public market has
settled, then **publish** the next duel from Edge (only when nothing is still
unresolved — duels never stack). Auth is `CRON_SECRET`. Manual/off-schedule run:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/oracle/cron
# or, with the admin secret:
curl -H "x-admin-secret: $FREELONS_ADMIN_SECRET" -X POST https://<domain>/api/oracle/cron
```

Fixture markets never auto-resolve; resolve those manually or `/api/oracle/void`
a duel whose market will never settle.

## 5. Post-deploy verification

```bash
D=https://<domain>
curl -s $D/api/oracle/today                              # → duel (or null before the first cron), pot, participants
curl -s -H "Authorization: Bearer $CRON_SECRET" $D/api/oracle/cron   # seed the first duel
curl -s $D/api/oracle/today                              # → now shows the sealed duel
```

Then open `/oracle` in a wallet that holds a FREELON citizen NFT: claim the daily
HEX faucet, place a FOLLOW/FADE stance, and confirm it appears in the pot and on
`/oracle/leaderboard`.

## Admin endpoints (all require `FREELONS_ADMIN_SECRET`)

| Route | Purpose |
| --- | --- |
| `POST /api/oracle/publish` | Manually seal today's duel. |
| `POST /api/oracle/resolve` `{duelId, outcome?}` | Settle a duel. No `outcome` → reads the public Polymarket result. Manual `outcome` only accepted after lock. |
| `POST /api/oracle/void` `{duelId}` | Void a duel that can't settle and **refund** every stake. |

## Guarantees

- **No mint:** payouts are pari-mutuel (winners split the losing pool + stake
  back); total HEX is conserved. Verified end-to-end against the live DB.
- **Anti-sybil ratings:** per-token Analyst Ratings bind to the wallet that owned
  the token when each stance was placed; a transfer resets reputation.
- **Nothing custodial or financial:** HEX is non-cashable points; outcomes settle
  on public markets; Edge admin/kill-switch is never exposed here.
