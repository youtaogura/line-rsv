'use client';

import {
  ArrowLeft,
  Bell,
  Building,
  Calendar,
  Clock,
  LogOut,
  Menu,
  Settings,
  UserCheck,
  Users,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { NotificationDrawer } from '@/components/admin/NotificationDrawer';
import { PasswordChangeModal } from '@/components/admin/PasswordChangeModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { ROUTES } from '@/constants/routes';
import { UI_TEXT } from '@/constants/ui';
import { useNotifications } from '@/hooks/useNotifications';

interface AdminHeaderProps {
  title: string;
  user?: {
    name?: string | null;
    username?: string | null;
  };
  tenant?: {
    id?: string;
    name: string;
  } | null;
  showBackButton?: boolean;
  backUrl?: string;
}

const navigationItems = [
  {
    label: UI_TEXT.ADMIN_DASHBOARD,
    href: ROUTES.ADMIN.ROOT,
    icon: Building,
  },
  {
    label: UI_TEXT.RESERVATION_MANAGEMENT,
    href: ROUTES.ADMIN.RESERVATIONS,
    icon: Calendar,
  },
  {
    label: UI_TEXT.BUSINESS_HOURS_MANAGEMENT,
    href: ROUTES.ADMIN.BUSINESS_HOURS,
    icon: Clock,
  },
  {
    label: UI_TEXT.STAFF_MANAGEMENT,
    href: ROUTES.ADMIN.STAFF,
    icon: UserCheck,
  },
  {
    label: UI_TEXT.USER_MANAGEMENT,
    href: ROUTES.ADMIN.USERS,
    icon: Users,
  },
];

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  user,
  tenant,
  showBackButton = false,
  backUrl,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] =
    useState(false);
  const router = useRouter();

  const { getUnreadCount } = useNotifications(tenant?.id);
  const unreadCount = getUnreadCount();

  const handleLogout = async () => {
    await signOut({ callbackUrl: ROUTES.ADMIN.LOGIN });
  };

  const handlePasswordChange = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await fetch('/api/admin/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'パスワード変更に失敗しました');
    }

    alert('パスワードが正常に変更されました');
  };

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.substring(0, 2).toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-4">
            {/* Back button */}
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">戻る</span>
              </Button>
            )}

            {/* Page title */}
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
              {tenant && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {UI_TEXT.TENANT}: {tenant.name}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Notification bell and Mobile menu */}
          <div className="flex items-center space-x-2">
            {/* Notification bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNotificationDrawerOpen(true)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">通知を開く</span>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">メニューを開く</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader className="sr-only">
                  <SheetTitle>管理画面メニュー</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="flex flex-col space-y-2 p-6 pb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">管理画面</h2>
                    </div>
                    {tenant && (
                      <p className="text-sm text-muted-foreground">
                        {tenant.name}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <nav className="flex flex-col space-y-2 p-6 pt-4 flex-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsSheetOpen(false)}
                          className="flex items-center space-x-3 rounded-xs px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* User section in drawer */}
                  <div className="mt-auto">
                    <Separator />
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium leading-none">
                            {user?.name || user?.username || '管理者'}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground mt-1">
                            {UI_TEXT.LOGGED_IN_AS}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          className="justify-start h-10 px-3"
                          onClick={() => {
                            setIsPasswordModalOpen(true);
                            setIsSheetOpen(false);
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          <span>パスワード変更</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start h-10 px-3 text-red-600 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            handleLogout();
                            setIsSheetOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>{UI_TEXT.LOGOUT}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
      />
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        tenantId={tenant?.id}
      />
    </header>
  );
};
