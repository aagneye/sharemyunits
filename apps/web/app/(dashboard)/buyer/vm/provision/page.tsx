'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cpu, Clock, DollarSign, Zap, AlertCircle } from 'lucide-react';

interface GPU {
  id: string;
  name: string;
  model: string;
  vramGB: number;
  cudaCores: number | null;
  pricePerHourUSD: number;
  status: string;
  host: { name: string | null; email: string };
}

function ProvisionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gpuId = searchParams.get('gpuId');

  const [gpu, setGpu] = useState<GPU | null>(null);
  const [durationHours, setDurationHours] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gpuId) {
      router.push('/buyer/marketplace');
      return;
    }
    loadGPU();
  }, [gpuId]);

  const loadGPU = async () => {
    try {
      const data = await apiClient.get<{ gpus: GPU[] }>(`/api/gpu/list`);
      const found = data.gpus.find((g) => g.id === gpuId);
      if (!found) {
        router.push('/buyer/marketplace');
        return;
      }
      setGpu(found);
    } catch {
      router.push('/buyer/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = gpu ? (gpu.pricePerHourUSD * durationHours).toFixed(2) : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpu) return;
    setError('');
    setSubmitting(true);

    try {
      const rentalData = await apiClient.post<{ rental: { id: string } }>(
        '/api/vm/provision',
        { gpuId: gpu.id, durationHours }
      );

      const checkoutData = await apiClient.post<{ url: string }>(
        '/api/payment/checkout',
        { rentalId: rentalData.rental.id }
      );

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        router.push('/buyer/my-rentals');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create rental');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading GPU details...</div>
      </div>
    );
  }

  if (!gpu) return null;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Rent GPU</h1>
      <p className="text-muted-foreground mb-8">Configure your rental and proceed to payment</p>

      <div className="border rounded-xl p-6 mb-6 bg-white dark:bg-slate-900">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          {gpu.name}
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{gpu.model}</p>
          </div>
          <div>
            <p className="text-muted-foreground">VRAM</p>
            <p className="font-medium">{gpu.vramGB} GB</p>
          </div>
          {gpu.cudaCores && (
            <div>
              <p className="text-muted-foreground">CUDA Cores</p>
              <p className="font-medium">{gpu.cudaCores.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Hosted by</p>
            <p className="font-medium">{gpu.host.name || gpu.host.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="duration" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duration (hours)
          </Label>
          <Input
            id="duration"
            type="number"
            min={1}
            max={168}
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
            required
          />
          <p className="text-xs text-muted-foreground">1 hour minimum, 168 hours (7 days) maximum</p>
        </div>

        <div className="border rounded-xl p-6 bg-blue-50 dark:bg-blue-950/30">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            Order Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per hour</span>
              <span>${gpu.pricePerHourUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span>{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-blue-600 dark:text-blue-400">${totalCost}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {submitting ? 'Processing...' : `Pay $${totalCost} & Rent`}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ProvisionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading...</div></div>}>
      <ProvisionContent />
    </Suspense>
  );
}
