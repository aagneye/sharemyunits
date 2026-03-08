'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Users, Shield, ShoppingCart, Server, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'BUYER' | 'HOST' | 'ADMIN';
  createdAt: string;
  _count: { ownedGPUs: number; rentals: number };
}

const roleColors = {
  BUYER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  HOST: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const roleIcons = {
  BUYER: <ShoppingCart className="w-3 h-3" />,
  HOST: <Server className="w-3 h-3" />,
  ADMIN: <Shield className="w-3 h-3" />,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ users: User[] }>('/api/admin/users')
      .then((d) => setUsers(d.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'BUYER' | 'HOST' | 'ADMIN') => {
    setUpdatingRole(userId);
    try {
      const data = await apiClient.put<{ user: User }>(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">{users.length} total users</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 dark:bg-slate-800">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">GPUs</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Rentals</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{user.name || '—'}</p>
                      <p className="text-muted-foreground text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {roleIcons[user.role]}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{user._count.ownedGPUs}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{user._count.rentals}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                      disabled={updatingRole === user.id}
                      className="text-xs border rounded px-2 py-1 bg-background disabled:opacity-50"
                    >
                      <option value="BUYER">BUYER</option>
                      <option value="HOST">HOST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
