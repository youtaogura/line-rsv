"use client";

import { useState, Suspense, useEffect } from "react";
import { useAdminSession, useUsers } from "@/hooks/useAdminData";
import { UserList } from "@/components/admin/UserList";
import { UserEditModal } from "@/components/admin/UserEditModal";
import { AuthGuard, AdminLayout, LoadingSpinner } from '@/components/common';
import { UI_TEXT } from '@/constants/ui';
import { MEMBER_TYPES } from '@/constants/business';
import type { User } from "@/lib/supabase";

function UsersContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { users, fetchUsers, updateUser } = useUsers();
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
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
          users={users}
          onEditUser={handleEditUser}
        />

        <UserEditModal
          isOpen={isEditModalOpen}
          user={editingUser}
          onClose={handleCloseModal}
          onUpdateUser={handleUpdateUser}
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
