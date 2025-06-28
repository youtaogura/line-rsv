import React from "react";
import type { User } from "@/lib/supabase";
import { MemberTypeBadge } from "@/components/common";
import { UI_TEXT } from "@/constants/ui";

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
  onNameFilterChange 
}) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">{UI_TEXT.USER_MANAGEMENT}</h2>
        <p className="text-sm text-gray-600 mt-1">
          登録ユーザーの会員種別を管理できます
        </p>
        
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="name-filter" className="block text-sm font-medium text-gray-700 mb-1">
              名前で検索
            </label>
            <input
              id="name-filter"
              type="text"
              value={nameFilter}
              onChange={(e) => onNameFilterChange(e.target.value)}
              placeholder="ユーザー名を入力"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会員種別
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userFilter"
                  value="all"
                  checked={userFilter === 'all'}
                  onChange={(e) => onUserFilterChange(e.target.value as UserFilter)}
                  className="mr-2 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">全て</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userFilter"
                  value="regular"
                  checked={userFilter === 'regular'}
                  onChange={(e) => onUserFilterChange(e.target.value as UserFilter)}
                  className="mr-2 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">会員</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userFilter"
                  value="guest"
                  checked={userFilter === 'guest'}
                  onChange={(e) => onUserFilterChange(e.target.value as UserFilter)}
                  className="mr-2 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">ゲスト</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名前
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                電話番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                会員種別
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  {UI_TEXT.NO_USERS}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <MemberTypeBadge memberType={user.member_type} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditUser(user)}
                        className="text-primary hover:text-primary-hover font-medium"
                      >
                        {UI_TEXT.EDIT}
                      </button>
                      {user.member_type === 'guest' && onMergeUser && (
                        <button
                          onClick={() => onMergeUser(user)}
                          className="text-orange-600 hover:text-orange-800 font-medium"
                        >
                          統合
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
