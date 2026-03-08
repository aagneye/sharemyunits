# GPU Marketplace

A decentralized platform for renting GPU computing power. Turborepo monorepo with a Next.js 14 frontend and a Fastify API backend.

## Architecture

- **`apps/web`** — Next.js 14 frontend (port 5000)
- **`apps/api`** — Fastify backend API (port 8000)
- **`packages/types`** — Shared TypeScript types
- **`packages/utils`** — Shared utilities

## Package Manager

npm with workspaces (no lockfile committed — run `npm install` at root after cloning)

## Workflows

- **Start application** — `npm run dev --workspace=apps/web` (port 5000, webview)
- **Start Backend** — `npm run dev --workspace=apps/api` (port 8000, console)

## Replit-specific Configuration

- Frontend dev script: `next dev -p 5000 -H 0.0.0.0`
- Backend default port: 8000 (set via `API_PORT` env var)
- CORS: uses `FRONTEND_URL` env var (defaults to all origins in dev)
- Prisma schema: `apps/api/src/db/prisma/schema.prisma`
- After any `npm install`, re-run: `npx prisma generate --schema=apps/api/src/db/prisma/schema.prisma`

## Frontend Pages

### Public
- `/` — Landing page with Login / Register buttons
- `/login` — Email + Google/GitHub OAuth login
- `/register` — Account creation with role selection (buyer/host)

### Buyer (role: USER)
- `/buyer/marketplace` — Browse available GPUs with VRAM/price filters
- `/buyer/vm/provision?gpuId=...` — Configure rental duration, cost calculator, Stripe checkout
- `/buyer/my-rentals` — List all rentals with status badges and terminate button
- `/buyer/vm/[id]` — VM detail with polled status, SSH key download

### Host (role: HOST)
- `/host/dashboard` — Stats: earnings, active GPUs, total rentals
- `/host/my-gpus` — List own GPUs, toggle status, delete
- `/host/add-gpu` — Register a new GPU with full hardware spec fields

### Admin (role: ADMIN)
- `/admin/dashboard` — System-wide stats with charts
- `/admin/users` — All users table with role change dropdown
- `/admin/gpus` — All GPUs table with status management

## Backend API Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### GPU
- `GET /api/gpu/list` — Public GPU listing with filters
- `GET /api/gpu/:id` — Single GPU detail
- `POST /api/gpu/register` — Host registers a GPU
- `GET /api/gpu/my-gpus` — Host's own GPUs
- `PUT /api/gpu/:id/status` — Update GPU status
- `DELETE /api/gpu/:id` — Remove a GPU

### VM / Rental
- `POST /api/vm/provision` — Provision a VM rental
- `GET /api/vm/:id/status` — Poll VM status
- `POST /api/vm/:id/terminate` — Terminate a VM
- `GET /api/vm/:id/ssh-credentials` — Get SSH key
- `GET /api/rental/my-rentals` — Buyer's rental history

### Host
- `GET /api/host/stats` — Host earnings and activity stats

### Payment
- `POST /api/payment/checkout` — Create Stripe checkout session
- `POST /api/payment/webhook` — Stripe webhook (raw body)

### Admin
- `GET /api/admin/stats` — System-wide overview stats
- `GET /api/admin/users` — All users
- `PUT /api/admin/users/:id/role` — Change user role
- `GET /api/admin/gpus` — All GPUs
- `PUT /api/admin/gpus/:id/status` — Admin force-set GPU status

## Auth Flow

- NextAuth credentials provider calls `POST /api/auth/login` → receives `accessToken` + `refreshToken`
- Session stores `accessToken` in JWT
- `apiClient` reads token via `getSession()` and sends as `Authorization: Bearer ...`
- TypeScript types in `apps/web/types/next-auth.d.ts`

## Required Secrets / Environment Variables

Set these in Replit Secrets:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (optional — falls back to in-memory rate limiting) |
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
| `PROXMOX_HOST` | Proxmox VE API URL (optional — VM provisioning stubbed) |
| `PROXMOX_USER` | Proxmox user |
| `PROXMOX_PASSWORD` | Proxmox password |
| `API_PORT` | API port (default: 8000) |

## External Services

- **PostgreSQL** — All persistent data. Run `npx prisma migrate dev --schema=apps/api/src/db/prisma/schema.prisma` to set up schema.
- **Redis** — Rate limiting, pub/sub, BullMQ. Optional: server falls back to in-memory rate limiting if unavailable.
- **Stripe** — Payment processing. Webhook uses raw Buffer body parsing in Fastify.
- **Proxmox VE** — VM provisioning (stubbed in `vm-orchestrator.ts` — replace with real integration).

## Notes

- Next.js upgraded 14.0.4 → 14.2.29 (security fix)
- Workers (billing, vm-provision) require Redis — not auto-started; start separately when Redis is available
- VM provisioning is simulated with placeholder IPs/IDs
- Dashboard sidebar is role-aware: shows buyer/host/admin links based on session role
