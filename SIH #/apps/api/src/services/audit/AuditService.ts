import { supabaseAdmin } from '../../lib/supabase';

export class AuditService {
  async log(actor: string, action: string, entityType: string, entityId: string, detail?: string, oldValue?: any, newValue?: any) {
    await supabaseAdmin.from('audit_log').insert({
      actor,
      action,
      detail: JSON.stringify({ entityType, entityId, detail, oldValue, newValue }),
      created_at: new Date().toISOString()
    });
  }
}
