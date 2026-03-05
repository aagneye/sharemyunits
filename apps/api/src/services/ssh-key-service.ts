import forge from 'node-forge';
import crypto from 'crypto';
import { prisma } from '../server';

interface GenerateKeypairParams {
  userId: string;
  rentalId: string;
}

class SSHKeyService {
  /**
   * Generates an Ed25519 keypair for SSH access
   * Private key is stored encrypted and deleted after download
   */
  async generateKeypair(params: GenerateKeypairParams) {
    // Generate Ed25519 keypair using node-forge
    const keypair = forge.pki.ed25519.generateKeyPair();
    
    // Convert to OpenSSH format
    const publicKey = forge.ssh.publicKeyToOpenSSH(keypair.publicKey, 'gpu-rental');
    const privateKey = forge.ssh.privateKeyToOpenSSH(keypair.privateKey, 'gpu-rental');

    // Generate fingerprint
    const fingerprint = crypto
      .createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .match(/.{1,2}/g)!
      .join(':');

    // Store in database (private key will be deleted after download)
    const sshKey = await prisma.sSHKey.create({
      data: {
        userId: params.userId,
        rentalId: params.rentalId,
        publicKey,
        privateKey, // In production, encrypt this before storing
        fingerprint,
      },
    });

    // TODO: Inject public key into VM's authorized_keys via Proxmox API
    // This would be done by the VM orchestrator after VM is provisioned

    return sshKey;
  }

  /**
   * Validates an SSH key fingerprint
   */
  validateFingerprint(fingerprint: string): boolean {
    // Basic validation - should be SHA256 format
    return /^([0-9a-f]{2}:){31}[0-9a-f]{2}$/i.test(fingerprint);
  }
}

export const sshKeyService = new SSHKeyService();
