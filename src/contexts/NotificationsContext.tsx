'use client';

import { adminNotificationsApi, type Notification } from '@/lib/api';

// Re-export the Notification type for other components
export type { Notification };
import { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react';

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
      const response = await adminNotificationsApi.getNotifications();

      if (response.success) {
        setNotifications(response.data || []);
        setError(null);
      } else {
        console.error('Error fetching notifications:', response.error);
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
      const response = await adminNotificationsApi.markAsRead(notificationId);

      if (response.success) {
        const updatedNotification = response.data;
        if (updatedNotification) {
          setNotifications(
            notifications.map((n) =>
              n.id === notificationId ? updatedNotification : n
            )
          );
        }
        return true;
      } else {
        console.error('Error marking notification as read:', response.error);
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