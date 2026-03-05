# GPU Marketplace Architecture

## Overview

Decentralized platform where institutions can host unused GPUs for public rental with payment processing.

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - SSR, SEO, API routes
- **Tailwind CSS + shadcn/ui** - Styling
- **Zustand** - State management
- **NextAuth.js** - Authentication
- **Stripe** - Payment processing
- **Socket.io** - Real-time updates

### Backend
- **Node.js + Fastify** - High-performance REST/WebSocket API
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **Redis** - Caching, sessions, queues
- **BullMQ** - Job queue for VM provisioning
- **JWT** - Authentication tokens

### GPU/VM Orchestration
- **Proxmox VE API** - VM management
- **libvirt** - Alternative VM layer
- **node-forge + ssh2** - SSH keypair generation
- **Custom Agent** - Runs on GPU host machines

### Security
- **Ed25519 SSH keys** - Generated server-side
- **WireGuard VPN** - Secure tunnel to GPU hosts
- **nftables** - VM firewall isolation
- **Rate limiting** - Redis-based
- **HTTPS only** - TLS encryption

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│  Next.js    │◄──┐
│  Frontend   │   │ WebSocket
└──────┬──────┘   │
       │          │
       │ API      │
       ▼          │
┌─────────────┐   │
│   Fastify   │───┘
│   Backend   │
└──────┬──────┘
       │
       ├──► PostgreSQL (Users, GPUs, Rentals, Payments)
       ├──► Redis (Cache, Sessions, Queues)
       │
       │ WebSocket
       ▼
┌─────────────┐
│ GPU Agent   │
│ (on host)   │
└──────┬──────┘
       │
       ├──► Proxmox API
       ├──► GPU Metrics
       └──► nftables (Firewall)
```

## Data Flow

### GPU Rental Flow

1. Buyer browses available GPUs
2. Buyer selects GPU and duration
3. Payment processed via Stripe
4. Stripe webhook triggers VM provisioning
5. Backend generates Ed25519 SSH keypair
6. VM provisioned on GPU host via Proxmox
7. Public key injected into VM's authorized_keys
8. Private key sent to buyer (one-time download)
9. Buyer receives VM IP and SSH access
10. Rental expires → VM terminated automatically

### SSH Key Flow

1. Backend generates Ed25519 keypair (node-forge)
2. Public key → stored in database
3. Public key → injected into VM's authorized_keys
4. Private key → encrypted and stored temporarily
5. Buyer downloads private key via HTTPS
6. Private key deleted from server after download
7. Buyer uses key: `ssh -i key.pem user@<VM_IP>`

## Security Considerations

- SSH keys generated server-side, never exposed
- Private keys deleted after one-time download
- VM isolation via nftables firewall rules
- WireGuard VPN for secure host communication
- Rate limiting on all API endpoints
- JWT tokens with refresh mechanism
- Role-based access control (RBAC)
