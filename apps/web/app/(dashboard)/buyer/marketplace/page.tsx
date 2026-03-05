'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface GPU {
  id: string;
  name: string;
  model: string;
  vramGB: number;
  pricePerHourUSD: number;
  status: string;
  host: {
    name: string;
    email: string;
  };
}

export default function MarketplacePage() {
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGPUs();
  }, []);

  const loadGPUs = async () => {
    try {
      const data = await apiClient.get<{ gpus: GPU[] }>('/api/gpu/list');
      setGpus(data.gpus);
    } catch (err) {
      console.error('Failed to load GPUs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">GPU Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gpus.map((gpu) => (
          <div key={gpu.id} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{gpu.name}</h2>
            <p className="text-muted-foreground mb-2">{gpu.model}</p>
            <p className="mb-2">VRAM: {gpu.vramGB} GB</p>
            <p className="text-2xl font-bold mb-4">${gpu.pricePerHourUSD}/hour</p>
            <Link
              href={`/buyer/vm/provision?gpuId=${gpu.id}`}
              className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Rent GPU
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
