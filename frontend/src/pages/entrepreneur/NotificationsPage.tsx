import { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, Check, Clock } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';
import type { Notification } from '../../types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifs();
  }, []);

  async function loadNotifs() {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res);
    } catch (err: any) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      toast.success('All marked as read');
      await loadNotifs();
    } catch (err: any) {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Notifications & Real-Time Alerts"
        subtitle="Real-time status updates, SLA warnings, and scrutiny events"
        actions={
          notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <Check className="w-4 h-4 mr-1" /> Mark All as Read
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">No Notifications Yet</h3>
            <p className="text-xs text-muted-foreground">You will receive alerts here when officers update your applications.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`p-4 ${!n.is_read ? 'border-primary-300 bg-primary-50/10' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-foreground">{n.title}</h4>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDateTime(n.created_at)}
                  </p>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-600 mt-1" />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
