import { format, isBefore, isSameDay, startOfDay } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { TimeSlot } from '../types';
import './calendar-styles.css';
import { CalendarTile } from './CalendarTile';

interface Reservation {
  datetime: string;
}
interface CalendarViewProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  onActiveStartDateChange: (activeStartDate: Date) => void;
  timeSlots: TimeSlot[];
  reservations?: Reservation[];
  showReservationsOnly?: boolean;
  businessDaysSet?: Set<number>;
}

export const CalendarView = React.memo(function CalendarView({
  selectedDate,
  onDateChange,
  onActiveStartDateChange,
  timeSlots,
  reservations = [],
  showReservationsOnly = false,
  businessDaysSet,
}: CalendarViewProps) {
  const today = startOfDay(new Date());

  const isPastDate = useCallback(
    (date: Date) => isBefore(startOfDay(date), today),
    [today]
  );

  const hasEmptySlot = useCallback(
    (date: Date) =>
      timeSlots.some(
        (slot) => isSameDay(new Date(slot.datetime), date) && slot.isAvailable
      ),
    [timeSlots]
  );

  // 各日付の予約数を計算
  const dailyReservationCounts = useMemo(() => {
    const counts: { [date: string]: number } = {};
    reservations.forEach((reservation) => {
      const dateString = format(new Date(reservation.datetime), 'yyyy-MM-dd');
      counts[dateString] = (counts[dateString] || 0) + 1;
    });
    return counts;
  }, [reservations]);

  const isTileAvailable = useCallback(
    ({ date }: { date: Date }) => {
      const isBusinessDay = businessDaysSet?.has(date.getDay());
      // 「全員」「担当なし」選択時、または「予約だけ表示」がONの場合は全ての日付を選択可能にする
      if (showReservationsOnly) {
        return !isPastDate(date) && isBusinessDay;
      }
      return !isPastDate(date) && isBusinessDay;
    },
    [showReservationsOnly, isPastDate, businessDaysSet]
  );

  const getTileClassName = useCallback(
    ({ date, view }: { date: Date; view: string }) => {
      if (view !== 'month') return '';

      let classes = 'relative ';
      const isAvailable = isTileAvailable({ date });

      if (!isAvailable) {
        classes += 'bg-gray-200 text-gray-400 cursor-not-allowed ';
      } else {
        classes += 'bg-white hover:bg-blue-50 cursor-pointer ';
      }

      const isSelected = selectedDate && isSameDay(selectedDate, date);

      if (isSelected && isAvailable) {
        classes += 'bg-blue-500 text-white hover:bg-blue-600 ';
      }

      return classes.trim();
    },
    [selectedDate, isTileAvailable]
  );

  const getTileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;

    return !isTileAvailable({ date });
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const isBusinessDay = businessDaysSet?.has(date.getDay());
    const isPast = isPastDate(date);
    const hasEmpty = hasEmptySlot(date);
    const dateString = format(date, 'yyyy-MM-dd');
    const reservationCount = dailyReservationCounts[dateString] || 0;

    return (
      <CalendarTile
        isAvailable={hasEmpty}
        reservationCount={
          showReservationsOnly && reservationCount > 0 ? reservationCount : 0
        }
        showNothing={
          (showReservationsOnly && reservationCount === 0) ||
          !isBusinessDay ||
          isPast
        }
      />
    );
  };

  const handleDateClick = (
    value: Date | Date[] | null | [Date | null, Date | null]
  ) => {
    if (value && !Array.isArray(value)) {
      if (isTileAvailable({ date: value })) {
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

  return (
    <div className="w-full">
      <Calendar
        value={selectedDate}
        onChange={handleDateClick}
        // activeStartDate={currentMonth}
        onActiveStartDateChange={handleActiveStartDateChange}
        tileClassName={getTileClassName}
        tileDisabled={getTileDisabled}
        tileContent={getTileContent}
        locale="ja-JP"
        minDate={today}
        maxDetail="month"
        minDetail="month"
        formatDay={(_, date) => date.getDate().toString()}
        className="w-full border-0 bg-white rounded-xs"
      />
    </div>
  );
});
