import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { authTokenOptions, refreshTokenOptions } from '@/lib/cookies';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080/api/v1';

/**
 * Server-side proxy that forwards requests to the backend.
 * Client components call /api/proxy/... instead of the backend directly.
 * This keeps the backend URL and JWT tokens hidden from the browser.
 */

async function tryRefreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function proxyRequest(req: NextRequest, path: string) {
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;
    const refreshToken = cookieStore.get('refresh-token')?.value;

    // Build headers — forward content-type but NOT authorization (we inject it)
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // For non-multipart requests, forward content-type
    const contentType = req.headers.get('content-type');
    if (contentType && !contentType.includes('multipart/form-data')) {
        headers['Content-Type'] = contentType;
    }

    // Build body
    let body: any = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (contentType?.includes('multipart/form-data')) {
            // For file uploads, pass the raw body through
            body = await req.arrayBuffer();
            // Forward the full content-type with boundary
            headers['Content-Type'] = contentType;
        } else {
            body = await req.text();
        }
    }

    // Forward query params
    const url = new URL(req.url);
    const queryString = url.searchParams.toString();
    const backendUrl = `${BACKEND_URL}/${path}${queryString ? `?${queryString}` : ''}`;

    let res = await fetch(backendUrl, {
        method: req.method,
        headers,
        body,
    });

    // If 401, try refresh and retry once
    if (res.status === 401 && refreshToken) {
        const newTokens = await tryRefreshToken(refreshToken);
        if (newTokens) {
            // Update cookies
            cookieStore.set('auth-token', newTokens.access_token, authTokenOptions());
            cookieStore.set('refresh-token', newTokens.refresh_token, refreshTokenOptions());

            // Retry with new token
            headers['Authorization'] = `Bearer ${newTokens.access_token}`;
            res = await fetch(backendUrl, {
                method: req.method,
                headers,
                body,
            });
        }
    }

    // Forward the response
    const responseBody = res.status === 204 ? null : await res.arrayBuffer();
    const responseHeaders = new Headers();

    // Forward relevant headers
    const forwardHeaders = ['content-type', 'content-disposition', 'cache-control'];
    forwardHeaders.forEach(h => {
        const val = res.headers.get(h);
        if (val) responseHeaders.set(h, val);
    });

    return new NextResponse(responseBody, {
        status: res.status,
        headers: responseHeaders,
    });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    return proxyRequest(req, path.join('/'));
}
