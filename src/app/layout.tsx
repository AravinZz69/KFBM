import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#123B70',
};

export const metadata: Metadata = {
  title: {
    default: 'Student Academic Feedback Portal | KIET & KIET-W',
    template: '%s | KIET Student Feedback Portal',
  },
  description:
    'Official confidential Student Academic Feedback & Faculty Evaluation Portal for Kakinada Institute of Engineering & Technology (KIET) and KIET Women’s College (KIET-W). Evaluated by IQAC.',
  keywords: [
    'KIET',
    'KIET-W',
    'Student Feedback Portal',
    'Faculty Evaluation',
    'Kakinada Institute of Engineering & Technology',
    'Academic Evaluation',
    'IQAC',
  ],
  authors: [{ name: 'KIET Internal Quality Assurance Cell (IQAC)' }],
  creator: 'KIET Group of Institutions',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.svg',
    apple: '/kiet-logo.png',
  },
  openGraph: {
    title: 'Student Academic Feedback Portal | KIET & KIET-W',
    description:
      'Official confidential student academic feedback and faculty evaluation portal for KIET and KIET-W.',
    siteName: 'KIET Student Feedback Portal',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className="min-h-screen bg-[#F4F7FB] text-[#172B4D] antialiased overflow-x-hidden w-full selection:bg-[#2563EB] selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
