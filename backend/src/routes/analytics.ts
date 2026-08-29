import { Router, Response } from 'express';
import { AuthRequest, requireRole } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { getSLAStatus } from '../services/slaService';

const router = Router();

// GET /api/analytics/dashboard — high-level platform stats (admin)
router.get(
  '/dashboard',
  requireRole('admin', 'super_admin'),
  async (_req: AuthRequest, res: Response) => {
    // Parallel fetch of all stats
    const [
      { count: totalApps },
      { count: pendingApps },
      { count: approvedApps },
      { count: rejectedApps },
      { count: totalBusinesses },
      { count: openQueries },
      { count: breachedSLAs },
    ] = await Promise.all([
      supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabaseAdmin.from('businesses').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('queries').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true })
        .lt('sla_due_at', new Date().toISOString())
        .not('status', 'in', '("approved","rejected")'),
    ]);

    // Recent activity
    const { data: recentApps } = await supabaseAdmin
      .from('applications')
      .select('id, status, created_at, projects(name, businesses(name))')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      data: {
        totals: {
          applications: totalApps,
          pending: pendingApps,
          approved: approvedApps,
          rejected: rejectedApps,
          businesses: totalBusinesses,
          open_queries: openQueries,
          sla_breaches: breachedSLAs,
        },
        recent_applications: recentApps,
      },
    });
  }
);

// GET /api/analytics/bottlenecks — department performance vs SLA
router.get(
  '/bottlenecks',
  requireRole('admin', 'super_admin'),
  async (_req: AuthRequest, res: Response) => {
    // Use raw SQL for aggregation
    const { data, error } = await supabaseAdmin.rpc('get_department_bottlenecks');

    if (error) {
      // Fallback: manual aggregation if RPC not available
      const { data: approvals } = await supabaseAdmin
        .from('application_approvals')
        .select(`
          department_id, status, sla_due_at, submitted_at, decided_at,
          approval_types(sla_days),
          departments(name)
        `);

      const deptStats = new Map<string, any>();

      for (const aa of approvals ?? []) {
        const deptId = (aa as any).department_id;
        if (!deptStats.has(deptId)) {
          deptStats.set(deptId, {
            department_id: deptId,
            department_name: (aa as any).departments?.name ?? deptId,
            total: 0,
            approved: 0,
            pending: 0,
            breached: 0,
            total_days: 0,
            decided_count: 0,
          });
        }
        const s = deptStats.get(deptId);
        s.total++;
        if ((aa as any).status === 'approved') s.approved++;
        if (!['approved', 'rejected'].includes((aa as any).status)) s.pending++;

        // SLA breach check
        if ((aa as any).sla_due_at && !['approved', 'rejected'].includes((aa as any).status)) {
          if (getSLAStatus(new Date((aa as any).sla_due_at)) === 'breached') s.breached++;
        }

        // Processing time
        if ((aa as any).decided_at && (aa as any).submitted_at) {
          const diffMs = new Date((aa as any).decided_at).getTime() - new Date((aa as any).submitted_at).getTime();
          s.total_days += diffMs / (1000 * 60 * 60 * 24);
          s.decided_count++;
        }
      }

      const result = Array.from(deptStats.values()).map(s => ({
        ...s,
        avg_days: s.decided_count > 0 ? Math.round((s.total_days / s.decided_count) * 10) / 10 : null,
        sla_days: 30, // default SLA reference
        breach_rate: s.total > 0 ? Math.round((s.breached / s.total) * 100) : 0,
      }));

      return res.json({ data: result });
    }

    res.json({ data });
  }
);

// GET /api/analytics/officer-dashboard — officer's own stats
router.get('/officer-dashboard', requireRole('officer', 'admin', 'super_admin'), async (req: AuthRequest, res: Response) => {
  const deptFilter = req.user!.department_id;

  const baseQuery = () =>
    supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true });

  const [
    { count: myTotal },
    { count: myPending },
    { count: myApproved },
    { count: myQueryRaised },
    { count: myInspection },
    { count: myBreached },
  ] = await Promise.all([
    deptFilter ? baseQuery().eq('department_id', deptFilter) : baseQuery().eq('decided_by', req.user!.id),
    deptFilter
      ? supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true }).eq('department_id', deptFilter).not('status', 'in', '("approved","rejected")')
      : supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true }).eq('decided_by', req.user!.id).not('status', 'in', '("approved","rejected")'),
    deptFilter
      ? supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true }).eq('department_id', deptFilter).eq('status', 'approved')
      : supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true }).eq('decided_by', req.user!.id).eq('status', 'approved'),
    deptFilter
      ? baseQuery().eq('department_id', deptFilter).eq('status', 'query_raised')
      : baseQuery().eq('decided_by', req.user!.id).eq('status', 'query_raised'),
    deptFilter
      ? baseQuery().eq('department_id', deptFilter).in('status', ['inspection_required', 'inspection_scheduled'])
      : baseQuery().eq('decided_by', req.user!.id).in('status', ['inspection_required', 'inspection_scheduled']),
    deptFilter
      ? supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true }).eq('department_id', deptFilter).lt('sla_due_at', new Date().toISOString()).not('status', 'in', '("approved","rejected")')
      : supabaseAdmin.from('application_approvals').select('id', { count: 'exact', head: true }).lt('sla_due_at', new Date().toISOString()).not('status', 'in', '("approved","rejected")'),
  ]);

  // Upcoming SLA deadlines
  const { data: upcomingSLA } = await supabaseAdmin
    .from('application_approvals')
    .select('id, sla_due_at, status, approval_types(name), applications(projects(name, businesses(name)))')
    .eq('department_id', deptFilter ?? req.user!.id)
    .not('status', 'in', '("approved","rejected")')
    .order('sla_due_at', { ascending: true })
    .limit(5);

  res.json({
    data: {
      stats: {
        total: myTotal,
        pending: myPending,
        approved: myApproved,
        query_raised: myQueryRaised,
        inspection_pending: myInspection,
        sla_breached: myBreached,
      },
      upcoming_sla_deadlines: (upcomingSLA ?? []).map((aa: any) => ({
        ...aa,
        sla_status: aa.sla_due_at ? getSLAStatus(new Date(aa.sla_due_at)) : null,
      })),
    },
  });
});

export default router;
