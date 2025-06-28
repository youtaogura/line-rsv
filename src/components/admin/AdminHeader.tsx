'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  Menu, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  UserCheck,
  Settings,
  LogOut,
  Building
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

import { UI_TEXT } from '@/constants/ui';
import { ROUTES } from '@/constants/routes';

interface AdminHeaderProps {
  title: string;
  user?: {
    name?: string | null;
    username?: string | null;
  };
  tenant?: {
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
  backUrl 
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: ROUTES.ADMIN.LOGIN });
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
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">メニューを開く</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2">
                    <h2 className="text-lg font-semibold">管理画面</h2>
                    {tenant && (
                      <p className="text-sm text-muted-foreground">
                        {tenant.name}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <nav className="flex flex-col space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsSheetOpen(false)}
                          className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

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

          {/* Right side - User menu */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
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
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>パスワード変更</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{UI_TEXT.LOGOUT}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};