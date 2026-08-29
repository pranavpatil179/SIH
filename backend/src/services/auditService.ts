import { supabaseAdmin } from '../lib/supabase';

export async function logAudit(
  actor: string,
  action: string,
  detail: Record<string, unknown>
): Promise<void> {
  await supabaseAdmin.from('audit_log').insert({ actor, action, detail });
}
