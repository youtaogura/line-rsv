import { MonthNavigation } from '@/components/admin/MonthNavigation';
import { ReservationCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Reservation } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';
import React from 'react';

interface ReservationWithStaff extends Reservation {
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
  onAdminNoteUpdate?: (reservationId: string, adminNote: string) => Promise<void>;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  onDeleteReservation,
  selectedStaffId,
  currentMonth,
  onMonthChange,
  onAdminNoteUpdate,
}) => {
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
              onAdminNoteUpdate={onAdminNoteUpdate}
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
    </div>
  );
};
