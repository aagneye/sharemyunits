'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Cpu, Zap, DollarSign, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

export default function MarketplacePage() {
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minVRAM, setMinVRAM] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    loadGPUs();
  }, []);

  const loadGPUs = async () => {
    try {
      const params = new URLSearchParams({ status: 'AVAILABLE' });
      if (minVRAM) params.set('minVRAM', minVRAM);
      if (maxPrice) params.set('maxPrice', maxPrice);
      const data = await apiClient.get<{ gpus: GPU[] }>(`/api/gpu/list?${params}`);
      setGpus(data.gpus);
    } catch (err) {
      console.error('Failed to load GPUs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadGPUs();
  };

  const filtered = gpus.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.model.toLowerCase().includes(q);
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Cpu className="w-7 h-7" />
          GPU Marketplace
        </h1>
        <p className="text-muted-foreground mt-1">Browse and rent available GPU computing power</p>
      </div>

      <div className="border rounded-xl p-4 bg-white dark:bg-slate-900 mb-6">
        <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
              <Search className="w-3 h-3" /> Search
            </label>
            <Input
              placeholder="GPU name or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-36">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Min VRAM (GB)
            </label>
            <Input
              type="number"
              placeholder="e.g. 8"
              value={minVRAM}
              onChange={(e) => setMinVRAM(e.target.value)}
              min={1}
            />
          </div>
          <div className="w-36">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Max Price ($/hr)
            </label>
            <Input
              type="number"
              placeholder="e.g. 5.00"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
              step="0.01"
            />
          </div>
          <Button type="submit" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Apply Filters
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Loading GPUs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Cpu className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No GPUs available</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{filtered.length} GPU{filtered.length !== 1 ? 's' : ''} available</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((gpu) => (
              <div key={gpu.id} className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{gpu.name}</h2>
                    <p className="text-sm text-muted-foreground">{gpu.model}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
                    <Zap className="w-3 h-3" />
                    Available
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">VRAM</p>
                    <p className="font-semibold">{gpu.vramGB} GB</p>
                  </div>
                  {gpu.cudaCores && (
                    <div>
                      <p className="text-muted-foreground">CUDA Cores</p>
                      <p className="font-semibold">{gpu.cudaCores.toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Hosted by</p>
                    <p className="font-medium truncate">{gpu.host.name || gpu.host.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    <span className="text-2xl font-bold">{gpu.pricePerHourUSD.toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm">/hr</span>
                  </div>
                  <Link
                    href={`/buyer/vm/provision?gpuId=${gpu.id}`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Rent Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
