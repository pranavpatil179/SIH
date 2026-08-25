/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actions are stable in Next 14.2, kept explicit for clarity.
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://ngbavxuirjhzaatdniyp.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nYmF2eHVpcmpoemFhdGRuaXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MzEwNDQsImV4cCI6MjEwMzEwNzA0NH0.Dsw22lx_X5y8NhVt-EuR1fJKQK0jYZ_4TJjzV-kwPRw",
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nYmF2eHVpcmpoemFhdGRuaXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzUzMTA0NCwiZXhwIjoyMTAzMTA3MDQ0fQ.iv66YC8UODcC6tTBukc_9It1gpIVadwns9xn_slSAIs",
    NEXT_PUBLIC_SLA_SECONDS_PER_DAY:
      process.env.NEXT_PUBLIC_SLA_SECONDS_PER_DAY || "1",
  },
};

export default nextConfig;
