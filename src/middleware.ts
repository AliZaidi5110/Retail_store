import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

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
