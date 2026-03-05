'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Rental {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalCostUSD: number;
  gpu: {
    name: string;
    model: string;
  };
  vm: {
    id: string;
    ipAddress: string;
    status: string;
  } | null;
}

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>([]);
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
      <h1 className="text-3xl font-bold mb-6">My Rentals</h1>
      {rentals.length === 0 ? (
        <p className="text-muted-foreground">No active rentals</p>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => (
            <div key={rental.id} className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">
                {rental.gpu.name} - {rental.gpu.model}
              </h2>
              <p className="text-muted-foreground mb-2">
                Status: {rental.status}
              </p>
              {rental.vm && (
                <div className="mb-4">
                  <p>VM IP: {rental.vm.ipAddress}</p>
                  <Link
                    href={`/buyer/vm/${rental.id}`}
                    className="text-primary hover:underline"
                  >
                    View VM Details
                  </Link>
                </div>
              )}
              <p className="font-semibold">Total Cost: ${rental.totalCostUSD}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
