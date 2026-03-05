# Git Commit Messages

## Frontend Repository (sharemyunits)

### Initial Commit
```
feat: initial project setup with Next.js 14 monorepo structure

- Set up Turborepo monorepo configuration
- Configure Next.js 14 with App Router
- Add Tailwind CSS and shadcn/ui styling setup
- Create authentication pages (login, register)
- Implement buyer dashboard pages (marketplace, my-rentals, VM details)
- Implement host dashboard pages (dashboard, my-gpus, add-gpu)
- Add admin pages structure
- Create API client and authentication utilities
- Set up Socket.io client for real-time updates
- Configure TypeScript and ESLint
```

### Second Commit (if needed)
```
feat: add UI components and styling

- Add shadcn/ui component library
- Create GPU card components
- Add VM terminal component structure
- Implement metrics chart components
- Add SSH key download component
- Style all pages with Tailwind CSS
```

## Backend Repository (sharemyunits_backend)

### Initial Commit
```
feat: initial backend setup with Fastify and Prisma

- Set up Fastify server with TypeScript
- Configure Prisma ORM with PostgreSQL schema
- Implement authentication routes (register, login, refresh)
- Create GPU routes (list, register, stats)
- Implement VM routes (provision, terminate, status, SSH credentials)
- Add payment routes (checkout, webhook, payout)
- Create admin routes (users, GPUs, disputes)
- Set up JWT authentication middleware
- Implement RBAC middleware for role-based access
- Add rate limiting and security headers
- Configure WebSocket support for real-time GPU metrics
- Create VM orchestrator service for Proxmox integration
- Implement SSH key service with Ed25519 keypair generation
- Add payment service with Stripe integration
- Create billing meter for usage tracking
- Set up BullMQ workers for async job processing
- Add notification service structure
- Configure Redis for caching and queues
```

### Second Commit (if needed)
```
feat: add infrastructure and agent components

- Create Docker Compose configuration for local development
- Add Prometheus and Grafana monitoring setup
- Configure Nginx reverse proxy
- Set up WireGuard VPN template configuration
- Create GPU agent structure for host machines
- Add GPU reporter for metrics collection
- Implement VM executor for Proxmox commands
- Create firewall manager with nftables support
- Add health check service for agent monitoring
```

### Third Commit (if needed)
```
docs: add comprehensive documentation

- Add architecture documentation
- Document SSH access flow
- Create host onboarding guide
- Add README with setup instructions
```

## Usage

To commit the frontend:
```bash
cd c:\Projects\sharemyunits
git add .
git commit -m "feat: initial project setup with Next.js 14 monorepo structure"
git push -u origin main
```

To commit the backend:
```bash
cd c:\Projects\sharemyunits\apps\api
git add .
git commit -m "feat: initial backend setup with Fastify and Prisma"
git push -u origin main
```

Note: You may need to create the `main` branch first:
```bash
git checkout -b main
```
