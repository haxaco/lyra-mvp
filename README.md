# Lyra MVP Starter (Monorepo)

This repo matches the canvas spec: Next.js 14 app, worker, core/ui packages, infra migrations.

## Quickstart

```bash
pnpm i
pnpm -w dev
```

## Apps
- `apps/web` — Next.js 14 (App Router)
- `apps/worker` — background worker scaffold

## Packages
- `packages/core` — shared types/contracts (e.g., provider interfaces)
- `packages/ui` — shared UI components (placeholder)

## Infra
- `infra/migrations` — SQL schema (Supabase/Postgres + RLS examples)
```

### Deploy
- Connect this repo to Vercel and set `apps/web` as the project root.
- Add environment variables (see `.env.example`).
