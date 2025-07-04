import type { MonthlyAvailability } from '@/app/api/public/availability/monthly/route';
import { MonthNavigation } from '@/components/admin/MonthNavigation';
import { ReservationCard } from '@/components/common';
import { ReservationDetailModal } from '@/components/common/ReservationDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Reservation } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';
import React, { useState } from 'react';

export interface ReservationWithStaff extends Reservation {
  staff_members?: {
    id: string;
    name: string;
  } | null;
  users?: {
    user_id: string;
    name: string;
  } | null;
}

interface ReservationListProps {
  reservations: ReservationWithStaff[];
  onDeleteReservation: (id: string) => Promise<void>;
  selectedStaffId: string;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  monthlyAvailability?: MonthlyAvailability | null;
  staffMembers?: Array<{
    id: string;
    name: string;
  }>;
  onAdminNoteUpdate?: (
    reservationId: string,
    adminNote: string
  ) => Promise<void>;
  onStaffAssignment?: (reservationId: string, staffId: string) => Promise<void>;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  onDeleteReservation,
  selectedStaffId,
  currentMonth,
  onMonthChange,
  monthlyAvailability,
  staffMembers,
  onAdminNoteUpdate,
  onStaffAssignment,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationWithStaff | null>(null);

  const filteredReservations = reservations.filter((reservation) => {
    if (selectedStaffId === 'all') {
      return true;
    }
    if (selectedStaffId === 'unassigned') {
      return !reservation.staff_member_id;
    }
    return reservation.staff_member_id === selectedStaffId;
  });
  return (
    <div>
      <MonthNavigation
        currentMonth={currentMonth}
        onMonthChange={onMonthChange}
      />

      {/* Card View */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              予約がありません
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              variant="compact"
              onReservationClick={(reservation) => {
                setSelectedReservation(reservation as ReservationWithStaff);
                setIsDetailModalOpen(true);
              }}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDeleteReservation(reservation.id);
                  }}
                  className="text-red-600 hover:text-red-900 hover:bg-red-50 ml-2 p-2"
                  title="予約を削除"
                >
                  <Trash2 size={16} />
                </Button>
              }
            />
          ))
        )}
      </div>

      {/* 予約詳細モーダル */}
      {selectedReservation && (
        <ReservationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedReservation(null);
          }}
          reservation={selectedReservation}
          monthlyAvailability={monthlyAvailability}
          staffMembers={staffMembers}
          onAdminNoteUpdate={onAdminNoteUpdate}
          onStaffAssignment={onStaffAssignment}
        />
      )}
    </div>
  );
};
