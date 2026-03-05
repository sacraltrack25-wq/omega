import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const path  = req.nextUrl.pathname;
    const token = req.nextauth?.token;

    // ── Admin bypass (dev / temp mode) ───────────────────────────────────────
    // Set ADMIN_BYPASS=true in .env.local to skip auth for /admin routes.
    // NEVER set this in production.
    if (path.startsWith("/admin") && process.env.ADMIN_BYPASS === "true") {
      return NextResponse.next();
    }

    // ── Admin role check ─────────────────────────────────────────────────────
    const role = token?.role as string | undefined;
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/chat", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const path = req.nextUrl.pathname;

        // Admin bypass: allow without token
        if (path.startsWith("/admin") && process.env.ADMIN_BYPASS === "true") {
          return true;
        }

        return !!token;
      },
    },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
