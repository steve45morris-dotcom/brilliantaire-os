import { redirect } from "next/navigation";
import { getUser, getUserRole, type UserRole } from "./supabase-server";

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(minimumRole: UserRole) {
  const user = await requireAuth();
  const role = await getUserRole();

  const hierarchy: Record<UserRole, number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
  };

  if (!role || hierarchy[role] < hierarchy[minimumRole]) {
    redirect("/?error=insufficient_permissions");
  }

  return { user, role };
}
