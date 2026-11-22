import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administrator Login | KIET Student Feedback',
  description: 'Secure administrator sign-in for KIET academic evaluation and feedback management.',
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
