'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Receipt, Cpu, Clock, DollarSign, Server, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Rental {
  id: string;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  totalCostUSD: number;
  gpu: { name: string; model: string; vramGB: number };
  vm: { id: string; ipAddress: string | null; status: string; vmName: string } | null;
  payment: { status: string; paidAt: string | null } | null;
}

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  EXPIRED: { label: 'Expired', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: <Clock className="w-3 h-3" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
};

const vmStatusConfig: Record<string, string> = {
  PROVISIONING: 'bg-yellow-100 text-yellow-700',
  RUNNING: 'bg-green-100 text-green-700',
  STOPPED: 'bg-slate-100 text-slate-600',
  TERMINATED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'>('ALL');
  const [terminating, setTerminating] = useState<string | null>(null);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      const data = await apiClient.get<{ rentals: Rental[] }>('/api/rental/my-rentals');
      setRentals(data.rentals);
    } catch (err) {
      console.error('Failed to load rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (rentalId: string) => {
    if (!confirm('Terminate this rental? The VM will be shut down.')) return;
    setTerminating(rentalId);
    try {
      await apiClient.post(`/api/vm/${rentalId}/terminate`);
      await loadRentals();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate rental');
    } finally {
      setTerminating(null);
    }
  };

  const filtered = filter === 'ALL' ? rentals : rentals.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading rentals...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7" />
            My Rentals
          </h1>
          <p className="text-muted-foreground mt-1">{rentals.length} total rentals</p>
        </div>
        <Link href="/buyer/marketplace">
          <Button>Browse GPUs</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(['ALL', 'ACTIVE', 'EXPIRED', 'CANCELLED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            {s !== 'ALL' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({rentals.filter((r) => r.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No rentals found</p>
          <p className="text-sm mt-1">
            {filter === 'ALL'
              ? 'Visit the marketplace to rent your first GPU'
              : `No ${filter.toLowerCase()} rentals`}
          </p>
          {filter === 'ALL' && (
            <Link href="/buyer/marketplace">
              <Button className="mt-4">Browse Marketplace</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rental) => {
            const sc = statusConfig[rental.status];
            return (
              <div key={rental.id} className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      {rental.gpu.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{rental.gpu.model} · {rental.gpu.vramGB} GB VRAM</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                    {sc.icon}
                    {sc.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Start</p>
                    <p className="font-medium">{new Date(rental.startTime).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> End</p>
                    <p className="font-medium">{new Date(rental.endTime).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Total Cost</p>
                    <p className="font-semibold">${rental.totalCostUSD.toFixed(2)}</p>
                  </div>
                  {rental.payment && (
                    <div>
                      <p className="text-muted-foreground">Payment</p>
                      <p className={`font-medium ${rental.payment.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {rental.payment.status}
                      </p>
                    </div>
                  )}
                </div>

                {rental.vm && (
                  <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        VM: {rental.vm.vmName}
                      </p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${vmStatusConfig[rental.vm.status] || ''}`}>
                        {rental.vm.status}
                      </span>
                    </div>
                    {rental.vm.ipAddress && (
                      <p className="text-sm text-muted-foreground">IP: <span className="font-mono">{rental.vm.ipAddress}</span></p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {rental.vm && (
                    <Link href={`/buyer/vm/${rental.id}`}>
                      <Button variant="outline" size="sm">View VM Details</Button>
                    </Link>
                  )}
                  {rental.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTerminate(rental.id)}
                      disabled={terminating === rental.id}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      {terminating === rental.id ? 'Terminating...' : 'Terminate'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
