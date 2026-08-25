import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";

export function AppBar({
  email,
  badge,
  home = "/app",
}: {
  email?: string | null;
  badge?: string;
  home?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href={home} aria-label="Home">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          {badge && (
            <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100 sm:inline">
              {badge}
            </span>
          )}
          {email && (
            <span className="hidden text-sm text-slate-500 md:inline">
              {email}
            </span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
