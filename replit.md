# GPU Marketplace

A decentralized platform for renting GPU computing power, migrated from Vercel to Replit.

## Architecture

Turborepo monorepo with two apps:

- **`apps/web`** — Next.js 14 frontend (port 5000)
- **`apps/api`** — Fastify backend API (port 8000)
- **`packages/types`** — Shared TypeScript types
- **`packages/utils`** — Shared utilities

## Package Manager

npm with workspaces (no lockfile committed — run `npm install` at root)

## Workflows

- **Start application** — `npm run dev --workspace=apps/web` (port 5000, webview)
- **Start Backend** — `npm run dev --workspace=apps/api` (port 8000, console)

## Replit-specific Configuration

- Frontend dev script: `next dev -p 5000 -H 0.0.0.0`
- Backend default port: 8000 (set via `API_PORT` env var)
- CORS: uses `FRONTEND_URL` env var (defaults to `true` = all origins in dev)
- Prisma schema: `apps/api/src/db/prisma/schema.prisma`
- After any `npm install`, re-run: `npx prisma generate --schema=apps/api/src/db/prisma/schema.prisma`

## Required Secrets / Environment Variables

Set these in Replit Secrets:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `NEXTAUTH_URL` | Public URL of the frontend (e.g. https://your-repl.replit.dev) |
| `NEXTAUTH_SECRET` | NextAuth.js secret |
| `NEXT_PUBLIC_API_URL` | Public URL of the API backend |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL of the API backend |
| `FRONTEND_URL` | Frontend URL for CORS (same as NEXTAUTH_URL) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret (optional) |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID (optional) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret (optional) |
| `PROXMOX_HOST` | Proxmox VE API URL |
| `PROXMOX_USER` | Proxmox user |
| `PROXMOX_PASSWORD` | Proxmox password |
| `API_PORT` | API port (default: 8000) |

## External Services Required

- **PostgreSQL** — For all persistent data (run `npx prisma migrate dev` to set up schema)
- **Redis** — For rate limiting, pub/sub GPU metrics, and BullMQ job queues
- **Stripe** — Payment processing
- **Proxmox VE** — VM provisioning for GPU rentals

## Security Notes

- Next.js upgraded from 14.0.4 → 14.2.29 (fixed critical CVE)
- Prisma schema had relation errors — fixed VM↔GPU and Rental↔Payment relations
- Admin routes fixed: `addHook('preHandler', ...)` now uses single async function (Fastify requirement)
- CORS origin uses `FRONTEND_URL` env var instead of hardcoded localhost
