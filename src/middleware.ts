import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/game", "/wallet", "/history", "/settings", "/shop"];
const SUPPORTED_LOCALES = ["en", "bs"];
const DEFAULT_LOCALE = "en";
const LOCALE_COOKIE = "NEXT_LOCALE";

const OLD_JWT_CHUNKS = Array.from({ length: 8 }, (_, i) => `authjs.session-token.${i}`);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));

  const hasSession = request.cookies.has("authjs.session-token");
  const hasOldChunks = OLD_JWT_CHUNKS.some((name) => request.cookies.has(name));

  if (isProtected && !hasSession && !hasOldChunks) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", request.url);
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
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
