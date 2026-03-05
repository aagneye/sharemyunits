# SSH Access Flow

## Overview

Secure SSH access is provided to buyers through server-generated Ed25519 keypairs. The private key is delivered once via HTTPS and then permanently deleted.

## Flow Diagram

```
┌─────────┐    1. Payment     ┌─────────┐
│ Buyer   │───────────────────►│ Stripe  │
└─────────┘                    └────┬────┘
                                    │
                                    │ 2. Webhook
                                    ▼
                            ┌──────────────┐
                            │   Backend    │
                            └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
           3. Generate     4. Provision    5. Inject
           Keypair          VM              Public Key
                    │              │              │
                    ▼              ▼              ▼
            ┌─────────────┐ ┌──────────┐ ┌─────────────┐
            │ Ed25519     │ │ Proxmox  │ │ authorized_ │
            │ Keypair     │ │ API      │ │ keys        │
            └──────┬───────┘ └──────────┘ └─────────────┘
                   │
                   │ 6. Store (temporary)
                   ▼
            ┌─────────────┐
            │  Database   │
            │ (encrypted) │
            └──────┬──────┘
                   │
                   │ 7. Download (HTTPS)
                   ▼
            ┌─────────────┐
            │   Buyer     │
            └──────┬──────┘
                   │
                   │ 8. Delete private key
                   ▼
            ┌─────────────┐
            │  Database   │
            │ (deleted)   │
            └─────────────┘
```

## Step-by-Step Process

### 1. Payment Completion
- Buyer completes Stripe checkout
- Stripe sends webhook to backend

### 2. VM Provisioning
- Backend receives webhook
- Creates rental record
- Queues VM provisioning job

### 3. SSH Key Generation
```typescript
// Backend generates Ed25519 keypair
const keypair = forge.pki.ed25519.generateKeyPair();
const publicKey = forge.ssh.publicKeyToOpenSSH(keypair.publicKey);
const privateKey = forge.ssh.privateKeyToOpenSSH(keypair.privateKey);
```

### 4. VM Provisioning
- Backend calls Proxmox API
- Creates VM on GPU host
- Configures GPU passthrough

### 5. Public Key Injection
- Public key added to VM's `~/.ssh/authorized_keys`
- Done via Proxmox API or SSH

### 6. Private Key Storage
- Private key encrypted and stored in database
- Marked as `downloaded: false`

### 7. Key Download
- Buyer accesses download URL
- Backend verifies authentication
- Returns private key as `.pem` file
- Marks key as `downloaded: true`
- **Deletes private key from database**

### 8. Buyer Access
```bash
# Buyer uses downloaded key
chmod 600 key.pem
ssh -i key.pem user@<VM_IP>
```

## Security Features

- **Server-side generation**: Keys never exposed during generation
- **One-time download**: Private key deleted after download
- **HTTPS only**: Secure transmission
- **Ed25519**: Modern, secure key algorithm
- **Fingerprint validation**: Prevents key tampering

## Key Storage

```typescript
interface SSHKey {
  id: string;
  userId: string;
  rentalId: string;
  publicKey: string;      // Stored permanently
  privateKey: string;     // Deleted after download
  fingerprint: string;    // SHA256 hash
  downloaded: boolean;
  downloadedAt?: Date;
}
```

## Error Handling

- If download fails, key remains available for retry
- Maximum retry attempts: 3
- After max retries, new keypair generated
- Old keypair invalidated
