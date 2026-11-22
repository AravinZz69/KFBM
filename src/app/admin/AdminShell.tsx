'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Phone,
  Mail,
  ShieldCheck,
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
  const currentYear = new Date().getFullYear();

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col md:flex-row overflow-x-hidden w-full">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-20 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Topbar */}
      <div className="md:hidden bg-[#123B70] text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-30">
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-90 transition"
          aria-label="KIET Portal Home"
        >
          <div className="bg-white px-2 py-1 rounded-lg shadow-xs flex items-center justify-center">
            <img src="/kiet-logo.png" alt="KIET Logo" className="h-6 w-auto object-contain" width={24} height={24} />
          </div>
          <span className="font-bold text-base">KIET Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'fixed inset-y-0 left-0 w-72 z-30 flex' : 'hidden'
        } md:flex flex-col w-full md:w-64 bg-[#123B70] text-white shrink-0 border-r border-[#0E2E57] shadow-xl md:sticky md:top-0 md:h-screen md:overflow-y-auto`}
      >
        {/* Brand with Clickable Logo */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 hover:opacity-95 transition group"
            title="Return to Student Portal Home"
          >
            <div className="bg-white px-2.5 py-1.5 rounded-xl border border-white/15 shadow-sm shrink-0 flex items-center justify-center group-hover:scale-105 transition">
              <img src="/kiet-logo.png" alt="KIET Logo" className="h-7 w-auto object-contain" width={28} height={28} />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight leading-none text-white">KIET Group</h2>
              <p className="text-[11px] text-blue-200 font-medium mt-1">Admin Feedback Control</p>
            </div>
          </Link>
          {mobileMenuOpen && (
            <button
              type="button"
              onClick={closeMobileMenu}
              className="md:hidden p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              aria-label="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
              Authorized Access
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          <Link
            href="/admin"
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
              pathname === '/admin'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-300" />
            <span>Dashboard &amp; Feedback</span>
          </Link>

          <Link
            href="/admin/reports/dossier?all=true"
            onClick={closeMobileMenu}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
              pathname.includes('/admin/reports/dossier')
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-300" />
            <span>Faculty Dossiers (A4)</span>
          </Link>

          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-blue-200 hover:bg-white/10 hover:text-white transition mt-4"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Open Student Portal
            </span>
          </Link>
        </nav>

        {/* Admin Support Contact (Clickable Phone & Email) */}
        <div className="px-4 py-3 border-t border-white/10 text-[11px] text-blue-200 space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Help Desk &amp; IQAC</p>
          <a
            href="tel:+918842315333"
            className="flex items-center gap-2 hover:text-white transition py-0.5"
            title="Call KIET Campus Reception"
          >
            <Phone className="w-3 h-3 text-blue-300 shrink-0" />
            <span>+91 884 2315333</span>
          </a>
          <a
            href="mailto:feedback@kietgroup.ac.in"
            className="flex items-center gap-2 hover:text-white transition py-0.5 truncate"
            title="Email KIET Feedback Desk"
          >
            <Mail className="w-3 h-3 text-blue-300 shrink-0" />
            <span className="truncate">feedback@kietgroup.ac.in</span>
          </a>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-400/20 transition cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
          <p className="text-[10px] text-blue-300/70 text-center pt-1">
            © {currentYear} KIET Group
          </p>
        </div>
      </aside>

      {/* Main Admin View */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden max-w-full">
        {children}
      </main>
    </div>
  );
}
