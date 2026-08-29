import { Badge } from './Badge';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'info' },
  under_scrutiny: { label: 'Under Scrutiny', variant: 'info' },
  query_raised: { label: 'Query Raised', variant: 'warning' },
  inspection_required: { label: 'Inspection Required', variant: 'warning' },
  inspection_scheduled: { label: 'Inspection Scheduled', variant: 'info' },
  inspection_completed: { label: 'Inspection Completed', variant: 'info' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  withdrawn: { label: 'Withdrawn', variant: 'default' },
  pending: { label: 'Pending', variant: 'default' },
  valid: { label: 'Valid', variant: 'success' },
  invalid: { label: 'Invalid', variant: 'danger' },
  expired: { label: 'Expired', variant: 'danger' },
  warning: { label: 'Warning', variant: 'warning' },
  on_track: { label: 'On Track', variant: 'success' },
  approaching: { label: 'Due Soon', variant: 'warning' },
  breached: { label: 'SLA Breached', variant: 'danger' },
  open: { label: 'Open', variant: 'warning' },
  responded: { label: 'Responded', variant: 'info' },
  closed: { label: 'Closed', variant: 'success' },
  requested: { label: 'Requested', variant: 'info' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'danger' },
  active: { label: 'Active', variant: 'success' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
