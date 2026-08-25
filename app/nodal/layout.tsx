import { requireProfile } from "@/lib/auth";
import { AppBar } from "@/components/app-bar";

export default async function NodalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile(["nodal"]);
  return (
    <div className="min-h-screen">
      <AppBar email={profile.full_name} badge="Nodal" home="/nodal" />
      {children}
    </div>
  );
}
