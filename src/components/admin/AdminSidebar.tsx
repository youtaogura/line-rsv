'use client';

import {
  Building,
  CalendarCheck,
  Clock,
  Home,
  LogOut,
  Settings,
  UserCog,
  Users,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { PasswordChangeModal } from '@/components/admin/PasswordChangeModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

import { ROUTES } from '@/constants/routes';
import { UI_TEXT } from '@/constants/ui';
import { ContactModal } from '../common/ContactModal';

interface AdminSidebarProps {
  user?: {
    name?: string | null;
    username?: string | null;
  };
  tenant?: {
    name: string;
  } | null;
}

const navigationItems = [
  {
    label: UI_TEXT.ADMIN_DASHBOARD,
    href: ROUTES.ADMIN.ROOT,
    icon: Home,
  },
  {
    label: UI_TEXT.RESERVATION_MANAGEMENT,
    href: ROUTES.ADMIN.RESERVATIONS,
    icon: CalendarCheck,
  },
  {
    label: UI_TEXT.BUSINESS_HOURS_MANAGEMENT,
    href: ROUTES.ADMIN.BUSINESS_HOURS,
    icon: Clock,
  },
  {
    label: UI_TEXT.STAFF_MANAGEMENT,
    href: ROUTES.ADMIN.STAFF,
    icon: UserCog,
  },
  {
    label: UI_TEXT.USER_MANAGEMENT,
    href: ROUTES.ADMIN.USERS,
    icon: Users,
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, tenant }) => {
  const pathname = usePathname();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: ROUTES.ADMIN.LOGIN });
  };

  const handlePasswordChange = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const result = await adminApi.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    if (!result.success) {
      throw new Error(result.error || 'パスワード変更に失敗しました');
    }

    alert('パスワードが正常に変更されました');
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
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-primary text-primary-foreground">
            <Building className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            {tenant && (
              <h2 className="text-sm text-primary/90 truncate">
                {tenant.name}
              </h2>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.name || user?.username || '管理者'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {UI_TEXT.LOGGED_IN_AS}
                    </p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || user?.username || '管理者'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {UI_TEXT.LOGGED_IN_AS}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsPasswordModalOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>パスワード変更</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{UI_TEXT.LOGOUT}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="px-3 py-2 mt-2 border-t">
          <div className="text-xs text-primary/80 text-center">
            © {new Date().getFullYear()} 株式会社プラスツーシステム
          </div>
          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsContactDialogOpen(true)}
              className="text-xs text-primary/80 p-0 h-auto"
            >
              お問合せはこちら
            </Button>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
      />

      <ContactModal
        open={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
      />
    </Sidebar>
  );
};
