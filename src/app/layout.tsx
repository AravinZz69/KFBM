import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Feedback Portal | KIET & KIET-W',
  description: 'Official Student Feedback Portal for KIET and KIET Women’s College (KIET-W)',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F4F7FB] text-[#172B4D] antialiased">
        {children}
      </body>
    </html>
  );
}
