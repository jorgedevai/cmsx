import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Let next-intl handle locale detection and prefixing
    const response = intlMiddleware(request);

    // After locale prefix is resolved, check auth for dashboard routes
    // Extract the pathname without locale prefix for auth check
    const pathnameWithoutLocale = pathname.replace(/^\/(en|es)/, "");

    if (pathnameWithoutLocale.startsWith("/dashboard")) {
        const accessToken = request.cookies.get("auth-token")?.value;
        const refreshToken = request.cookies.get("refresh-token")?.value;

        if (!accessToken && !refreshToken) {
            // Determine the locale from the response or default
            const locale =
                routing.locales.find((l) => pathname.startsWith(`/${l}`)) ||
                routing.defaultLocale;
            return NextResponse.redirect(
                new URL(`/${locale}/login`, request.url)
            );
        }
    }

    return response;
}

export const config = {
    matcher: [
        // Match all pathnames except for:
        // - /api (API routes)
        // - /_next (Next.js internals)
        // - /_vercel (Vercel internals)
        // - /favicon.ico, /sitemap.xml, /robots.txt (metadata files)
        // - Static files with extensions
        "/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
    ],
};
