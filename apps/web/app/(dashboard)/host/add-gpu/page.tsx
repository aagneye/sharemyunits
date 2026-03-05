'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function AddGPUPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    vramGB: '',
    pricePerHourUSD: '',
    hostIP: '',
    proxmoxNode: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await apiClient.post('/api/gpu/register', {
        ...formData,
        vramGB: parseInt(formData.vramGB),
        pricePerHourUSD: parseFloat(formData.pricePerHourUSD),
      });
      router.push('/host/my-gpus');
    } catch (err: any) {
      setError(err.message || 'Failed to register GPU');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Register GPU</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="name" className="block mb-2">
            GPU Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="model" className="block mb-2">
            Model
          </label>
          <input
            id="model"
            type="text"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="vramGB" className="block mb-2">
            VRAM (GB)
          </label>
          <input
            id="vramGB"
            type="number"
            value={formData.vramGB}
            onChange={(e) => setFormData({ ...formData, vramGB: e.target.value })}
            required
            min="1"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="pricePerHourUSD" className="block mb-2">
            Price per Hour (USD)
          </label>
          <input
            id="pricePerHourUSD"
            type="number"
            step="0.01"
            value={formData.pricePerHourUSD}
            onChange={(e) => setFormData({ ...formData, pricePerHourUSD: e.target.value })}
            required
            min="0.01"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="hostIP" className="block mb-2">
            Host IP Address
          </label>
          <input
            id="hostIP"
            type="text"
            value={formData.hostIP}
            onChange={(e) => setFormData({ ...formData, hostIP: e.target.value })}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="proxmoxNode" className="block mb-2">
            Proxmox Node (Optional)
          </label>
          <input
            id="proxmoxNode"
            type="text"
            value={formData.proxmoxNode}
            onChange={(e) => setFormData({ ...formData, proxmoxNode: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Register GPU
        </button>
      </form>
    </div>
  );
}
