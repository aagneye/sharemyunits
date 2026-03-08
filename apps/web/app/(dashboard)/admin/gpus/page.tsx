'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Server, Search, Zap, Power, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface GPU {
  id: string;
  name: string;
  model: string;
  vramGB: number;
  pricePerHourUSD: number;
  status: 'AVAILABLE' | 'IN_USE' | 'OFFLINE' | 'MAINTENANCE';
  createdAt: string;
  host: { id: string; email: string; name: string | null };
  _count: { rentals: number };
}

const statusConfig = {
  AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-700', icon: <Zap className="w-3 h-3" /> },
  IN_USE: { label: 'In Use', color: 'bg-blue-100 text-blue-700', icon: <Power className="w-3 h-3" /> },
  OFFLINE: { label: 'Offline', color: 'bg-slate-100 text-slate-600', icon: <Power className="w-3 h-3" /> },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-700', icon: <Wrench className="w-3 h-3" /> },
};

export default function AdminGPUsPage() {
  const [gpus, setGpus] = useState<GPU[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ gpus: GPU[] }>('/api/admin/gpus')
      .then((d) => setGpus(d.gpus))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingStatus(id);
    try {
      const data = await apiClient.put<{ gpu: GPU }>(`/api/admin/gpus/${id}/status`, { status });
      setGpus((prev) => prev.map((g) => (g.id === id ? { ...g, status: data.gpu.status } : g)));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filtered = gpus.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.model.toLowerCase().includes(q) ||
      g.host.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Server className="w-7 h-7" />
          GPU Management
        </h1>
        <p className="text-muted-foreground mt-1">{gpus.length} total GPUs across all hosts</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, model, or host..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 dark:bg-slate-800">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">GPU</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Host</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">VRAM</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price/hr</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Rentals</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No GPUs found
                </td>
              </tr>
            ) : (
              filtered.map((gpu) => {
                const sc = statusConfig[gpu.status];
                return (
                  <tr key={gpu.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{gpu.name}</p>
                        <p className="text-muted-foreground text-xs">{gpu.model}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground">{gpu.host.name || gpu.host.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{gpu.vramGB} GB</td>
                    <td className="px-4 py-3">${gpu.pricePerHourUSD.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                        {sc.icon}
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{gpu._count.rentals}</td>
                    <td className="px-4 py-3">
                      {gpu.status !== 'IN_USE' ? (
                        <select
                          value={gpu.status}
                          onChange={(e) => handleStatusChange(gpu.id, e.target.value)}
                          disabled={updatingStatus === gpu.id}
                          className="text-xs border rounded px-2 py-1 bg-background disabled:opacity-50"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="OFFLINE">OFFLINE</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      ) : (
                        <span className="text-xs text-muted-foreground">In use</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
