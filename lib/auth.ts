import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

/** The authenticated auth user, or null. */
export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The current user's profile row (role, name, department), or null. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user) {
    console.log("[getProfile] no user found. Error:", userError);
    return null;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) {
    console.log("[getProfile] error fetching profile for user", user.id, error);
  }
  return (data as Profile) ?? null;
}

/** Where each role lands after login. */
export function roleHome(role: Role | null | undefined): string {
  switch (role) {
    case "officer":
      return "/officer";
    case "nodal":
      return "/nodal";
    default:
      return "/app";
  }
}

/** Guard for a page: require a session, and optionally a specific role set. */
export async function requireProfile(roles?: Role[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (roles && !roles.includes(profile.role)) redirect(roleHome(profile.role));
  return profile;
}
