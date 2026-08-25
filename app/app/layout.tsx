import { requireProfile } from "@/lib/auth";
import { AppBar } from "@/components/app-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile(["applicant"]);
  return (
    <div className="min-h-screen">
      <AppBar email={profile.full_name} badge="Applicant" home="/app" />
      {children}
    </div>
  );
}
