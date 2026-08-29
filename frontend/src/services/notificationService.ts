import { api } from './api';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const res = await api.get('/api/notifications');
    return res.data.notifications || [];
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/api/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/api/notifications/read-all');
  },

  subscribeToNotifications(userId: string, onNotification: (n: Notification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          onNotification(payload.new as unknown as Notification);
        }
      )
      .subscribe();
  },
};
