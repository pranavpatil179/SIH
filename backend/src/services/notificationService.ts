import { supabaseAdmin } from '../lib/supabase';

export async function sendNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string
): Promise<void> {
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    entity_type: entityType,
    entity_id: entityId,
    is_read: false,
  });
}
