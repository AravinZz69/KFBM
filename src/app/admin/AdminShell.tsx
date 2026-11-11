'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  MessageSquare,
  Users,
  LogOut,
  School,
  Menu,
  X,
  Shield,
  ExternalLink,
} from 'lucide-react';
import type { AdminSessionUser } from '@/lib/auth';

export default function AdminShell({
  admin,
  children,
}: {
  admin: AdminSessionUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // If on login page, just show the login content
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-[#123B70] text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="bg-white px-2 py-1 rounded-lg shadow-xs flex items-center justify-center">
            <img src="/kiet-logo.png" alt="KIET Logo" className="h-6 w-auto object-contain" />
          </div>
          <span className="font-bold text-base">KIET Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-[#123B70] text-white shrink-0 border-r border-[#0E2E57] shadow-xl z-30`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="bg-white px-2.5 py-1.5 rounded-xl border border-white/15 shadow-sm shrink-0 flex items-center justify-center">
            <img src="/kiet-logo.png" alt="KIET Logo" className="h-7 w-auto object-contain" />
          </div>
          <div>
            <h2 className="font-bold text-base tracking-tight leading-none text-white">KIET Group</h2>
            <p className="text-[11px] text-blue-200 font-medium mt-1">Admin Feedback Control</p>
          </div>
        </div>

        {/* Admin User Card */}
        {admin && (
          <div className="px-5 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {admin.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{admin.name}</p>
                <p className="text-[10px] text-blue-200 truncate">{admin.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Neon Auth Verified
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          <a
            href="/admin"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition bg-white/15 text-white shadow-xs"
          >
            <BarChart3 className="w-4 h-4 text-blue-300" />
            <span>Dashboard &amp; Feedback</span>
          </a>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-blue-200 hover:bg-white/10 transition mt-4"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Open Student Portal
            </span>
          </a>
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-400/20 transition cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Admin View */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
