import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = [
  "/dashboard",
  "/products",
  "/sales",
  "/expenses",
  "/reports",
  "/suppliers",
  "/settings",
  "/profit-loss",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/products",
    "/products/:path*",
    "/sales",
    "/sales/:path*",
    "/expenses",
    "/expenses/:path*",
    "/reports",
    "/reports/:path*",
    "/suppliers",
    "/suppliers/:path*",
    "/settings",
    "/settings/:path*",
    "/profit-loss",
    "/profit-loss/:path*",
  ],
};
