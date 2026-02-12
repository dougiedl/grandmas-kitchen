import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/auth/is-admin";

const PROTECTED_PREFIXES = ["/chat", "/profile", "/recipes", "/admin"];

export default auth((req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const pathname = req.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute) {
    console.info("api_request", {
      requestId,
      method: req.method,
      path: pathname,
    });
  }

  if (isProtected && !req.auth) {
    const url = new URL("/", req.nextUrl.origin);
    url.searchParams.set("signin", "1");
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set("x-request-id", requestId);
    return redirectResponse;
  }

  if (isAdminRoute && !isAdminEmail(req.auth?.user?.email)) {
    const url = new URL("/", req.nextUrl.origin);
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set("x-request-id", requestId);
    return redirectResponse;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-request-id", requestId);
  return response;
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
