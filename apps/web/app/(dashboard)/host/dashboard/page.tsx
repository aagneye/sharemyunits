'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { LayoutDashboard, Cpu, DollarSign, Activity, TrendingUp, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HostStats {
  activeGPUs: number;
  inUseGPUs: number;
  totalGPUs: number;
  activeRentals: number;
  totalRentals: number;
  totalEarnings: number;
  availableBalance: number;
}

export default function HostDashboardPage() {
  const [stats, setStats] = useState<HostStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ stats: HostStats }>('/api/host/stats')
      .then((d) => setStats(d.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: 'Total Earnings',
      value: stats ? `$${stats.totalEarnings.toFixed(2)}` : '$0.00',
      sub: stats ? `$${stats.availableBalance.toFixed(2)} available to withdraw` : '',
      icon: <DollarSign className="w-5 h-5 text-green-500" />,
      bg: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      label: 'Active GPUs',
      value: stats ? String(stats.activeGPUs) : '0',
      sub: stats ? `${stats.inUseGPUs} currently rented · ${stats.totalGPUs} total` : '',
      icon: <Cpu className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      label: 'Active Rentals',
      value: stats ? String(stats.activeRentals) : '0',
      sub: stats ? `${stats.totalRentals} total rentals` : '',
      icon: <Activity className="w-5 h-5 text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      label: 'Available Balance',
      value: stats ? `$${stats.availableBalance.toFixed(2)}` : '$0.00',
      sub: 'Ready to withdraw',
      icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
      bg: 'bg-orange-50 dark:bg-orange-950/20',
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7" />
            Host Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Overview of your GPU hosting activity</p>
        </div>
        <Link href="/host/add-gpu">
          <Button className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Add GPU
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-xl p-6 animate-pulse bg-slate-100 dark:bg-slate-800 h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className={`border rounded-xl p-6 ${card.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                {card.icon}
              </div>
              <p className="text-3xl font-bold mb-1">{card.value}</p>
              {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/host/add-gpu" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <PlusCircle className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Register a new GPU</p>
                <p className="text-xs text-muted-foreground">Make your hardware available for rental</p>
              </div>
            </Link>
            <Link href="/host/my-gpus" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Cpu className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Manage your GPUs</p>
                <p className="text-xs text-muted-foreground">View status, update availability</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="border rounded-xl p-6 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold mb-4">Earnings Summary</h2>
          {stats ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-semibold">${stats.totalEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Paid Out</span>
                <span className="font-semibold">${(stats.totalEarnings - stats.availableBalance).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground font-medium">Available to Withdraw</span>
                <span className="font-bold text-green-600">${stats.availableBalance.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No earnings data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
