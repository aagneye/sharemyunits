'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function VMDetailsPage() {
  const params = useParams();
  const rentalId = params.id as string;
  const [vm, setVm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVMStatus();
  }, [rentalId]);

  const loadVMStatus = async () => {
    try {
      const data = await apiClient.get(`/api/vm/${rentalId}/status`);
      setVm(data.rental);
    } catch (err) {
      console.error('Failed to load VM status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!vm) {
    return <div className="p-8">VM not found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">VM Details</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Status</h2>
          <p>{vm.vm?.status || 'PROVISIONING'}</p>
        </div>
        {vm.vm?.ipAddress && (
          <div>
            <h2 className="text-xl font-semibold">IP Address</h2>
            <p>{vm.vm.ipAddress}</p>
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">SSH Access</h2>
          <p className="text-muted-foreground mb-2">
            Download your SSH key to access the VM
          </p>
          <a
            href={`/api/vm/ssh-credentials/${rentalId}`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Download SSH Key
          </a>
        </div>
      </div>
    </div>
  );
}
