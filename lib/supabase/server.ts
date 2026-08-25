import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase client for Server Components, Server Actions and Route Handlers. */
export function createClient() {
  const cookieStore = cookies();

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ngbavxuirjhzaatdniyp.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nYmF2eHVpcmpoemFhdGRuaXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MzEwNDQsImV4cCI6MjEwMzEwNzA0NH0.Dsw22lx_X5y8NhVt-EuR1fJKQK0jYZ_4TJjzV-kwPRw";

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: any;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Invoked from a Server Component. Safe to ignore — the session is
            // refreshed by middleware on the next request.
          }
        },
      },
    },
  );
}
