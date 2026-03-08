'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { LayoutDashboard, Users, Cpu, Activity, DollarSign, Server } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalGPUs: number;
  totalRentals: number;
  activeRentals: number;
  totalRevenue: number;
  usersByRole: { role: string; _count: { id: number } }[];
  gpusByStatus: { status: string; _count: { id: number } }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ stats: AdminStats }>('/api/admin/stats')
      .then((d) => setStats(d.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getRoleCount = (role: string) =>
    stats?.usersByRole.find((r) => r.role === role)?._count.id ?? 0;

  const getGPUStatusCount = (status: string) =>
    stats?.gpusByStatus.find((s) => s.status === status)?._count.id ?? 0;

  const topCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <Users className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Total GPUs', value: stats?.totalGPUs ?? 0, icon: <Server className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-950/20' },
    { label: 'Active Rentals', value: stats?.activeRentals ?? 0, icon: <Activity className="w-5 h-5 text-green-500" />, bg: 'bg-green-50 dark:bg-green-950/20' },
    { label: 'Total Revenue', value: stats ? `$${stats.totalRevenue.toFixed(2)}` : '$0.00', icon: <DollarSign className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-950/20' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
        <LayoutDashboard className="w-7 h-7" />
        Admin Dashboard
      </h1>
      <p className="text-muted-foreground mb-8">Platform overview and statistics</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-xl p-6 animate-pulse bg-slate-100 dark:bg-slate-800 h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {topCards.map((card) => (
            <div key={card.label} className={`border rounded-xl p-6 ${card.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                {card.icon}
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Users by Role
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(['BUYER', 'HOST', 'ADMIN'] as const).map((role) => {
                const count = getRoleCount(role);
                const total = stats?.totalUsers || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{role}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-6 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-500" />
            GPUs by Status
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(['AVAILABLE', 'IN_USE', 'OFFLINE', 'MAINTENANCE'] as const).map((status) => {
                const count = getGPUStatusCount(status);
                const total = stats?.totalGPUs || 1;
                const pct = Math.round((count / total) * 100);
                const colors: Record<string, string> = {
                  AVAILABLE: 'bg-green-500',
                  IN_USE: 'bg-blue-500',
                  OFFLINE: 'bg-slate-400',
                  MAINTENANCE: 'bg-yellow-500',
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{status.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${colors[status]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Platform Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold">{stats?.totalRentals ?? 0}</p>
              <p className="text-muted-foreground mt-1">Total Rentals</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold">{getRoleCount('HOST')}</p>
              <p className="text-muted-foreground mt-1">Hosts</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold">{getGPUStatusCount('AVAILABLE')}</p>
              <p className="text-muted-foreground mt-1">Available GPUs</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-2xl font-bold">${stats?.totalRevenue.toFixed(0) ?? '0'}</p>
              <p className="text-muted-foreground mt-1">Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
