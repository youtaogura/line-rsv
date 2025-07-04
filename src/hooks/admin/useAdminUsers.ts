import {
  adminUsersApi,
  type AdminUser,
  type UpdateUserData,
} from '@/lib/api';
import { useCallback, useState } from 'react';

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminUsersApi.getUsers();

      if (response.success) {
        setUsers(response.data || []);
      } else {
        alert(response.error || 'ユーザーの取得に失敗しました');
        console.error('Error fetching users:', response.error);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  }, []);

  const updateUser = async (userId: string, updateData: UpdateUserData) => {
    try {
      const response = await adminUsersApi.updateUser(userId, updateData);

      if (response.success && response.data) {
        setUsers(
          users.map((user) => (user.user_id === userId ? response.data! : user))
        );
        alert('ユーザー情報を更新しました');
        return true;
      } else {
        alert(response.error || 'ユーザー情報の更新に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('ユーザー情報の更新に失敗しました');
      return false;
    }
  };

  const mergeUser = async (sourceUserId: string, targetUserId: string) => {
    try {
      const response = await adminUsersApi.mergeUser(sourceUserId, { target_user_id: targetUserId });

      if (response.success && response.data) {
        const result = response.data;

        // ユーザーリストを更新（ソースユーザーを削除、ターゲットユーザーを更新）
        setUsers((prevUsers) =>
          prevUsers
            .filter((user) => user.user_id !== sourceUserId)
            .map((user) =>
              user.user_id === targetUserId ? result.updated_user : user
            )
        );

        alert(
          `ユーザーの統合が完了しました。${result.merged_reservations_count}件の予約が移行されました。`
        );
        return true;
      } else {
        alert(response.error || 'ユーザーの統合に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Error merging user:', error);
      alert('ユーザーの統合に失敗しました');
      return false;
    }
  };

  return {
    users,
    fetchUsers,
    updateUser,
    mergeUser,
  };
};