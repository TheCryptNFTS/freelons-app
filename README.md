# FREELONS — HEX SIGNAL APP

The signal loop app for Freelons holders. 404 HEX NOT FOUND. Bring it back on X.

## What this is

A signal-loop dApp where Freelon holders post a daily signal, climb a live leaderboard, and trigger override windows for 5× scoring. Built in Next.js 14 with file-backed persistence (Supabase-ready).

## Pages

- `/` — Hero / incident report / rules
- `/signal` — Daily signal action with on-chain ownership verification + reply chain
- `/leaderboard` — Live ranks (top 3 podium + paper roll for 4-100)
- `/wall` — SSE-streamed live signal feed
- `/profile` — "I HOLD THE SIGNAL" holder status card
- `/admin` — Trigger override windows (gated by `FREELONS_ADMIN_SECRET`)

## API

- `GET  /api/leaderboard` — top holders
- `GET  /api/wall` — recent 60 signals
- `GET  /api/wall/stream` — SSE live feed
- `POST /api/signals` — log a signal (rate-limited 5/wallet/min)
- `GET  /api/profile?wallet=` — holder stats
- `GET  /api/reply-targets?wallet=` — 2 holders to reply to
- `GET  /api/verify?wallet=&tokenId=` — on-chain ownerOf check
- `GET  /api/override` — current override status
- `POST /api/override?secret=&start=N` — trigger N-minute override (admin)

## Local dev

```bash
npm install
cp .env.example .env.local
# edit FREELONS_ADMIN_SECRET in .env.local
npm run dev
```

App runs at http://localhost:3000.

## Pre-launch checklist

- [ ] Set strong `FREELONS_ADMIN_SECRET` in production env
- [ ] Set `FREELONS_RPC_URL` to a paid RPC (Alchemy / QuickNode) for ownerOf reliability
- [ ] Set `FREELONS_DEMO=off` in production (kills the auto-generated signal traffic)
- [ ] Replace file-backed `lib/store.ts` with Supabase / KV before scaling
- [ ] Add real wallet auth (RainbowKit + SIWE) — currently uses text input
- [ ] Add real X post verification webhook — currently logs intent on click
- [ ] Wire up domain + SSL (Vercel handles this)
- [ ] Test on mobile (iPhone Safari + Android Chrome)
- [ ] Configure analytics (Plausible / Vercel Analytics)
- [ ] Test override flow end-to-end with /admin

## Build

```bash
npm run build
npm run start
```

## Tech

- Next.js 14 (app router)
- Tailwind CSS
- Server-Sent Events for live wall
- File-backed JSON store at `.data/store.json` (swap to Supabase for prod)
- Public Ethereum RPC for `ownerOf()` calls
