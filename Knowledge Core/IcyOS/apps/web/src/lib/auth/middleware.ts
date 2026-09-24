import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  MemoryRateLimitStore,
  RATE_LIMIT_RULES,
  applyRateLimitHeaders,
  checkRateLimit,
  getClientIp,
  isRateLimited,
  rateLimitResponse,
  resolveTier,
} from "../api/rate-limit";

const PUBLIC_ROUTES = ["/login", "/auth/callback", "/auth/confirm"];

const rateLimitStore = new MemoryRateLimitStore();

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const limitApi = isRateLimited(pathname);

  // Throttle by IP before the Supabase lookup so floods never reach auth.
  if (limitApi) {
    const ipResult = await checkRateLimit(
      rateLimitStore,
      `ip:${getClientIp(request.headers)}`,
      RATE_LIMIT_RULES.ip
    );
    if (!ipResult.allowed) return rateLimitResponse(ipResult);
  }

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (limitApi && user) {
    const tier = resolveTier(pathname, request.method);
    const userResult = await checkRateLimit(
      rateLimitStore,
      `user:${user.id}:${tier}`,
      RATE_LIMIT_RULES[tier]
    );
    if (!userResult.allowed) return rateLimitResponse(userResult);
    applyRateLimitHeaders(supabaseResponse, userResult);
  }

  return supabaseResponse;
}
