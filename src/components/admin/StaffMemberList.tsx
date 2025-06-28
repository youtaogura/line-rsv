import React, { useState } from "react";
import type { StaffMember } from "@/lib/supabase";
import { DateTimeDisplay } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffEditModal } from "./StaffEditModal";
import { UI_TEXT } from "@/constants/ui";

interface StaffMemberListProps {
  staffMembers: StaffMember[];
  onUpdateStaffMember: (id: string, name: string) => Promise<boolean>;
  onDeleteStaffMember: (id: string) => Promise<void>;
}

export const StaffMemberList: React.FC<StaffMemberListProps> = ({
  staffMembers,
  onUpdateStaffMember,
  onDeleteStaffMember,
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
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-muted-foreground">
                      スタッフが登録されていません
                    </td>
                  </tr>
                ) : (
                  staffMembers.map((staff) => (
                    <tr key={staff.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {staff.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <DateTimeDisplay datetime={staff.created_at} format="short" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
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
      />
    </>
  );
};