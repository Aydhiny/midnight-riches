import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { NextRequest, NextResponse } from "next/server";

// Use lightweight authConfig (no DB adapter) so this runs on the Edge runtime.
// The `authorized` callback inside authConfig properly validates the JWT signature
// via next-auth rather than a simple cookie-presence check.
const { auth } = NextAuth(authConfig);

const PROTECTED = ["/game", "/wallet", "/history", "/settings", "/shop"];
const SUPPORTED_LOCALES = ["en", "bs"];
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

const OLD_JWT_CHUNKS = Array.from({ length: 8 }, (_, i) => `authjs.session-token.${i}`);

export default auth(async function middleware(request: NextRequest & { auth: { user?: unknown } | null }) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));
  const hasOldChunks = OLD_JWT_CHUNKS.some((name) => request.cookies.has(name));

  if (isProtected && !request.auth?.user && !hasOldChunks) {
    const url = new URL("/auth/signin", request.url);
    // Use only the pathname (+ search) so the callbackUrl stays clean in prod
    const callbackPath = request.nextUrl.pathname + (request.nextUrl.search || "");
    url.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(url);
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-intl-locale", locale);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (hasOldChunks) {
    OLD_JWT_CHUNKS.forEach((name) => {
      response.cookies.set(name, "", {
        path: "/",
        expires: new Date(0),
        sameSite: "lax",
      });
    });
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
