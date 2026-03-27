import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authTokenOptions, refreshTokenOptions } from '@/lib/cookies';

/**
 * POST /api/auth/update-tokens
 * Called by the client-side Axios interceptor after a successful token refresh
 * to keep the httpOnly cookies in sync with the new tokens.
 */
export async function POST(request: Request) {
    try {
        const { access_token, refresh_token } = await request.json();

        if (!access_token || !refresh_token) {
            return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
        }

        const cookieStore = await cookies();

        cookieStore.set('auth-token', access_token, authTokenOptions());

        cookieStore.set('refresh-token', refresh_token, refreshTokenOptions());

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
