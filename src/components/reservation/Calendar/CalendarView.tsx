import React, { useCallback } from "react";
import Calendar from "react-calendar";
import { CalendarTile } from "./CalendarTile";
import { DayAvailability } from "../types";
import { format, isBefore, startOfDay } from "date-fns";
import "react-calendar/dist/Calendar.css";
import "./calendar-styles.css";

interface CalendarViewProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  currentMonth: Date;
  onActiveStartDateChange: (activeStartDate: Date) => void;
  availabilityData: DayAvailability[];
  loading: boolean;
  reservationCount?: { [date: string]: Array<unknown> };
  availabilityInfo?: Map<string, { availableSlots: number }>;
}

export const CalendarView = React.memo(function CalendarView({
  selectedDate,
  onDateChange,
  currentMonth,
  onActiveStartDateChange,
  availabilityData,
  loading,
  reservationCount,
  availabilityInfo,
}: CalendarViewProps) {
  const today = startOfDay(new Date());

  const getTileClassName = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== "month") return "";

      const dateStr = format(date, "yyyy-MM-dd");
      const dayAvailability = availabilityData.find(
        (item) => item.date === dateStr,
      );
      const isPastDate = isBefore(startOfDay(date), today);
      const isSelected =
        selectedDate && format(selectedDate, "yyyy-MM-dd") === dateStr;

      let classes = "relative ";

      if (isPastDate || !dayAvailability?.hasAvailability) {
        classes += "bg-gray-200 text-gray-400 cursor-not-allowed ";
      } else {
        classes += "bg-white hover:bg-blue-50 cursor-pointer ";
      }

      if (isSelected && !isPastDate && dayAvailability?.hasAvailability) {
        classes += "bg-blue-500 text-white hover:bg-blue-600 ";
      }

      return classes.trim();
    },
    [availabilityData, selectedDate, today],
  );

  const getTileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return false;

    // 管理者モード（reservationCountが存在する場合）では過去の日付も選択可能
    if (reservationCount) {
      return false;
    }

    const dateStr = format(date, "yyyy-MM-dd");
    const dayAvailability = availabilityData.find(
      (item) => item.date === dateStr,
    );
    const isPastDate = isBefore(startOfDay(date), today);

    return isPastDate || !dayAvailability?.hasAvailability;
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const dateStr = format(date, "yyyy-MM-dd");
    const dayReservations = reservationCount?.[dateStr] || [];
    const dayAvailability = availabilityInfo?.get(dateStr);

    return (
      <CalendarTile
        date={date}
        availabilityData={availabilityData}
        reservationCount={dayReservations.length}
        availableSlots={dayAvailability?.availableSlots}
      />
    );
  };

  const handleDateClick = (
    value: Date | Date[] | null | [Date | null, Date | null],
  ) => {
    if (value && !Array.isArray(value)) {
      // 管理者モード（reservationCountが存在する場合）では全ての日付を選択可能
      if (reservationCount) {
        onDateChange(value);
        return;
      }

      const dateStr = format(value, "yyyy-MM-dd");
      const dayAvailability = availabilityData.find(
        (item) => item.date === dateStr,
      );
      const isPastDate = isBefore(startOfDay(value), today);

      if (!isPastDate && dayAvailability?.hasAvailability) {
        onDateChange(value);
      }
    }
  };

  const handleActiveStartDateChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      onActiveStartDateChange(activeStartDate);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg">
        <div className="text-gray-500">カレンダーを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Calendar
        value={selectedDate}
        onChange={handleDateClick}
        activeStartDate={currentMonth}
        onActiveStartDateChange={handleActiveStartDateChange}
        tileClassName={getTileClassName}
        tileDisabled={getTileDisabled}
        tileContent={getTileContent}
        locale="ja-JP"
        minDate={reservationCount ? undefined : today}
        maxDetail="month"
        minDetail="month"
        className="w-full border-0 bg-white rounded-lg"
      />
    </div>
  );
});
