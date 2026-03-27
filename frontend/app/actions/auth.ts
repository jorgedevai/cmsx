'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { authTokenOptions, refreshTokenOptions } from '@/lib/cookies'

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080/api/v1';

export async function loginAction(formData: any) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const error = await response.json();
            return { error: error.error || 'Login failed' };
        }

        const data = await response.json();
        const { access_token, refresh_token } = data;

        const cookieStore = await cookies();

        cookieStore.set('auth-token', access_token, authTokenOptions());

        cookieStore.set('refresh-token', refresh_token, refreshTokenOptions());

        // Don't return tokens to client — they're stored in httpOnly cookies
        return { success: true, access_token: '', refresh_token: '', user: data.user || null };
    } catch (error) {
        console.error('Login action error:', error);
        return { error: 'Network error' };
    }
}

export async function forgotPasswordAction(email: string) {
    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            return { success: false, error: error?.error || 'Request failed' };
        }

        return { success: true };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function resetPasswordAction(token: string, newPassword: string) {
    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            return { success: false, error: error?.error || 'Reset failed' };
        }

        return { success: true };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function acceptInviteAction(token: string, username: string, password: string) {
    try {
        const response = await fetch(`${API_URL}/auth/accept-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, username, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            return { success: false, error: error?.error || 'Failed to accept invitation' };
        }

        return { success: true };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    cookieStore.delete('refresh-token');
    redirect('/login');
}

/**
 * Server-side refresh: uses the refresh token cookie to get new tokens.
 * Returns new access_token or null if refresh failed.
 */
export async function refreshTokenAction(): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refresh-token')?.value;

        if (!refreshToken) {
            return null;
        }

        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
            // Refresh token is invalid/expired — clear cookies
            cookieStore.delete('auth-token');
            cookieStore.delete('refresh-token');
            return null;
        }

        const data = await response.json();

        // Update both cookies with new tokens
        cookieStore.set('auth-token', data.access_token, authTokenOptions());

        cookieStore.set('refresh-token', data.refresh_token, refreshTokenOptions());

        return { access_token: data.access_token, refresh_token: data.refresh_token };
    } catch (error) {
        console.error('Refresh token action error:', error);
        return null;
    }
}
