import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authTokenOptions, refreshTokenOptions } from '@/lib/cookies';

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080/api/v1';

/**
 * Try to refresh the access token using the refresh token cookie.
 * Returns the new access token or null.
 */
async function tryRefresh(): Promise<string | null> {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh-token')?.value;

    if (!refreshToken) return null;

    try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) {
            // Refresh token expired/invalid — clear everything
            cookieStore.delete('auth-token');
            cookieStore.delete('refresh-token');
            return null;
        }

        const data = await res.json();

        // Update cookies with new tokens
        cookieStore.set('auth-token', data.access_token, authTokenOptions());

        cookieStore.set('refresh-token', data.refresh_token, refreshTokenOptions());

        return data.access_token;
    } catch {
        return null;
    }
}

/**
 * Check if error is a Next.js redirect (not a real error).
 */
function isRedirectError(error: unknown): boolean {
    return error instanceof Error && error.message === 'NEXT_REDIRECT';
}

export async function fetchServer(path: string, options: RequestInit = {}) {
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;

    if (!token) {
        // Try refresh before giving up
        token = await tryRefresh() ?? undefined;
        if (!token) {
            redirect('/login');
        }
    }

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (res.status === 401) {
        // Check if this is a permissions error (not a token issue)
        const body = await res.json().catch(() => null);
        if (body?.error?.includes("Insufficient permissions")) {
            throw new Error("Insufficient permissions");
        }

        // Token was invalid/expired — try one refresh
        const newToken = await tryRefresh();
        if (!newToken) {
            redirect('/login');
        }

        // Retry the request with the new token
        const retryRes = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
                ...options.headers,
            },
        });

        if (retryRes.status === 401) {
            const retryBody = await retryRes.json().catch(() => null);
            if (retryBody?.error?.includes("Insufficient permissions")) {
                throw new Error("Insufficient permissions");
            }
            redirect('/login');
        }

        if (!retryRes.ok) {
            throw new Error(`API Error: ${retryRes.statusText}`);
        }

        if (retryRes.status === 204) return null;
        const retryText = await retryRes.text();
        if (!retryText) return null;
        return JSON.parse(retryText);
    }

    if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
    }

    if (res.status === 204) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
}
