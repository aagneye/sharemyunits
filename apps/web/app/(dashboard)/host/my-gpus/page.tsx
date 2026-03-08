'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Cpu, PlusCircle, Zap, Power, Wrench, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GPU {
  id: string;
  name: string;
  model: string;
  vramGB: number;
  pricePerHourUSD: number;
  status: 'AVAILABLE' | 'IN_USE' | 'OFFLINE' | 'MAINTENANCE';
  rentals: { id: string }[];
  _count: { rentals: number };
}

const statusConfig = {
  AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <Zap className="w-3 h-3" /> },
  IN_USE: { label: 'In Use', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Power className="w-3 h-3" /> },
  OFFLINE: { label: 'Offline', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', icon: <Power className="w-3 h-3" /> },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Wrench className="w-3 h-3" /> },
};

export default function MyGPUsPage() {
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadGPUs();
  }, []);

  const loadGPUs = async () => {
    try {
      const data = await apiClient.get<{ gpus: GPU[] }>('/api/gpu/my-gpus');
      setGpus(data.gpus);
    } catch (err) {
      console.error('Failed to load GPUs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await apiClient.delete(`/api/gpu/${id}`);
      setGpus((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete GPU');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, status: 'AVAILABLE' | 'OFFLINE' | 'MAINTENANCE') => {
    setUpdatingStatus(id);
    try {
      await apiClient.put(`/api/gpu/${id}/status`, { status });
      setGpus((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading GPUs...
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cpu className="w-7 h-7" />
            My GPUs
          </h1>
          <p className="text-muted-foreground mt-1">{gpus.length} GPU{gpus.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link href="/host/add-gpu">
          <Button className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Add GPU
          </Button>
        </Link>
      </div>

      {gpus.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl bg-white dark:bg-slate-900">
          <Cpu className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No GPUs registered yet</p>
          <p className="text-sm mt-1">Register your first GPU to start earning</p>
          <Link href="/host/add-gpu">
            <Button className="mt-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Register GPU
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {gpus.map((gpu) => {
            const sc = statusConfig[gpu.status];
            const activeRentals = gpu.rentals.length;
            return (
              <div key={gpu.id} className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{gpu.name}</h2>
                    <p className="text-sm text-muted-foreground">{gpu.model}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                    {sc.icon}
                    {sc.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">VRAM</p>
                    <p className="font-semibold">{gpu.vramGB} GB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-semibold">${gpu.pricePerHourUSD.toFixed(2)}/hr</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Active Rentals</p>
                    <p className="font-semibold">{activeRentals}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Rentals</p>
                    <p className="font-semibold">{gpu._count.rentals}</p>
                  </div>
                </div>

                {gpu.status !== 'IN_USE' && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Change status</label>
                    <div className="flex gap-1.5">
                      {(['AVAILABLE', 'OFFLINE', 'MAINTENANCE'] as const).filter((s) => s !== gpu.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(gpu.id, s)}
                          disabled={updatingStatus === gpu.id}
                          className="px-2.5 py-1 text-xs border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(gpu.id, gpu.name)}
                  disabled={deleting === gpu.id || gpu.status === 'IN_USE'}
                  className="w-full text-red-600 hover:text-red-700 hover:border-red-300 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  {deleting === gpu.id ? 'Deleting...' : gpu.status === 'IN_USE' ? 'In use — cannot delete' : 'Delete GPU'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
