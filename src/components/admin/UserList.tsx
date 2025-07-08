import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UI_TEXT } from '@/constants/ui';
import React from 'react';
import { MemberTypeBadge } from '../common';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { UserCard } from './UserCard';

type UserFilter = 'all' | 'regular' | 'guest';

// ローカル型定義
interface User {
  user_id: string;
  name: string;
  member_type: 'regular' | 'guest';
  phone?: string;
}

interface UserListProps {
  users: User[];
  userFilter: UserFilter;
  nameFilter: string;
  onEditUser: (user: User) => void;
  onUserFilterChange: (filter: UserFilter) => void;
  onNameFilterChange: (name: string) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  userFilter,
  nameFilter,
  onEditUser,
  onUserFilterChange,
  onNameFilterChange,
}) => {
  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <div className="flex-1 flex items-center">
          <label
            htmlFor="name-filter"
            className="block text-sm font-medium mr-2"
          >
            名前で検索:
          </label>
          <Input
            id="name-filter"
            type="text"
            value={nameFilter}
            onChange={(e) => onNameFilterChange(e.target.value)}
            placeholder="ユーザー名を入力"
            className="w-60 border border-input rounded-xs px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <label className="block text-sm font-medium mr-2">種別:</label>
          <RadioGroup
            value={userFilter}
            onValueChange={(value) => onUserFilterChange(value as UserFilter)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="all" id="all" />
              <label htmlFor="all" className="text-sm">
                <Badge className="bg-gray-200 text-gray-900">全て</Badge>
              </label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="regular" id="regular" />
              <label htmlFor="regular" className="text-sm">
                <MemberTypeBadge memberType="regular" />
              </label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="guest" id="guest" />
              <label htmlFor="guest" className="text-sm">
                <MemberTypeBadge memberType="guest" />
              </label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Card View */}
      <div className="mt-4 space-y-2">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {UI_TEXT.NO_USERS}
          </div>
        ) : (
          users.map((user) => (
            <UserCard key={user.user_id} user={user} onEditUser={onEditUser} />
          ))
        )}
      </div>
    </div>
  );
};
