import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the admin's Supabase session cookies fresh (token refresh) before admin pages and
 * admin API routes run. This is NOT the authorization check: every admin page and route
 * calls getAdminContext(), and the database re-checks the allowlist.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet, headers) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  // Optimistic redirect for signed-out visitors (the page re-checks the admin allowlist).
  const path = request.nextUrl.pathname;
  if (!data.user && (path === "/admin" || path.startsWith("/admin/")) && !path.startsWith("/admin/login")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/auth/:path*"],
};
