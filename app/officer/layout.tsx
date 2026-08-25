import { requireProfile } from "@/lib/auth";
import { AppBar } from "@/components/app-bar";

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile(["officer"]);
  return (
    <div className="min-h-screen">
      <AppBar email={profile.full_name} badge="Officer" home="/officer" />
      {children}
    </div>
  );
}
