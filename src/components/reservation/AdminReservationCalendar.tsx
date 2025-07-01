'use client';

import { MonthlyAvailability } from '@/app/api/public/availability/monthly/route';
import type {
  ReservationData,
  ReservationMenuSimple,
  User,
} from '@/lib/supabase';
import { addMinutes, format, isSameDay } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReservationWithUser,
  TimeSlotCard,
  TimeSlotWithReservation,
} from '../common/TimeSlotCard';
import { CalendarView } from './Calendar/CalendarView';
import { ReservationModal } from './ReservationModal';
import type { TimeSlot } from './types';

interface AdminReservationCalendarProps {
  reservations: ReservationWithUser[];
  onDeleteReservation: (id: string) => void;
  onCreateReservation?: (datetime: string) => void;
  availableUsers?: User[];
  selectedStaffId: string;
  businessDaysSet: Set<number>;
  monthlyAvailability: MonthlyAvailability | null;
  reservationMenu: ReservationMenuSimple | null;
  reservationsOnlySelected: boolean;
  onCreateReservationData: (reservationData: ReservationData) => Promise<void>;
  onMonthChange: (month: string) => void;
  onAdminNoteUpdate?: (
    reservationId: string,
    adminNote: string
  ) => Promise<void>;
}

interface DayReservations {
  [date: string]: ReservationWithUser[];
}

// タイムスロットを統合する関数
function consolidateTimeSlots(
  timeSlots: TimeSlot[],
  reservations: ReservationWithUser[]
): TimeSlotWithReservation[] {
  const consolidatedSlots: TimeSlotWithReservation[] = [];
  const processedSlots = new Set<string>();

  timeSlots.forEach((slot) => {
    if (processedSlots.has(slot.time)) return;

    // このスロットに対応する予約を探す
    const reservation = reservations.find(
      (r) => format(new Date(r.datetime), 'HH:mm') === slot.time
    );

    if (reservation) {
      // 予約ありスロット：実際の予約時間で統合
      const reservationStart = new Date(reservation.datetime);
      const reservationDuration = reservation.duration_minutes || 30;
      const reservationEnd = addMinutes(reservationStart, reservationDuration);

      const startTime = format(reservationStart, 'HH:mm');
      const endTime = format(reservationEnd, 'HH:mm');

      consolidatedSlots.push({
        startTime,
        endTime,
        datetime: slot.datetime,
        reservation,
      });

      // この予約によってカバーされるスロットをマーク
      timeSlots.forEach((s) => {
        const sTime = new Date(s.datetime);
        if (sTime >= reservationStart && sTime < reservationEnd) {
          processedSlots.add(s.time);
        }
      });
    } else if (slot.isAvailable) {
      // 空きスロット
      consolidatedSlots.push({
        startTime: slot.time,
        datetime: slot.datetime,
      });
      processedSlots.add(slot.time);
    }
  });

  return consolidatedSlots.sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
}

function reservationOnlyTimeSlots(
  currentDayReservations: ReservationWithUser[]
): TimeSlotWithReservation[] {
  return currentDayReservations
    .sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    )
    .map((reservation) => {
      const reservationStart = new Date(reservation.datetime);
      const reservationDuration = reservation.duration_minutes || 30;
      const reservationEnd = addMinutes(reservationStart, reservationDuration);

      return {
        startTime: format(reservationStart, 'HH:mm'),
        endTime: format(reservationEnd, 'HH:mm'),
        datetime: reservation.datetime,
        reservation,
      };
    });
}

