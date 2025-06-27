import React from "react";
import type { User } from "@/lib/supabase";
import { MemberTypeBadge } from "@/components/common";
import { UI_TEXT } from "@/constants/ui";

interface UserListProps {
  users: User[];
  onEditUser: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onEditUser }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-x-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">{UI_TEXT.USER_MANAGEMENT}</h2>
        <p className="text-sm text-gray-600 mt-1">
          登録ユーザーの会員種別を管理できます
        </p>
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
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-primary hover:text-primary-hover font-medium"
                    >
                      {UI_TEXT.EDIT}
                    </button>
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
