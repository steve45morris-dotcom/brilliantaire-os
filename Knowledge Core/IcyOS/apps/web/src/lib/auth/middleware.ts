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
import { errorResponse } from "../api/response";
import { hasAccess } from "../billing/entitlement";
import { billingEnforced, requiresSubscription } from "../billing/gate";
import {
  ONBOARDED_COOKIE,
  ONBOARDED_COOKIE_OPTIONS,
  ONBOARDING_PATH,
  needsFirstRunCheck,
} from "../onboarding/first-run";

// Legal pages must be readable before sign-up; the Stripe webhook authenticates
// by signature, not by session.
const PUBLIC_ROUTES = ["/login", "/auth/callback", "/auth/confirm", "/terms", "/privacy", "/api/billing/webhook"];

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

  // Trial or paid subscription required; RLS returns only the user's own row.
  if (user && billingEnforced() && requiresSubscription(pathname)) {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at")
      .maybeSingle();
    if (error) console.error("Subscription lookup failed; denying access:", error.message);

    if (!hasAccess(subscription)) {
      if (pathname.startsWith("/api/")) {
        return errorResponse("payment_required", "An active subscription is required", null, 402);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // First run: users without a workspace set one up before using the app.
  // Not a security check, so a failed lookup lets the request through.
  if (user && needsFirstRunCheck(pathname) && request.cookies.get(ONBOARDED_COOKIE)?.value !== user.id) {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Workspace lookup failed; skipping onboarding check:", error.message);
    } else if (!workspace) {
      const url = request.nextUrl.clone();
      url.pathname = ONBOARDING_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    } else {
      supabaseResponse.cookies.set(ONBOARDED_COOKIE, user.id, ONBOARDED_COOKIE_OPTIONS);
    }
  }

  return supabaseResponse;
}
