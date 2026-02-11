import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

const PROTECTED_PREFIXES = ["/chat", "/profile", "/recipes"];

export default auth((req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const pathname = req.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
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

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-request-id", requestId);
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
