"use client";

import { Suspense, useEffect } from "react";
import { useAdminSession, useStaffMembers, useBusinessHours, useStaffMemberBusinessHours } from "@/hooks/useAdminData";
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
  const { businessHours: tenantBusinessHours, fetchBusinessHours } = useBusinessHours();
  const {
    businessHours,
    loading: businessHoursLoading,
    createStaffMemberBusinessHour,
    deleteStaffMemberBusinessHour,
  } = useStaffMemberBusinessHours();

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchStaffMembers();
      fetchBusinessHours();
    }
  }, [isAuthenticated, session, fetchStaffMembers, fetchBusinessHours]);

  const handleCreateBusinessHour = async (staffMemberId: string, dayOfWeek: number, startTime: string, endTime: string) => {
    await createStaffMemberBusinessHour({
      staff_member_id: staffMemberId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
  };

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
        showBackButton={true}
      >
        <div className="space-y-8">
          <StaffMemberForm onCreateStaffMember={createStaffMember} />
          <StaffMemberList
            staffMembers={staffMembers}
            onUpdateStaffMember={updateStaffMember}
            onDeleteStaffMember={deleteStaffMember}
            businessHours={businessHours}
            tenantBusinessHours={tenantBusinessHours}
            businessHoursLoading={businessHoursLoading}
            onCreateBusinessHour={handleCreateBusinessHour}
            onDeleteBusinessHour={deleteStaffMemberBusinessHour}
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