export function AdminReservationCalendar({
  reservations,
  onDeleteReservation,
  onCreateReservation,
  availableUsers = [],
  selectedStaffId,
  businessDaysSet,
  monthlyAvailability,
  reservationMenu,
  reservationsOnlySelected,
  onCreateReservationData,
  onMonthChange,
  onAdminNoteUpdate,
}: AdminReservationCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dayReservations, setDayReservations] = useState<DayReservations>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string>('');

  const timeSlots = useMemo(() => {
    if (!monthlyAvailability) return [];
    if (selectedStaffId === 'all' || selectedStaffId === 'unassigned') {
      return monthlyAvailability.tenant.timeSlots;
    }
    if (selectedStaffId) {
      const staffAvailability = monthlyAvailability.staffMembers.find(
        (staff) => staff.id === selectedStaffId
      );
      return staffAvailability?.timeSlots ?? [];
    }

    return monthlyAvailability.tenant.timeSlots;
  }, [monthlyAvailability, selectedStaffId]);

  const showReservationsOnly = useMemo(() => {
    return (
      selectedStaffId === 'all' ||
      selectedStaffId === 'unassigned' ||
      reservationsOnlySelected
    );
  }, [selectedStaffId, reservationsOnlySelected]);

  // 予約データを日付ごとにグループ化
  useEffect(() => {
    const grouped: DayReservations = {};
    reservations.forEach((reservation) => {
      const date = format(new Date(reservation.datetime), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(reservation);
    });
    setDayReservations(grouped);
  }, [reservations]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback(
    (activeStartDate: Date) => {
      onMonthChange(format(activeStartDate, 'yyyy-MM'));
      setSelectedDate(null);
    },
    [onMonthChange]
  );

  const selectedDateString = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : null;
  const selectedDayTimeSlots = useMemo(() => {
    if (!monthlyAvailability || !selectedDate) return [];

    // 「全員」「担当なし」選択時、または「予約だけ表示」がONの場合は空き情報を表示しない
    if (
      selectedStaffId === 'all' ||
      selectedStaffId === 'unassigned' ||
      reservationsOnlySelected
    ) {
      return [];
    }

    return (
      monthlyAvailability.staffMembers
        .find((staff) => staff.id === selectedStaffId)
        ?.timeSlots.filter((slot) =>
          isSameDay(new Date(slot.datetime), selectedDate)
        ) ?? []
    );
  }, [
    monthlyAvailability,
    selectedDate,
    selectedStaffId,
    reservationsOnlySelected,
  ]);

  // 統合されたタイムスロットを計算
  const timeSlotsWithReservation = useMemo(() => {
    const currentDayReservations = selectedDateString
      ? dayReservations[selectedDateString] || []
      : [];

    // 「全員」「担当なし」選択時、または「予約だけ表示」がONの場合は予約情報のみを表示（空き情報は表示しない）
    if (showReservationsOnly) {
      return reservationOnlyTimeSlots(currentDayReservations);
    }
    return consolidateTimeSlots(selectedDayTimeSlots, currentDayReservations);
  }, [
    selectedDayTimeSlots,
    selectedDateString,
    dayReservations,
    showReservationsOnly,
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* カレンダー部分 */}
        <div className="w-full overflow-hidden shadow rounded-xs p-4 lg:col-span-3">
          <CalendarView
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onActiveStartDateChange={handleMonthChange}
            timeSlots={timeSlots}
            reservations={reservations}
            showReservationsOnly={showReservationsOnly}
            businessDaysSet={businessDaysSet}
          />
        </div>

        {/* 選択日の予約詳細 */}
        <div className="flex flex-col min-h-[400px] lg:min-h-96 lg:col-span-2">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            {selectedDate
              ? format(selectedDate, 'M月d日の予約状況')
              : '日付を選択してください'}
          </h4>

          {selectedDate ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* タイムスロット一覧 */}
              <div className="flex-1 overflow-hidden">
                <div className="space-y-2 max-h-100 lg:max-h-136 overflow-y-auto">
                  {timeSlotsWithReservation.map((slot, index) => {
                    return (
                      <TimeSlotCard
                        key={`${slot.startTime}-${index}`}
                        slot={slot}
                        onDeleteReservation={() => {
                          onDeleteReservation(slot.reservation!.id);
                        }}
                        onAddReservation={() => {
                          setSelectedDateTime(slot.datetime);
                          setIsModalOpen(true);
                        }}
                        onAdminNoteUpdate={onAdminNoteUpdate}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              カレンダーから日付を選択すると、その日の予約詳細が表示されます
            </p>
          )}
        </div>
      </div>
      {/* </div> */}

      {/* 予約作成モーダル */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedDateTime={selectedDateTime}
        availableUsers={availableUsers}
        reservationMenu={reservationMenu}
        selectedStaffId={selectedStaffId}
        onCreateReservation={async (reservationData) => {
          await onCreateReservationData(reservationData);
          if (onCreateReservation) {
            onCreateReservation(selectedDateTime);
          }
        }}
      />
    </div>
  );
}
