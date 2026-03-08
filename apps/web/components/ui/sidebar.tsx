'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, Cpu, ShoppingCart, Receipt, Settings, Users, LogOut, Server, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const buyerNav: NavItem[] = [
  { label: 'Marketplace', href: '/buyer/marketplace', icon: <ShoppingCart className="w-4 h-4" /> },
  { label: 'My Rentals', href: '/buyer/my-rentals', icon: <Receipt className="w-4 h-4" /> },
];

const hostNav: NavItem[] = [
  { label: 'Dashboard', href: '/host/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'My GPUs', href: '/host/my-gpus', icon: <Cpu className="w-4 h-4" /> },
  { label: 'Add GPU', href: '/host/add-gpu', icon: <PlusCircle className="w-4 h-4" /> },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
  { label: 'GPUs', href: '/admin/gpus', icon: <Server className="w-4 h-4" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'BUYER';

  const navItems =
    role === 'ADMIN' ? adminNav : role === 'HOST' ? hostNav : buyerNav;

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <Link href="/" className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-lg">GPU Market</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || session?.user?.email}</p>
            <p className="text-xs text-slate-400">{role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
