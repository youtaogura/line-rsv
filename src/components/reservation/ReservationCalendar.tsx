import { useState, useEffect } from "react";
import { CalendarView } from "./Calendar/CalendarView";
import { TimeSlotList } from "./TimeSlot/TimeSlotList";
import type { DayAvailabilityInfo } from "./types";
import type { ReservationMenu } from "@/lib/supabase";
import type { TimeSlot } from "./types";

interface ReservationCalendarProps {
  reservationMenu: ReservationMenu | null;
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (activeStartDate: Date) => void;
  monthlyAvailabilityInfo: Map<string, DayAvailabilityInfo>;
  availableSlots: TimeSlot[];
  selectedDateTime: string | null;
  onDateTimeSelect: (datetime: string | null) => void;
  slotsLoading: boolean;
}

export function ReservationCalendar({
  reservationMenu,
  selectedDate,
  onDateChange,
  currentMonth,
  onMonthChange,
  monthlyAvailabilityInfo,
  availableSlots,
  selectedDateTime,
  onDateTimeSelect,
  slotsLoading,
}: ReservationCalendarProps) {
  const handleTimeSelect = (datetime: string) => {
    onDateTimeSelect(datetime);
  };

  return (
    <div className="space-y-6">
      {/* カレンダー表示 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          予約日を選択
        </h2>
        <CalendarView
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          currentMonth={currentMonth}
          onActiveStartDateChange={onMonthChange}
          availabilityInfo={monthlyAvailabilityInfo}
        />
      </div>

      {/* 時間選択 */}
      {selectedDate && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <TimeSlotList
            selectedDate={selectedDate}
            availableSlots={availableSlots}
            selectedDateTime={selectedDateTime}
            onTimeSelect={handleTimeSelect}
            loading={slotsLoading}
            reservationMenu={reservationMenu}
          />
        </div>
      )}
    </div>
  );
}
