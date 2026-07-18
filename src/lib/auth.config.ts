import type { NextAuthConfig } from "next-auth";

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

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = protectedPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      );

      if (!isProtected) return true;
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
