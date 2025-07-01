'use client';

import { buildAdminApiUrl } from '@/lib/api';
import { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react';

export interface Notification {
  id: string;
  read_at: string | null;
  title: string;
  message: string;
  created_at: string;
  updated_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  getUnreadCount: () => number;
  getUnreadNotifications: () => Notification[];
  getReadNotifications: () => Notification[];
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        buildAdminApiUrl('/api/admin/notifications')
      );

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
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        buildAdminApiUrl(`/api/admin/notifications?id=${notificationId}`),
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
    fetchNotifications();

    intervalRef.current = setInterval(fetchNotifications, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchNotifications]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const value: NotificationsContextType = {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    getUnreadCount,
    getUnreadNotifications,
    getReadNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};