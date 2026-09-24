import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasRole, isApiRoute, requiredRole, roleFromAppMetadata } from "./policy";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalidates the token with Supabase; never trust getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const minimum = requiredRole(pathname, request.method);

  if (minimum === null) {
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    if (isApiRoute(pathname)) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  const role = roleFromAppMetadata(user.app_metadata);
  if (!hasRole(role, minimum)) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { ok: false, error: `This action requires the ${minimum} role` },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/?error=insufficient_permissions", request.url));
  }

  return supabaseResponse;
}
