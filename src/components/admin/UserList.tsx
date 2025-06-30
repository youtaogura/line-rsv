import { MemberTypeBadge } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UI_TEXT } from '@/constants/ui';
import type { User } from '@/lib/supabase';
import { Phone } from 'lucide-react';
import React from 'react';

type UserFilter = 'all' | 'regular' | 'guest';

interface UserListProps {
  users: User[];
  userFilter: UserFilter;
  nameFilter: string;
  onEditUser: (user: User) => void;
  onMergeUser?: (user: User) => void;
  onUserFilterChange: (filter: UserFilter) => void;
  onNameFilterChange: (name: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  userFilter,
  nameFilter,
  onEditUser,
  onMergeUser,
  onUserFilterChange,
  onNameFilterChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI_TEXT.USER_MANAGEMENT}</CardTitle>
        <p className="text-sm text-muted-foreground">
          登録ユーザーの会員種別を管理できます
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="flex-1">
            <label
              htmlFor="name-filter"
              className="block text-sm font-medium mb-1"
            >
              名前で検索
            </label>
            <input
              id="name-filter"
              type="text"
              value={nameFilter}
              onChange={(e) => onNameFilterChange(e.target.value)}
              placeholder="ユーザー名を入力"
              className="w-full border border-input rounded-xs px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">会員種別</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userFilter"
                  value="all"
                  checked={userFilter === 'all'}
                  onChange={(e) =>
                    onUserFilterChange(e.target.value as UserFilter)
                  }
                  className="mr-2"
                />
                <span className="text-sm">全て</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userFilter"
                  value="regular"
                  checked={userFilter === 'regular'}
                  onChange={(e) =>
                    onUserFilterChange(e.target.value as UserFilter)
                  }
                  className="mr-2"
                />
                <span className="text-sm">会員</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userFilter"
                  value="guest"
                  checked={userFilter === 'guest'}
                  onChange={(e) =>
                    onUserFilterChange(e.target.value as UserFilter)
                  }
                  className="mr-2"
                />
                <span className="text-sm">ゲスト</span>
              </label>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Card View */}
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {UI_TEXT.NO_USERS}
            </div>
          ) : (
            users.map((user) => (
              <Card key={user.user_id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <div className="mt-1">
                        <MemberTypeBadge memberType={user.member_type} />
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditUser(user)}
                        className="text-primary hover:text-primary/80"
                      >
                        {UI_TEXT.EDIT}
                      </Button>
                      {user.member_type === 'guest' && onMergeUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMergeUser(user)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          統合
                        </Button>
                      )}
                    </div>
                  </div>

                  {user.phone && (
                    <>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          電話番号
                        </span>
                        <a
                          href={`tel:${user.phone}`}
                          className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{user.phone}</span>
                        </a>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
