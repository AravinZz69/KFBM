'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, Loader2, ArrowRight, ArrowLeft, Phone } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid administrator credentials. Please check your email and password.');
        setLoading(false);
        return;
      }

      // Successfully authenticated
      window.location.href = '/admin';
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Connection failed. Please check your network and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden w-full">
      {/* Top Bar with Clickable Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123B70] hover:text-[#2563EB] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Student Portal</span>
        </Link>
        <span className="text-[11px] font-semibold text-slate-400">IQAC Portal</span>
      </div>

      <div className="my-auto sm:mx-auto sm:w-full sm:max-w-md">
        {/* Clickable Logo */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition group"
            title="Return to Student Portal Home"
          >
            <img
              src="/kiet-logo.png"
              alt="KIET College Logo"
              className="h-12 w-auto object-contain group-hover:scale-102 transition"
              width={48}
              height={48}
            />
          </Link>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#172B4D]">
            KIET Administrative Portal
          </h2>
          <p className="mt-1 text-center text-xs text-slate-500 font-medium">
            Protected Administrator Access • Secure Session Verified
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-white py-8 px-6 shadow-md rounded-2xl border border-slate-200 sm:px-10">
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-xs text-red-700 font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your administrative email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B4D] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your security password"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-[#172B4D] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#123B70] hover:bg-[#0E2E57] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Server-side session encryption &amp; audit logging</span>
            </div>
          </div>
        </div>

        {/* Support Help Desk Links */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Administrative IT Help Desk
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#123B70]">
            <a
              href="tel:+918842315333"
              className="inline-flex items-center gap-1.5 hover:text-[#2563EB] transition"
            >
              <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>+91 884 2315333</span>
            </a>
            <a
              href="mailto:feedback@kietgroup.ac.in"
              className="inline-flex items-center gap-1.5 hover:text-[#2563EB] transition"
            >
              <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>feedback@kietgroup.ac.in</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4 mt-8">
        <p>© {currentYear} KIET &amp; KIET Women’s College (KIET-W). All rights reserved.</p>
      </footer>
    </div>
  );
}
