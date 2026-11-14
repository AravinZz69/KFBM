import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'kiet_admin_session';

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_SECRET_KEY || 'default-fallback-secret-neon-auth-kiet-change-in-env';
  return new TextEncoder().encode(secret);
}

function extractToken(request: NextRequest): string | undefined {
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Defense-in-depth: Protect all /api/admin/* routes (except /api/admin/auth/login)
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth/login') {
    const token = extractToken(request);
    let isAuthenticated = false;

    if (token) {
      try {
        const secret = getJwtSecret();
        await jwtVerify(token, secret);
        isAuthenticated = true;
      } catch {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      );
    }
  }

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const token = extractToken(request);

    let isAuthenticated = false;
    if (token) {
      try {
        const secret = getJwtSecret();
        await jwtVerify(token, secret);
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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

