import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for use in Client Components (browser). */
export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ngbavxuirjhzaatdniyp.supabase.co";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nYmF2eHVpcmpoemFhdGRuaXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MzEwNDQsImV4cCI6MjEwMzEwNzA0NH0.Dsw22lx_X5y8NhVt-EuR1fJKQK0jYZ_4TJjzV-kwPRw";

  return createBrowserClient(url, anonKey);
}
