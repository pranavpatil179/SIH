import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const isOfflineSupabase = !SUPABASE_URL || SUPABASE_URL.includes('ngbavxuirjhzaatdniyp');

let realSupabase: any = null;
if (!isOfflineSupabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    realSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('Failed to initialize real Supabase client:', e);
  }
}

// Local Session Helpers
const LOCAL_SESSION_KEY = 'bizclear_local_session';
const LOCAL_PROFILE_KEY = 'bizclear_local_profile';

const authListeners = new Set<(event: string, session: any) => void>();

function notifyAuthListeners(event: string, session: any) {
  authListeners.forEach((cb) => cb(event, session));
}

export const supabase: any = {
  auth: {
    async getSession() {
      if (!isOfflineSupabase && realSupabase) {
        try {
          const res = await realSupabase.auth.getSession();
          if (res.data?.session) return res;
        } catch {
          // Fall through to local
        }
      }

      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) {
        try {
          const session = JSON.parse(stored);
          return { data: { session }, error: null };
        } catch {}
      }

      // Default to initial entrepreneur demo session if no session stored
      const defaultUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'entrepreneur@demo.com',
        user_metadata: { full_name: 'Rajesh Sharma' },
      };
      const defaultSession = {
        access_token: 'local_token_entrepreneur_001',
        token_type: 'bearer',
        user: defaultUser,
      };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(defaultSession));
      localStorage.setItem(
        LOCAL_PROFILE_KEY,
        JSON.stringify({
          id: defaultUser.id,
          email: defaultUser.email,
          full_name: defaultUser.user_metadata.full_name,
          role: 'entrepreneur',
        })
      );
      return { data: { session: defaultSession }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password?: string }) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');

        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.session));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data.profile));
        notifyAuthListeners('SIGNED_IN', data.session);

        return { data, error: null };
      } catch (err: any) {
        // Fallback local mock sign-in
        const role = email.includes('admin') ? 'admin' : email.includes('officer') ? 'officer' : 'entrepreneur';
        const name = email.includes('admin') ? 'Admin Director' : email.includes('officer') ? 'S. K. Deshmukh' : 'Rajesh Sharma';
        const id = email.includes('admin')
          ? '00000000-0000-0000-0000-000000000003'
          : email.includes('officer')
          ? '00000000-0000-0000-0000-000000000002'
          : '00000000-0000-0000-0000-000000000001';

        const session = {
          access_token: `mock_jwt_token_${id}`,
          token_type: 'bearer',
          user: { id, email, user_metadata: { full_name: name } },
        };
        const profile = { id, email, full_name: name, role, department_id: role === 'officer' ? 'dept_dic' : null };

        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
        notifyAuthListeners('SIGNED_IN', session);

        return { data: { session, user: session.user, profile }, error: null };
      }
    },

    async signUp({ email, password, options }: any) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: options?.data?.full_name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },

    async signOut() {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
  },

  from(table: string) {
    return {
      select: (_cols?: string) => ({
        eq: (col: string, val: any) => ({
          single: async () => {
            if (table === 'profiles') {
              const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
              if (cached) {
                const profile = JSON.parse(cached);
                if (profile[col] === val || !val) {
                  return { data: profile, error: null };
                }
              }
            }
            return { data: null, error: null };
          },
        }),
      }),
    };
  },
};
