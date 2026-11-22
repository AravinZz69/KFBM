import Link from 'next/link';
import { Home, Shield, Phone, Mail, ArrowLeft, AlertCircle } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found | KIET Student Feedback Portal',
  description: 'The requested page could not be found on the KIET Student Feedback Portal.',
};

export default function NotFound() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between overflow-x-hidden w-full">
      {/* Header */}
      <header className="bg-[#123B70] text-white shadow-md border-b-4 border-[#2563EB] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white rounded-xl"
            aria-label="KIET Home"
          >
            <div className="bg-white px-2.5 py-1.5 rounded-xl shadow-xs border border-white/20 shrink-0 flex items-center justify-center">
              <img
                src="/kiet-logo.png"
                alt="KIET College Logo"
                className="h-8 sm:h-9 w-auto object-contain"
                width={36}
                height={36}
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight">
                KIET Group of Institutions
              </h1>
              <p className="text-[10px] sm:text-xs text-blue-100 font-medium">
                Academic Student Evaluation Portal
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition border border-white/15"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal</span>
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="max-w-xl mx-auto px-4 py-12 sm:py-16 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#123B70] shadow-sm mb-6">
          <span className="text-3xl font-black">404</span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider border border-rose-200 mb-3">
          <AlertCircle className="w-3.5 h-3.5" />
          Page Not Located
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-[#172B4D] tracking-tight mb-3">
          Resource Not Found
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
          The academic evaluation page, submission link, or administrative URL you requested does not exist or may have been relocated.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm mb-10">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#123B70] hover:bg-[#0E2E57] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition"
          >
            <Home className="w-4 h-4" />
            <span>Student Portal</span>
          </Link>

          <Link
            href="/admin/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#123B70] font-bold text-xs uppercase tracking-wider border border-slate-300 shadow-xs hover:shadow-sm transition"
          >
            <Shield className="w-4 h-4 text-[#2563EB]" />
            <span>Admin Login</span>
          </Link>
        </div>

        {/* Contact Help Card */}
        <div className="w-full p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-left text-xs">
          <h3 className="font-bold text-[#123B70] mb-2 text-xs uppercase tracking-wider">
            Need Institutional Assistance?
          </h3>
          <p className="text-slate-600 mb-3 text-[11px]">
            If you believe this is an error during an active evaluation cycle, please reach out to the IQAC Help Desk:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-slate-700">
            <a
              href="tel:+918842315333"
              className="flex items-center gap-2 p-2 rounded-lg bg-[#F4F7FB] hover:bg-blue-50 text-[#123B70] hover:text-[#2563EB] transition font-semibold"
            >
              <Phone className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span>+91 884 2315333</span>
            </a>
            <a
              href="mailto:feedback@kietgroup.ac.in"
              className="flex items-center gap-2 p-2 rounded-lg bg-[#F4F7FB] hover:bg-blue-50 text-[#123B70] hover:text-[#2563EB] transition font-semibold"
            >
              <Mail className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span className="truncate">feedback@kietgroup.ac.in</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4">
          <p>© {currentYear} KIET &amp; KIET Women’s College (KIET-W). All rights reserved.</p>
          <p className="mt-1 text-slate-400 text-[11px]">
            Kakinada Institute of Engineering &amp; Technology • Internal Quality Assurance Cell (IQAC)
          </p>
        </div>
      </footer>
    </div>
  );
}
