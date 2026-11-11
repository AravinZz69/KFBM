import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'kiet_admin_session';

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_SECRET_KEY || 'default-fallback-secret-neon-auth-kiet-change-in-env';
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    let isAuthenticated = false;
    if (sessionToken) {
      try {
        const secret = getJwtSecret();
        await jwtVerify(sessionToken, secret);
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    // If attempting to access login page while authenticated, redirect to /admin
    if (isLoginPage && isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // If unauthenticated and not on login page, redirect to /admin/login
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
