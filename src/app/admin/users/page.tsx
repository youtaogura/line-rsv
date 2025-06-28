"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useAdminSession, useUsers } from "@/hooks/useAdminData";
import { UserList } from "@/components/admin/UserList";
import { UserEditModal } from "@/components/admin/UserEditModal";
import { AuthGuard, AdminLayout, LoadingSpinner } from '@/components/common';
import { UI_TEXT } from '@/constants/ui';
import { MEMBER_TYPES } from '@/constants/business';
import type { User } from "@/lib/supabase";

type UserFilter = 'all' | 'regular' | 'guest';

function UsersContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { users, fetchUsers, updateUser, mergeUser } = useUsers();
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'merge'>('edit');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [nameFilter, setNameFilter] = useState('');

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (userFilter !== 'all') {
      filtered = filtered.filter(user => user.member_type === userFilter);
    }

    if (nameFilter.trim()) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    return filtered;
  }, [users, userFilter, nameFilter]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const fetchData = async () => {
        await fetchUsers();
        setLoading(false);
      };
      fetchData();
    }
  }, [isAuthenticated, session, fetchUsers]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setModalMode('edit');
    setIsEditModalOpen(true);
  };

  const handleMergeUser = (user: User) => {
    setEditingUser(user);
    setModalMode('merge');
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
    setModalMode('edit');
  };

  const handleUpdateUser = async (updateData: {
    name: string;
    phone: string;
    member_type: typeof MEMBER_TYPES[keyof typeof MEMBER_TYPES];
  }) => {
    if (!editingUser) return false;

    const success = await updateUser(editingUser.user_id, updateData);
    if (success) {
      handleCloseModal();
    }
    return success;
  };

  const handleMergeUserConfirm = async (sourceUserId: string, targetUserId: string) => {
    const success = await mergeUser(sourceUserId, targetUserId);
    if (success) {
      handleCloseModal();
    }
    return success;
  };

  return (
    <AuthGuard
      isLoading={isLoading}
      isAuthenticated={isAuthenticated}
    >
      <AdminLayout
        title={UI_TEXT.USER_MANAGEMENT}
        description="登録ユーザーの管理ができます"
        user={session?.user}
        showBackToAdmin={true}
      >
        <UserList
          users={filteredUsers}
          userFilter={userFilter}
          nameFilter={nameFilter}
          onEditUser={handleEditUser}
          onMergeUser={handleMergeUser}
          onUserFilterChange={setUserFilter}
          onNameFilterChange={setNameFilter}
        />

        <UserEditModal
          isOpen={isEditModalOpen}
          user={editingUser}
          allUsers={users}
          mode={modalMode}
          onClose={handleCloseModal}
          onUpdateUser={handleUpdateUser}
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
