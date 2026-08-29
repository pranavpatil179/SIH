import { Router, Request, Response } from 'express';
import { mockAuth, localDb } from '../lib/mockDb';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const result = await mockAuth.signInWithPassword({ email, password });
  if (result.error) {
    return res.status(400).json({ error: (result.error as any)?.message || 'Login failed' });
  }

  const profile = localDb.getTable('profiles').find((p) => p.id === result.data.user.id);
  res.json({
    session: result.data.session,
    user: result.data.user,
    profile,
  });
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, full_name, role = 'entrepreneur' } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let profile = localDb.getTable('profiles').find((p) => p.email.toLowerCase() === email.toLowerCase());
  if (!profile) {
    profile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email,
      full_name: full_name || email.split('@')[0],
      role,
      department_id: role === 'officer' ? 'dept_dic' : null,
      created_at: new Date().toISOString(),
    };
    const profiles = localDb.getTable('profiles');
    profiles.push(profile);
    localDb.saveData();
  }

  const result = await mockAuth.signInWithPassword({ email });
  res.json({
    session: result.data.session,
    user: result.data.user,
    profile,
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const profile = localDb.getTable('profiles').find((p) => p.id === req.user!.id);
  res.json({
    user: req.user,
    profile: profile || req.user,
  });
});

export default router;
