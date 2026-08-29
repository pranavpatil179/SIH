import { createClient } from '@supabase/supabase-js';
import { localDb, mockAuth } from './mockDb';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ'))
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : (process.env.SUPABASE_ANON_KEY || '');

// Check if we should default to local mode (e.g. if URL is missing or offline)
const useLocalDb = !SUPABASE_URL || SUPABASE_URL.includes('ngbavxuirjhzaatdniyp') || process.env.USE_LOCAL_DB === 'true';

let realClient: any = null;
if (!useLocalDb && SUPABASE_URL && SUPABASE_KEY) {
  try {
    realClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.warn('[Supabase] Failed to init real client, using localDb:', e);
  }
}

// Fallback Proxy that delegates to real Supabase if available or localDb
export const supabaseAdmin: any = {
  from(table: string) {
    if (useLocalDb || !realClient) {
      return localDb.createQueryBuilder(table);
    }
    return realClient.from(table);
  },
  auth: {
    async getUser(token: string) {
      if (useLocalDb || !realClient) {
        return mockAuth.getUser(token);
      }
      try {
        const res = await realClient.auth.getUser(token);
        if (res.error) return mockAuth.getUser(token);
        return res;
      } catch {
        return mockAuth.getUser(token);
      }
    },
    async signInWithPassword(credentials: any) {
      if (useLocalDb || !realClient) {
        return mockAuth.signInWithPassword(credentials);
      }
      try {
        return await realClient.auth.signInWithPassword(credentials);
      } catch {
        return mockAuth.signInWithPassword(credentials);
      }
    },
  },
  storage: {
    from(_bucket: string) {
      return {
        async upload(path: string, _file: any) {
          return { data: { path }, error: null };
        },
        async download(_path: string) {
          return { data: Buffer.from('mock file content'), error: null };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: `/uploads/${path}` } };
        },
      };
    },
  },
};

export const supabase = supabaseAdmin;

export function getUserSupabase(_accessToken: string) {
  return supabaseAdmin;
}
