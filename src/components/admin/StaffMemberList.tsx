import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminStaffMemberBusinessHours } from '@/hooks/admin';
import { getDayName } from '@/lib/admin-types';
import type {
  BusinessHourSimple,
  StaffMember,
  StaffMemberBusinessHour,
} from '@/lib/supabase';
import { Clock, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { StaffEditModal } from './StaffEditModal';

interface StaffMemberListProps {
  staffMembers: StaffMember[];
  onUpdateStaffMember: (id: string, name: string) => Promise<boolean>;
  onDeleteStaffMember: (id: string) => Promise<void>;
  tenantBusinessHours: BusinessHourSimple[];
  allStaffBusinessHours: StaffBusinessHoursMap;
}

export interface StaffBusinessHoursMap {
  [staffId: string]: StaffMemberBusinessHour[];
}

export const StaffMemberList: React.FC<StaffMemberListProps> = ({
  staffMembers,
  onUpdateStaffMember,
  onDeleteStaffMember,
  tenantBusinessHours,
  allStaffBusinessHours,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    businessHours,
    loading: businessHoursLoading,
    fetchStaffMemberBusinessHours,
    createStaffMemberBusinessHour,
    deleteStaffMemberBusinessHour,
  } = useAdminStaffMemberBusinessHours();

  useEffect(() => {
    if (selectedStaff) {
      fetchStaffMemberBusinessHours(selectedStaff.id);
    }
  }, [selectedStaff, fetchStaffMemberBusinessHours]);

  const handleCreateBusinessHour = async (
    staffMemberId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => {
    await createStaffMemberBusinessHour({
      staff_member_id: staffMemberId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
  };

  const handleEditClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedStaff(null);
    setIsModalOpen(false);
  };

  // スタッフの営業時間を曜日ごとにグループ化して表示する関数
  const renderStaffBusinessHours = (staffId: string) => {
    const staffBusinessHours = allStaffBusinessHours[staffId] || [];

    if (staffBusinessHours.length === 0) {
      return (
        <div className="text-sm text-muted-foreground mt-2">
          <Clock className="h-4 w-4 inline mr-1" />
          対応可能時間が設定されていません
        </div>
      );
    }

    // 曜日ごとにグループ化
    const groupedByDay = staffBusinessHours.reduce(
      (acc, hour) => {
        const dayKey = hour.day_of_week;
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(hour);
        return acc;
      },
      {} as Record<number, StaffMemberBusinessHour[]>
    );

    // 各曜日の営業時間を開始時間順にソート
    Object.keys(groupedByDay).forEach((dayKey) => {
      groupedByDay[parseInt(dayKey)].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );
    });

    // 曜日順にソート（0=日曜日から6=土曜日）
    const sortedDayKeys = Object.keys(groupedByDay)
      .map((key) => parseInt(key))
      .sort((a, b) => a - b);

    return (
      <div className="mt-2">
        <div className="space-y-1">
          {sortedDayKeys.map((dayOfWeek) => {
            const dayHours = groupedByDay[dayOfWeek];
            return (
              <div key={dayOfWeek} className="text-sm">
                <Clock className="h-4 w-4 inline mr-1" />
                <span className="font-medium text-gray-700">
                  {getDayName(dayOfWeek)}:
                </span>{' '}
                {dayHours.map((businessHour, index) => (
                  <span key={businessHour.id}>
                    {businessHour.start_time.slice(0, -3)} -{' '}
                    {businessHour.end_time.slice(0, -3)}
                    {index < dayHours.length - 1 && ', '}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Card View */}
      <div className="space-y-2">
        {staffMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            スタッフが登録されていません
          </div>
        ) : (
          staffMembers.map((staff) => (
            <Card
              key={staff.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEditClick(staff)}
            >
              <CardContent className="py-1 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-md">{staff.name}</h3>
                    {renderStaffBusinessHours(staff.id)}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {staffMembers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteStaffMember(staff.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <StaffEditModal
        isOpen={isModalOpen}
        staffMember={selectedStaff}
        onClose={handleCloseModal}
        onUpdateStaffMember={onUpdateStaffMember}
        businessHours={businessHours}
        tenantBusinessHours={tenantBusinessHours}
        businessHoursLoading={businessHoursLoading}
        onCreateBusinessHour={handleCreateBusinessHour}
        onDeleteBusinessHour={deleteStaffMemberBusinessHour}
      />
    </>
  );
};
