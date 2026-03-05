# GPU Host Onboarding Guide

## Prerequisites

- GPU-enabled machine (NVIDIA/AMD)
- Proxmox VE installed (or libvirt)
- Ubuntu/Debian-based OS
- Root/administrator access
- Static IP address or domain name

## Installation Steps

### 1. Install Dependencies

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Proxmox tools (if using Proxmox)
sudo apt-get install -y proxmox-ve
```

### 2. Install GPU Agent

```bash
# Clone agent repository
git clone <agent-repo-url>
cd agent

# Install dependencies
npm install

# Build
npm run build
```

### 3. Configure Environment

Create `.env` file:

```env
API_URL=https://platform.example.com
GPU_ID=your-gpu-id-from-platform
```

### 4. Set Up WireGuard VPN

```bash
# Install WireGuard
sudo apt-get install -y wireguard

# Generate keys
wg genkey | tee private.key | wg pubkey > public.key

# Configure (use template from infra/wireguard/)
sudo cp wg0.conf /etc/wireguard/
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

### 5. Configure Firewall

```bash
# Install nftables
sudo apt-get install -y nftables

# Configure rules (see firewall-manager.ts)
sudo nft -f /etc/nftables.conf
```

### 6. Register GPU on Platform

1. Log in to platform as HOST
2. Navigate to "Add GPU"
3. Enter GPU details:
   - Name
   - Model
   - VRAM
   - Price per hour
   - Host IP
   - Proxmox node (if applicable)

### 7. Start Agent

```bash
# Run agent
npm start

# Or use PM2 for production
pm2 start dist/index.js --name gpu-agent
pm2 save
pm2 startup
```

## Verification

### Check Agent Connection

```bash
# Agent should connect to platform
# Check logs for "Agent connected to platform"
```

### Test GPU Reporting

- Agent reports GPU metrics every 5 seconds
- Check platform dashboard for GPU status

### Test VM Provisioning

1. Create test rental on platform
2. Verify VM is created on Proxmox
3. Check firewall rules are applied

## Troubleshooting

### Agent Not Connecting

- Check API_URL is correct
- Verify GPU_ID matches platform
- Check firewall allows outbound connections
- Verify WireGuard VPN is active

### GPU Metrics Not Reporting

- Verify GPU is detected: `nvidia-smi` or `rocm-smi`
- Check systeminformation can access GPU
- Review agent logs for errors

### VM Provisioning Fails

- Verify Proxmox API credentials
- Check Proxmox node is accessible
- Review Proxmox logs
- Verify sufficient resources (RAM, disk)

## Security Checklist

- [ ] WireGuard VPN configured and active
- [ ] Firewall rules configured (nftables)
- [ ] SSH access restricted to platform IP
- [ ] Proxmox API secured with tokens
- [ ] Agent runs as non-root user (recommended)
- [ ] Logs don't contain sensitive information
- [ ] Regular security updates applied

## Monitoring

- GPU utilization
- Temperature
- VRAM usage
- System resources (CPU, RAM, disk)
- Network connectivity
- VM status

## Support

For issues, contact platform support or check documentation.
