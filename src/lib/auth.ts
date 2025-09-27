import { createServerSupabase } from "./superbaseServer";

export async function requireRole(roles: string[] = ["admin", "manager"]) {
  const supabase = await createServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  if (!profile.role || !roles.includes(profile.role)) throw new Error("Forbidden");

  return { supabase, user: session.user, role: profile.role };
}
