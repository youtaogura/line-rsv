import { buildApiUrl } from '@/lib/tenant-helpers';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Notification {
  id: string;
  read_at: string | null;
  title: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export const useNotifications = (tenantId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(buildApiUrl('/api/notifications', tenantId));

      if (response.ok) {
        const data = await response.json();
        setNotifications(data || []);
        setError(null);
      } else {
        console.error('Error fetching notifications:', response.statusText);
        setError('通知の取得に失敗しました');
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
      setError('通知の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const markAsRead = async (notificationId: string) => {
    if (!tenantId) return false;

    try {
      const response = await fetch(
        buildApiUrl(`/api/notifications?id=${notificationId}`, tenantId),
        {
          method: 'PUT',
        }
      );

      if (response.ok) {
        const updatedNotification = await response.json();
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? updatedNotification : n
          )
        );
        return true;
      } else {
        console.error(
          'Error marking notification as read:',
          response.statusText
        );
        return false;
      }
    } catch (err) {
      console.error('Mark as read error:', err);
      return false;
    }
  };

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read_at).length;
  };

  const getUnreadNotifications = () => {
    return notifications.filter((n) => !n.read_at);
  };

  const getReadNotifications = () => {
    return notifications.filter((n) => n.read_at);
  };

  useEffect(() => {
    if (tenantId) {
      fetchNotifications();

      intervalRef.current = setInterval(fetchNotifications, 60000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [tenantId, fetchNotifications]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    getUnreadCount,
    getUnreadNotifications,
    getReadNotifications,
  };
};
