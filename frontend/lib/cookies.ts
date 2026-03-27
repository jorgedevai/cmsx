/**
 * Centralized cookie configuration.
 *
 * When COOKIE_DOMAIN is set (cross-domain deployment), cookies use
 * sameSite: 'none' + secure: true, which is required by browsers for
 * cross-site cookies. When unset, the default sameSite: 'lax' is used.
 */

type CookieOptions = {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'none' | 'strict';
    domain?: string;
    path: string;
    maxAge: number;
};

const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

// Only set secure cookies when COOKIE_DOMAIN is explicitly configured (cross-domain)
// or when SECURE_COOKIES=true. This avoids breaking localhost deployments over HTTP.
const forceSecure = cookieDomain ? true : process.env.SECURE_COOKIES === 'true';

export function authTokenOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: forceSecure,
        sameSite: cookieDomain ? 'none' : 'lax',
        domain: cookieDomain,
        path: '/',
        maxAge: 60 * 60, // 1 hour
    };
}

export function refreshTokenOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: forceSecure,
        sameSite: cookieDomain ? 'none' : 'lax',
        domain: cookieDomain,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    };
}
