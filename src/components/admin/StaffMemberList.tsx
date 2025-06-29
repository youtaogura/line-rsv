import React, { useState } from "react";
import type { StaffMember, BusinessHourSimple } from "@/lib/supabase";
import { DateTimeDisplay } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffEditModal } from "./StaffEditModal";
import { UI_TEXT } from "@/constants/ui";

interface StaffMemberListProps {
  staffMembers: StaffMember[];
  onUpdateStaffMember: (id: string, name: string) => Promise<boolean>;
  onDeleteStaffMember: (id: string) => Promise<void>;
  businessHours: BusinessHourSimple[];
  tenantBusinessHours: BusinessHourSimple[];
  businessHoursLoading: boolean;
  onCreateBusinessHour: (staffMemberId: string, dayOfWeek: number, startTime: string, endTime: string) => Promise<void>;
  onDeleteBusinessHour: (id: string) => Promise<void>;
}

export const StaffMemberList: React.FC<StaffMemberListProps> = ({
  staffMembers,
  onUpdateStaffMember,
  onDeleteStaffMember,
  businessHours,
  tenantBusinessHours,
  businessHoursLoading,
  onCreateBusinessHour,
  onDeleteBusinessHour,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedStaff(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>スタッフ一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Card View */}
          <div className="space-y-4">
            {staffMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                スタッフが登録されていません
              </div>
            ) : (
              staffMembers.map((staff) => (
                <Card key={staff.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{staff.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          作成日時: <DateTimeDisplay datetime={staff.created_at} format="short" />
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(staff)}
                          className="text-primary hover:text-primary/80"
                        >
                          設定
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteStaffMember(staff.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          {UI_TEXT.DELETE}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <StaffEditModal
        isOpen={isModalOpen}
        staffMember={selectedStaff}
        onClose={handleCloseModal}
        onUpdateStaffMember={onUpdateStaffMember}
        businessHours={businessHours}
        tenantBusinessHours={tenantBusinessHours}
        businessHoursLoading={businessHoursLoading}
        onCreateBusinessHour={onCreateBusinessHour}
        onDeleteBusinessHour={onDeleteBusinessHour}
      />
    </>
  );
};