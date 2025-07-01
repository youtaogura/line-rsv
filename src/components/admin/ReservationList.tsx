import { MonthNavigation } from '@/components/admin/MonthNavigation';
import { ReservationCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UI_TEXT } from '@/constants/ui';
import type { Reservation } from '@/lib/supabase';
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
  tenantId: string | null;
  reservations: ReservationWithStaff[];
  onDeleteReservation: (tenantId: string, id: string) => Promise<void>;
  selectedStaffId: string;
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  tenantId,
  reservations,
  onDeleteReservation,
  selectedStaffId,
  currentMonth,
  onMonthChange,
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
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!tenantId)
                      throw new Error('テナントIDが見つかりません');
                    onDeleteReservation(tenantId, reservation.id);
                  }}
                  className="text-red-600 hover:text-red-900 hover:bg-red-50 ml-2"
                >
                  {UI_TEXT.DELETE}
                </Button>
              }
            />
          ))
        )}
      </div>
    </div>
  );
};
