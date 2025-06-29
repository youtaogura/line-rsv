import React, { useState } from 'react';
import { MemberTypeBadge, DateTimeDisplay } from '@/components/common';
import { StaffAssignModal } from './StaffAssignModal';
import type { ReservationSimple, StaffMemberSimple } from '@/lib/supabase';

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
  tenantId: _tenantId,
  onAssignStaff,
  onRemoveStaff,
}) => {
  const [selectedReservation, setSelectedReservation] = useState<ReservationSimple | null>(null);
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
    <div className="mb-8 bg-white border border-red-200 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-red-200 bg-red-50">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h2 className="text-lg font-medium text-red-800">
            担当スタッフ未割り当ての予約
          </h2>
          {reservations.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-200 rounded-full">
              {reservations.length}件
            </span>
          )}
        </div>
      </div>
      <div className="px-6 py-4">
        {reservations.length === 0 ? (
          <p className="text-green-600">スタッフ未割り当ての予約はありません</p>
        ) : (
          <div className="space-y-2">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex justify-between items-center py-3 px-4 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{reservation.users?.name || "ユーザー名が取得できませんでした"}</span>
                    <MemberTypeBadge memberType={reservation.member_type} />
                  </div>
                  <div className="text-sm text-red-600 mt-1 font-medium">
                    担当スタッフ: 未指定
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    <DateTimeDisplay datetime={reservation.datetime} format="short" />
                  </div>
                  <button
                    onClick={() => handleAssignStaff(reservation)}
                    className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    担当設定
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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