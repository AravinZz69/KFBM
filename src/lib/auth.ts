import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from './db';

const SESSION_COOKIE_NAME = 'kiet_admin_session';

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_SECRET_KEY || 'default-fallback-secret-neon-auth-kiet-change-in-env';
  return new TextEncoder().encode(secret);
}

export interface AdminSessionUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

/**
 * Creates and signs a secure JWT session token for an authenticated admin
 */
export async function createAdminSessionToken(user: AdminSessionUser): Promise<string> {
  const secret = getJwtSecret();
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

/**
 * Verifies the JWT session token
 */
export async function verifyAdminSessionToken(token: string): Promise<AdminSessionUser | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves the current admin user from cookies in Next.js Server Components / Actions / Route Handlers
 */
export async function getCurrentAdmin(): Promise<AdminSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyAdminSessionToken(token);
    if (!payload) return null;

    // Verify admin still exists in Neon DB
    const admin = await queryOne<{ id: number; email: string; name: string; role: string }>(
      `SELECT id, email, name, role FROM admin_users WHERE id = $1 AND email = $2`,
      [payload.id, payload.email]
    );

    if (!admin) return null;
    return admin;
  } catch (err) {
    console.error('Error fetching current admin:', err);
    return null;
  }
}

/**
 * Server-side check for API routes: verifies session and returns user or throws 401 response
 */
export async function requireAdminApi(request?: NextRequest): Promise<AdminSessionUser | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    // Also allow Authorization header Bearer token if needed
    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!token) return null;

  const payload = await verifyAdminSessionToken(token);
  if (!payload) return null;

  // Verify against Neon DB
  const admin = await queryOne<{ id: number; email: string; name: string; role: string }>(
    `SELECT id, email, name, role FROM admin_users WHERE id = $1 AND email = $2`,
    [payload.id, payload.email]
  );

  return admin;
}

export { SESSION_COOKIE_NAME };
