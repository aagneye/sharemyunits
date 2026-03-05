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
}

export default function MyGPUsPage() {
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from API
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My GPUs</h1>
        <Link
          href="/host/add-gpu"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Add GPU
        </Link>
      </div>
      {gpus.length === 0 ? (
        <p className="text-muted-foreground">No GPUs registered</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gpus.map((gpu) => (
            <div key={gpu.id} className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">{gpu.name}</h2>
              <p className="text-muted-foreground mb-2">{gpu.model}</p>
              <p className="mb-2">VRAM: {gpu.vramGB} GB</p>
              <p className="text-2xl font-bold mb-2">${gpu.pricePerHourUSD}/hour</p>
              <p className="text-sm text-muted-foreground">Status: {gpu.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
