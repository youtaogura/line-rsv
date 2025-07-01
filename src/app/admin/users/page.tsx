'use client';

import { UserEditModal } from '@/components/admin/UserEditModal';
import { UserList } from '@/components/admin/UserList';
import { UserMergeModal } from '@/components/admin/UserMergeModal';
import { AdminLayout, AuthGuard, LoadingSpinner } from '@/components/common';
import { MEMBER_TYPES } from '@/constants/business';
import { UI_TEXT } from '@/constants/ui';
import { useAdminSession, useTenant, useUsers } from '@/hooks/useAdminData';
import type { User } from '@/lib/supabase';
import { Suspense, useEffect, useMemo, useState } from 'react';

type UserFilter = 'all' | 'regular' | 'guest';

function UsersContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { tenant, fetchTenant } = useTenant();
  const { users, fetchUsers, updateUser, mergeUser } = useUsers();
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [mergingUser, setMergingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [nameFilter, setNameFilter] = useState('');

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (userFilter !== 'all') {
      filtered = filtered.filter((user) => user.member_type === userFilter);
    }

    if (nameFilter.trim()) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    return filtered;
  }, [users, userFilter, nameFilter]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await fetchUsers();
        await fetchTenant();
        setLoading(false);
      };
      fetchData();
    }
  }, [isAuthenticated, session, fetchUsers, fetchTenant]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleMergeUser = (user: User) => {
    setMergingUser(user);
    setIsMergeModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleCloseMergeModal = () => {
    setMergingUser(null);
    setIsMergeModalOpen(false);
  };

  const handleUpdateUser = async (updateData: {
    name: string;
    phone: string;
    member_type: (typeof MEMBER_TYPES)[keyof typeof MEMBER_TYPES];
  }) => {
    if (!editingUser) return false;

    const success = await updateUser(editingUser.user_id, updateData);
    if (success) {
      handleCloseEditModal();
    }
    return success;
  };

  const handleMergeUserConfirm = async (
    sourceUserId: string,
    targetUserId: string
  ) => {
    const success = await mergeUser(sourceUserId, targetUserId);
    if (success) {
      handleCloseMergeModal();
    }
    return success;
  };

  return (
    <AuthGuard isLoading={isLoading} isAuthenticated={isAuthenticated}>
      <AdminLayout
        title={UI_TEXT.USER_MANAGEMENT}
        description="登録ユーザーの管理ができます"
        user={session?.user}
        tenant={tenant}
        showBackButton={true}
        backUrl="/admin"
      >
        <div className="flex flex-col space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">ユーザー管理</h2>
          </div>
          <UserList
            users={filteredUsers}
            userFilter={userFilter}
            nameFilter={nameFilter}
            onMergeUser={handleMergeUser}
            onEditUser={handleEditUser}
            onUserFilterChange={setUserFilter}
            onNameFilterChange={setNameFilter}
          />
        </div>

        <UserEditModal
          isOpen={isEditModalOpen && !isMergeModalOpen}
          user={editingUser}
          onClose={handleCloseEditModal}
          onUpdateUser={handleUpdateUser}
          onMergeUser={handleMergeUser}
        />

        <UserMergeModal
          isOpen={isMergeModalOpen}
          user={mergingUser}
          allUsers={users}
          onClose={handleCloseMergeModal}
          onMergeUser={handleMergeUserConfirm}
        />
      </AdminLayout>
    </AuthGuard>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UsersContent />
    </Suspense>
  );
}
