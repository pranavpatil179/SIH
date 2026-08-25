import { redirect } from "next/navigation";
import { getProfile, roleHome } from "@/lib/auth";

// Central role-based routing hop used after login and email confirmation.
export default async function PostLogin() {
  const profile = await getProfile();
  console.log("[PostLogin] fetched profile:", profile);
  if (!profile) {
    console.log("[PostLogin] no profile, redirecting to /login");
    redirect("/login");
  }
  console.log("[PostLogin] redirecting to roleHome:", roleHome(profile.role));
  redirect(roleHome(profile.role));
}
