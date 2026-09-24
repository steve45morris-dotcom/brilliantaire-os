// Access policy for Sentinel OS. Pure functions only, so the rules can be
// tested without Next.js or Supabase.

export type UserRole = "admin" | "editor" | "viewer";

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, editor: 1, admin: 2 };

export const PUBLIC_ROUTES = ["/login", "/auth/callback", "/auth/signout"];

// Mutations that move money or create enterprise clients.
const ADMIN_API_ROUTES = ["/api/mesh/billing", "/api/mesh/settle", "/api/mesh/provision"];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isApiRoute(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/** Minimum role for a request, or null when the route is public. */
export function requiredRole(pathname: string, method: string): UserRole | null {
  if (isPublicRoute(pathname)) return null;
  if (!isApiRoute(pathname)) return "viewer";

  const verb = method.toUpperCase();
  if (verb === "GET" || verb === "HEAD" || verb === "OPTIONS") return "viewer";
  return ADMIN_API_ROUTES.includes(pathname) ? "admin" : "editor";
}

/**
 * Roles live in Supabase `app_metadata.role`, which only the service role
 * can write (dashboard or admin API) — users cannot grant themselves access.
 * Anyone signed in without a role is a viewer.
 */
export function roleFromAppMetadata(appMetadata: Record<string, unknown> | undefined): UserRole {
  const role = appMetadata?.role;
  return role === "admin" || role === "editor" || role === "viewer" ? role : "viewer";
}

export function hasRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Post-login redirect target; only same-origin paths are allowed. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}
