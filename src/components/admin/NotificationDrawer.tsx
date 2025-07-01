'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { useNotificationsContext, type Notification } from '@/contexts/NotificationsContext';
import { Bell, Check, X } from 'lucide-react';
import React from 'react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}> = ({ notification, onMarkAsRead }) => {
  const isUnread = !notification.read_at;
  const createdAt = new Date(notification.created_at);

  const handleMarkAsRead = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`p-4 border-b last:border-b-0 ${
        isUnread ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900">
              {notification.title}
            </h4>
          </div>
          <p className="text-xs text-gray-600 whitespace-pre-line mb-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400">
            {createdAt.toLocaleString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        {isUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAsRead}
            className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <Check className="h-4 w-4" />
            <span className="sr-only">既読にする</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    getUnreadNotifications,
    getReadNotifications,
  } = useNotificationsContext();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const unreadNotifications = getUnreadNotifications();
  const readNotifications = getReadNotifications();

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full max-w-md">
        <DrawerHeader className="border-b h-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <DrawerTitle>通知</DrawerTitle>
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
                <span className="sr-only">閉じる</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">読み込み中...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-red-500">{error}</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">通知がありません</div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              {/* 未読通知 */}
              {unreadNotifications.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b">
                    <h3 className="text-sm font-medium text-gray-700">
                      未読 ({unreadNotifications.length})
                    </h3>
                  </div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </div>
              )}

              {/* 既読通知 */}
              {readNotifications.length > 0 && (
                <div>
                  {unreadNotifications.length > 0 && <Separator />}
                  <div className="px-4 py-2 bg-gray-50 border-b">
                    <h3 className="text-sm font-medium text-gray-700">
                      既読 ({readNotifications.length})
                    </h3>
                  </div>
                  {readNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
