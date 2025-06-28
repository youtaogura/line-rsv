"use client";

import { Suspense, useEffect } from "react";
import { useAdminSession, useStaffMembers } from "@/hooks/useAdminData";
import { AuthGuard, AdminLayout, LoadingSpinner } from '@/components/common';
import { StaffMemberList } from "@/components/admin/StaffMemberList";
import { StaffMemberForm } from "@/components/admin/StaffMemberForm";

function StaffContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const {
    staffMembers,
    loading,
    fetchStaffMembers,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
  } = useStaffMembers();

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchStaffMembers();
    }
  }, [isAuthenticated, session, fetchStaffMembers]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthGuard
      isLoading={isLoading}
      isAuthenticated={isAuthenticated}
    >
      <AdminLayout
        title="スタッフ管理"
        description="スタッフの追加・編集・削除ができます"
        user={session?.user}
        showBackToAdmin={true}
      >
        <div className="space-y-8">
          <StaffMemberForm onCreateStaffMember={createStaffMember} />
          <StaffMemberList
            staffMembers={staffMembers}
            onUpdateStaffMember={updateStaffMember}
            onDeleteStaffMember={deleteStaffMember}
          />
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StaffContent />
    </Suspense>
  );
}