'use client';

import { StaffMemberDialog } from '@/components/admin/StaffMemberDialog';
import { StaffMemberList, type StaffBusinessHoursMap } from '@/components/admin/StaffMemberList';
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
    staffBusinessHours,
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
      fetchStaffMembers({ withBusinessHours: true });
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">スタッフ一覧</h1>
          <StaffMemberDialog onCreateStaffMember={createStaffMember} />
        </div>
        <StaffMemberList
          staffMembers={staffMembers}
          onUpdateStaffMember={updateStaffMember}
          onDeleteStaffMember={deleteStaffMember}
          tenantBusinessHours={tenantBusinessHours}
          allStaffBusinessHours={staffBusinessHours}
        />
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
