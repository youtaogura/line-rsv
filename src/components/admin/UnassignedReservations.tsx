import { DateTimeDisplay, MemberTypeBadge } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import type { ReservationSimple, StaffMemberSimple } from '@/lib/supabase';
import { CircleAlert } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { StaffAssignModal } from './StaffAssignModal';

interface UnassignedReservationsProps {
  reservations: ReservationSimple[];
  staffMembers: StaffMemberSimple[];
  tenantId: string;
  onAssignStaff: (reservationId: string, staffId: string) => Promise<void>;
  onRemoveStaff: (reservationId: string) => Promise<void>;
}

export const UnassignedReservations: React.FC<UnassignedReservationsProps> = ({
  reservations,
  staffMembers,
  onAssignStaff,
  onRemoveStaff,
}) => {
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationSimple | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAssignStaff = (reservation: ReservationSimple) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  return (
    <div className="mb-8 bg-white border border-amber-200 rounded-xs shadow">
      <div className="px-6 py-4 border-b border-amber-200 bg-amber-50">
        <div className="flex items-center space-x-2">
          <CircleAlert className="w-5 h-5 text-amber-600" />
          <h2 className="text-md font-medium text-amber-800">
            担当未設定の予約
          </h2>
          {reservations.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-amber-800 bg-amber-200 rounded-full">
              {reservations.length}件
            </span>
          )}
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="space-y-2">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-4 bg-white border rounded-xs gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sm text-gray-900 truncate">
                    {reservation.users?.name ||
                      'ユーザー名が取得できませんでした'}
                  </span>
                  {reservation.is_created_by_user && (
                    <Badge variant="secondary" className="text-xs">
                      LINE予約
                    </Badge>
                  )}
                  <MemberTypeBadge memberType={reservation.member_type} />
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                <div className="text-sm text-gray-600">
                  <DateTimeDisplay
                    datetime={reservation.datetime}
                    format="short"
                  />
                </div>
                <Button
                  onClick={() => handleAssignStaff(reservation)}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  設定
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <StaffAssignModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        reservation={selectedReservation}
        staffMembers={staffMembers}
        onAssignStaff={onAssignStaff}
        onRemoveStaff={onRemoveStaff}
      />
    </div>
  );
};
