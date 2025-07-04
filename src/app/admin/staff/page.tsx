'use client';

import { StaffMemberDialog } from '@/components/admin/StaffMemberDialog';
import { StaffMemberList } from '@/components/admin/StaffMemberList';
import { AdminLayout, AuthGuard, LoadingSpinner } from '@/components/common';
import {
  useAdminSession,
  useAdminBusinessHours,
  useAdminStaffMembers,
  useAdminTenant,
} from '@/hooks/admin';
import { Suspense, useEffect } from 'react';

function StaffContent() {
  const { session, isLoading, isAuthenticated } = useAdminSession();
  const { tenant, fetchTenant } = useAdminTenant();
  const {
    staffMembers,
    staffBusinessHours,
    loading,
    fetchStaffMembers,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
  } = useAdminStaffMembers();
  const { businessHours: tenantBusinessHours, fetchBusinessHours } =
    useAdminBusinessHours();

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchStaffMembers({ withBusinessHours: true });
      fetchBusinessHours();
      fetchTenant();
    }
  }, [
    isAuthenticated,
    session,
    fetchStaffMembers,
    fetchBusinessHours,
    fetchTenant,
  ]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthGuard isLoading={isLoading} isAuthenticated={isAuthenticated}>
      <AdminLayout
        title="スタッフ管理"
        description="スタッフの追加・編集・削除ができます"
        user={session?.user}
        tenant={tenant}
        showBackButton={true}
        backUrl="/admin"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">スタッフ管理</h2>

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
