# GPU Marketplace

Decentralized platform where institutions can host unused GPUs for public rental with payment processing.

## Features

- 🚀 **GPU Rental Marketplace** - Browse and rent GPU computing power
- 💳 **Payment Processing** - Stripe integration for secure payments
- 🔐 **Secure SSH Access** - Ed25519 keypairs with one-time download
- 🖥️ **VM Orchestration** - Automated VM provisioning via Proxmox
- 📊 **Real-time Metrics** - Live GPU utilization and health monitoring
- 🏛️ **Multi-tenant** - Support for buyers, hosts, and admins

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Zustand
- **Backend**: Fastify, Prisma, PostgreSQL, Redis
- **VM Layer**: Proxmox VE API
- **Security**: WireGuard VPN, nftables, JWT

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
cd apps/api
npx prisma migrate dev
npx prisma generate

# Start development servers
npm run dev
```

### Docker Setup

```bash
# Start infrastructure services
cd infra/docker
docker-compose up -d

# Start applications
npm run dev
```

## Project Structure

```
gpu-marketplace/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
├── agent/            # GPU host agent
├── packages/         # Shared packages
├── infra/            # Infrastructure configs
└── docs/             # Documentation
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [SSH Flow](./docs/SSH_FLOW.md)
- [Host Onboarding](./docs/HOST_ONBOARDING.md)

## License

MIT
