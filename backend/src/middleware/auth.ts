import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, getUserSupabase } from '../lib/supabase';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; department_id?: string; full_name?: string };
  supabase?: ReturnType<typeof getUserSupabase>;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.slice(7);

    // Validate token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    let userId = user?.id;
    let userEmail = user?.email;

    // Fallback JWT decode if getUser returned error but token is well-formed
    if ((error || !user) && token) {
      const decoded: any = jwt.decode(token);
      if (decoded?.sub) {
        userId = decoded.sub;
        userEmail = decoded.email;
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user profile using supabaseAdmin to ensure no RLS deadlock
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, department_id, full_name, email')
      .eq('id', userId)
      .single();

    req.user = {
      id: userId,
      email: userEmail || profile?.email || '',
      role: profile?.role || 'entrepreneur',
      department_id: profile?.department_id,
      full_name: profile?.full_name,
    };

    req.supabase = getUserSupabase(token);
    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed: ' + (err.message || 'Unknown error') });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}
