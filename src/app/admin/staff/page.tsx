'use client';

import { StaffMemberForm } from '@/components/admin/StaffMemberForm';
import { StaffMemberList } from '@/components/admin/StaffMemberList';
import { AdminLayout, AuthGuard, LoadingSpinner } from '@/components/common';
import {
  useAdminSession,
  useBusinessHours,
  useStaffMembers,
} from '@/hooks/useAdminData';
import { Suspense, useEffect } from 'react';

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
  const { businessHours: tenantBusinessHours, fetchBusinessHours } =
    useBusinessHours();

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchStaffMembers();
      fetchBusinessHours();
    }
  }, [isAuthenticated, session, fetchStaffMembers, fetchBusinessHours]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthGuard isLoading={isLoading} isAuthenticated={isAuthenticated}>
      <AdminLayout
        title="スタッフ管理"
        description="スタッフの追加・編集・削除ができます"
        user={session?.user}
        showBackButton={true}
      >
        <div className="space-y-8">
          <StaffMemberForm onCreateStaffMember={createStaffMember} />
          <StaffMemberList
            staffMembers={staffMembers}
            onUpdateStaffMember={updateStaffMember}
            onDeleteStaffMember={deleteStaffMember}
            tenantBusinessHours={tenantBusinessHours}
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
