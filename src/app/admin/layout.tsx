import React, { Suspense } from 'react';
import { getCurrentAdmin } from '@/lib/auth';
import AdminShell from './AdminShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard | KIET Student Feedback',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">Loading Admin...</div>}>
      <AdminShell admin={admin}>{children}</AdminShell>
    </Suspense>
  );
}
