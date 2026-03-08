'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Cpu, AlertCircle, CheckCircle } from 'lucide-react';

export default function AddGPUPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    vramGB: '',
    cudaCores: '',
    memoryBandwidth: '',
    baseClockMHz: '',
    boostClockMHz: '',
    pricePerHourUSD: '',
    hostIP: '',
    proxmoxNode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/api/gpu/register', {
        name: formData.name,
        model: formData.model,
        vramGB: parseInt(formData.vramGB),
        cudaCores: formData.cudaCores ? parseInt(formData.cudaCores) : undefined,
        memoryBandwidth: formData.memoryBandwidth ? parseFloat(formData.memoryBandwidth) : undefined,
        baseClockMHz: formData.baseClockMHz ? parseFloat(formData.baseClockMHz) : undefined,
        boostClockMHz: formData.boostClockMHz ? parseFloat(formData.boostClockMHz) : undefined,
        pricePerHourUSD: parseFloat(formData.pricePerHourUSD),
        hostIP: formData.hostIP,
        proxmoxNode: formData.proxmoxNode || undefined,
      });
      router.push('/host/my-gpus');
    } catch (err: any) {
      setError(err.message || 'Failed to register GPU');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <PlusCircle className="w-7 h-7" />
        Register GPU
      </h1>
      <p className="text-muted-foreground mb-8">Make your GPU available for rental on the marketplace</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            GPU Details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="e.g. RTX 4090 Server" value={formData.name} onChange={set('name')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input id="model" placeholder="e.g. NVIDIA RTX 4090" value={formData.model} onChange={set('model')} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vramGB">VRAM (GB) *</Label>
              <Input id="vramGB" type="number" min={1} placeholder="24" value={formData.vramGB} onChange={set('vramGB')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cudaCores">CUDA Cores</Label>
              <Input id="cudaCores" type="number" min={1} placeholder="16384" value={formData.cudaCores} onChange={set('cudaCores')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseClockMHz">Base Clock (MHz)</Label>
              <Input id="baseClockMHz" type="number" min={1} placeholder="2235" value={formData.baseClockMHz} onChange={set('baseClockMHz')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="boostClockMHz">Boost Clock (MHz)</Label>
              <Input id="boostClockMHz" type="number" min={1} placeholder="2520" value={formData.boostClockMHz} onChange={set('boostClockMHz')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memoryBandwidth">Memory Bandwidth (GB/s)</Label>
            <Input id="memoryBandwidth" type="number" min={1} step="0.1" placeholder="1008" value={formData.memoryBandwidth} onChange={set('memoryBandwidth')} />
          </div>
        </div>

        <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 space-y-4">
          <h2 className="font-semibold">Pricing & Hosting</h2>

          <div className="space-y-2">
            <Label htmlFor="pricePerHourUSD">Price per Hour (USD) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="pricePerHourUSD"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="2.50"
                value={formData.pricePerHourUSD}
                onChange={set('pricePerHourUSD')}
                required
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostIP">Host IP Address *</Label>
            <Input id="hostIP" type="text" placeholder="192.168.1.100" value={formData.hostIP} onChange={set('hostIP')} required />
            <p className="text-xs text-muted-foreground">The IP address of the machine hosting this GPU</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proxmoxNode">Proxmox Node Name (optional)</Label>
            <Input id="proxmoxNode" placeholder="pve01" value={formData.proxmoxNode} onChange={set('proxmoxNode')} />
            <p className="text-xs text-muted-foreground">Leave empty if not using Proxmox for VM management</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {loading ? 'Registering...' : 'Register GPU'}
          </Button>
        </div>
      </form>
    </div>
  );
}
