'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Server, Cpu, Clock, Key, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface VMDetail {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalCostUSD: number;
  gpu: { name: string; model: string; vramGB: number };
  vm: {
    id: string;
    ipAddress: string | null;
    status: string;
    vmName: string;
    sshPort: number;
    provisionedAt: string | null;
  } | null;
  payment: { status: string } | null;
}

const vmStatusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PROVISIONING: { label: 'Provisioning', color: 'text-yellow-600', icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
  RUNNING: { label: 'Running', color: 'text-green-600', icon: <CheckCircle className="w-4 h-4" /> },
  STOPPED: { label: 'Stopped', color: 'text-slate-500', icon: <XCircle className="w-4 h-4" /> },
  TERMINATED: { label: 'Terminated', color: 'text-red-600', icon: <XCircle className="w-4 h-4" /> },
  FAILED: { label: 'Failed', color: 'text-red-600', icon: <AlertCircle className="w-4 h-4" /> },
};

export default function VMDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rentalId = params.id as string;
  const [rental, setRental] = useState<VMDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadVMStatus();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [rentalId]);

  const loadVMStatus = async () => {
    try {
      const data = await apiClient.get<{ rental: VMDetail }>(`/api/vm/${rentalId}/status`);
      setRental(data.rental);

      if (data.rental.vm?.status === 'PROVISIONING') {
        if (!pollingRef.current) {
          pollingRef.current = setInterval(async () => {
            const refreshed = await apiClient.get<{ rental: VMDetail }>(`/api/vm/${rentalId}/status`);
            setRental(refreshed.rental);
            if (refreshed.rental.vm?.status !== 'PROVISIONING') {
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          }, 5000);
        }
      }
    } catch (err) {
      console.error('Failed to load VM status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this VM? This action cannot be undone.')) return;
    setTerminating(true);
    try {
      await apiClient.post(`/api/vm/${rentalId}/terminate`);
      await loadVMStatus();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate VM');
    } finally {
      setTerminating(false);
    }
  };

  const handleDownloadSSHKey = async () => {
    setDownloadingKey(true);
    try {
      const session = await import('next-auth/react').then((m) => m.getSession());
      const token = (session as any)?.accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/vm/ssh-credentials/${rentalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gpu-key-${rentalId.slice(0, 8)}.pem`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download SSH key');
    } finally {
      setDownloadingKey(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading VM details...
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <p className="text-lg font-medium">VM not found</p>
        <Link href="/buyer/my-rentals">
          <Button className="mt-4">Back to My Rentals</Button>
        </Link>
      </div>
    );
  }

  const vmStatus = rental.vm ? vmStatusMap[rental.vm.status] : null;
  const isActive = rental.status === 'ACTIVE';
  const isRunning = rental.vm?.status === 'RUNNING';

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/buyer/my-rentals" className="text-muted-foreground hover:text-foreground text-sm">
          My Rentals
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">VM Details</span>
      </div>

      <h1 className="text-3xl font-bold mb-6">VM Details</h1>

      <div className="grid gap-4 mb-6">
        <div className="border rounded-xl p-6 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            GPU: {rental.gpu.name}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">{rental.gpu.model}</p>
            </div>
            <div>
              <p className="text-muted-foreground">VRAM</p>
              <p className="font-medium">{rental.gpu.vramGB} GB</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Period</p>
              <p className="font-medium">
                {new Date(rental.startTime).toLocaleDateString()} → {new Date(rental.endTime).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Cost</p>
              <p className="font-semibold">${rental.totalCostUSD.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {rental.vm ? (
          <div className="border rounded-xl p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                Virtual Machine
              </h2>
              {vmStatus && (
                <span className={`flex items-center gap-1.5 font-medium ${vmStatus.color}`}>
                  {vmStatus.icon}
                  {vmStatus.label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-muted-foreground">VM Name</p>
                <p className="font-mono font-medium">{rental.vm.vmName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SSH Port</p>
                <p className="font-mono font-medium">{rental.vm.sshPort}</p>
              </div>
              {rental.vm.ipAddress && (
                <div>
                  <p className="text-muted-foreground">IP Address</p>
                  <p className="font-mono font-medium">{rental.vm.ipAddress}</p>
                </div>
              )}
              {rental.vm.provisionedAt && (
                <div>
                  <p className="text-muted-foreground">Provisioned</p>
                  <p className="font-medium">{new Date(rental.vm.provisionedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            {rental.vm.ipAddress && isRunning && (
              <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-3 mb-4">
                <p className="text-xs text-slate-400 mb-1">SSH Command</p>
                <code className="text-sm text-green-400 font-mono">
                  ssh -i gpu-key-{rentalId.slice(0, 8)}.pem -p {rental.vm.sshPort} user@{rental.vm.ipAddress}
                </code>
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-xl p-6 bg-slate-50 dark:bg-slate-900/50 text-center text-muted-foreground">
            <Server className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>VM not yet provisioned</p>
          </div>
        )}

        {isActive && (
          <div className="border rounded-xl p-6 bg-white dark:bg-slate-900">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" />
              SSH Access
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Download your private SSH key. This key can only be downloaded once and will be permanently deleted afterward.
            </p>
            <Button
              onClick={handleDownloadSSHKey}
              disabled={downloadingKey || !isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              {downloadingKey ? 'Downloading...' : isRunning ? 'Download SSH Key (one-time)' : 'SSH key available when VM is running'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link href="/buyer/my-rentals">
          <Button variant="outline">Back to Rentals</Button>
        </Link>
        {isActive && (
          <Button
            onClick={handleTerminate}
            disabled={terminating}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:border-red-300"
          >
            {terminating ? 'Terminating...' : 'Terminate VM'}
          </Button>
        )}
      </div>
    </div>
  );
}
