import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export type UserRole = "admin" | "editor" | "viewer";

const ROLES: readonly UserRole[] = ["admin", "editor", "viewer"];

// Resolved in the database (migration 15): user_roles is keyed by users.id,
// not the auth id, and its RLS policies depend on the same function.
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("current_user_role");
  if (error) {
    console.error("Failed to resolve user role; treating as viewer:", error.message);
    return "viewer";
  }

  return ROLES.includes(data as UserRole) ? (data as UserRole) : "viewer";
}
