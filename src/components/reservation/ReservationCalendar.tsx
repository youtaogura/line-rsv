'use client';

import { MonthlyAvailability } from '@/app/api/public/availability/monthly/route';
import type { ReservationMenuApiResponse } from '@/app/api/public/reservation-menu/route';
import { isSameDay } from 'date-fns';
import { useMemo } from 'react';
import { CalendarView } from './Calendar/CalendarView';
import { TimeSlotList } from './TimeSlot/TimeSlotList';

interface ReservationCalendarProps {
  reservationMenu: ReservationMenuApiResponse;
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (activeStartDate: Date) => void;
  monthlyAvailability: MonthlyAvailability;
  selectedDateTime: string | null;
  onDateTimeSelect: (datetime: string | null) => void;
  selectedStaffId: string;
  businessDaysSet: Set<number>;
}

export function ReservationCalendar({
  reservationMenu,
  selectedDate,
  onDateChange,
  onMonthChange,
  monthlyAvailability,
  selectedDateTime,
  onDateTimeSelect,
  selectedStaffId,
  businessDaysSet,
}: ReservationCalendarProps) {
  const handleTimeSelect = (datetime: string) => {
    onDateTimeSelect(datetime);
  };

  const timeSlots = useMemo(() => {
    if (selectedStaffId) {
      const staffAvailability = monthlyAvailability.staffMembers.find(
        (staff) => staff.id === selectedStaffId
      );
      return staffAvailability?.timeSlots ?? [];
    }

    return monthlyAvailability.tenant.timeSlots;
  }, [monthlyAvailability, selectedStaffId]);

  return (
    <div className="space-y-6">
      {/* カレンダー表示 */}
      <div className="bg-white rounded-xs border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          予約日を選択
        </h2>
        <CalendarView
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          onActiveStartDateChange={onMonthChange}
          timeSlots={timeSlots}
          businessDaysSet={businessDaysSet}
        />
      </div>

      {/* 時間選択 */}
      {selectedDate && (
        <div className="bg-white rounded-xs border border-gray-200 p-4">
          <TimeSlotList
            selectedDate={selectedDate}
            availableSlots={timeSlots.filter((slot) => {
              return (
                slot.isAvailable &&
                isSameDay(new Date(slot.datetime), selectedDate)
              );
            })}
            selectedDateTime={selectedDateTime}
            onTimeSelect={handleTimeSelect}
            reservationMenu={reservationMenu}
          />
        </div>
      )}
    </div>
  );
}
