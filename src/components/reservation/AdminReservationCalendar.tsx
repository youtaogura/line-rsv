"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { CalendarView } from "./Calendar/CalendarView";
import { ReservationModal } from "./ReservationModal";
import { Switch } from "@/components/ui/switch";
import { startOfMonth, format, addMinutes, isSameDay } from "date-fns";
import type { TimeSlot } from "./types";
import type { Reservation, User, ReservationMenuSimple, ReservationData } from "@/lib/supabase";

interface ReservationWithUser extends Reservation {
  users?: {
    user_id: string;
    name: string;
  } | null;
}
import { MonthlyAvailability } from "@/app/api/availability/monthly/route";

interface AdminReservationCalendarProps {
  tenantId: string | null;
  reservations: ReservationWithUser[];
  onDeleteReservation: (tenantId:string, id: string) => void;
  onCreateReservation?: (datetime: string) => void;
  availableUsers?: User[];
  selectedStaffId: string;
  businessDaysSet: Set<number>;
  monthlyAvailability: MonthlyAvailability | null;
  reservationMenu: ReservationMenuSimple | null;
  onCreateReservationData: (reservationData: ReservationData) => Promise<void>;
}

interface DayReservations {
  [date: string]: ReservationWithUser[];
}

interface TimeSlotWithReservation {
  startTime: string;
  endTime?: string;
  datetime: string;
  reservation?: ReservationWithUser;
}

// タイムスロットを統合する関数
function consolidateTimeSlots(
  timeSlots: TimeSlot[],
  reservations: ReservationWithUser[],
): TimeSlotWithReservation[] {
  const consolidatedSlots: TimeSlotWithReservation[] = [];
  const processedSlots = new Set<string>();

  timeSlots.forEach((slot) => {
    if (processedSlots.has(slot.time)) return;

    // このスロットに対応する予約を探す
    const reservation = reservations.find(
      (r) => format(new Date(r.datetime), "HH:mm") === slot.time,
    );

    if (reservation) {
      // 予約ありスロット：実際の予約時間で統合
      const reservationStart = new Date(reservation.datetime);
      const reservationDuration = reservation.duration_minutes || 30;
      const reservationEnd = addMinutes(reservationStart, reservationDuration);

      const startTime = format(reservationStart, "HH:mm");
      const endTime = format(reservationEnd, "HH:mm");

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
    a.startTime.localeCompare(b.startTime),
  );
}

function reservationOnlyTimeSlots(
  currentDayReservations: ReservationWithUser[],
): TimeSlotWithReservation[] {
  return currentDayReservations
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .map(reservation => {
      const reservationStart = new Date(reservation.datetime);
      const reservationDuration = reservation.duration_minutes || 30;
      const reservationEnd = addMinutes(reservationStart, reservationDuration);
      
      return {
        startTime: format(reservationStart, "HH:mm"),
        endTime: format(reservationEnd, "HH:mm"),
        datetime: reservation.datetime,
        reservation,
      };
    });
}

export function AdminReservationCalendar({
  tenantId,
  reservations,
  onDeleteReservation,
  onCreateReservation,
  availableUsers = [],
  selectedStaffId,
  businessDaysSet,
  monthlyAvailability,
  reservationMenu,
  onCreateReservationData,
}: AdminReservationCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [dayReservations, setDayReservations] = useState<DayReservations>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [reservationsOnlySelected, setReservationsOnlySelected] = useState(false);

  const timeSlots = useMemo(() => {
    if (!monthlyAvailability) return [];
    if (selectedStaffId === "all" || selectedStaffId === "unassigned") {
      return monthlyAvailability.tenant.timeSlots;
    }
    if (selectedStaffId) {
      const staffAvailability = monthlyAvailability.staffMembers.find(
        (staff) => staff.id === selectedStaffId
      );
      return staffAvailability?.timeSlots ?? []
    }

    return monthlyAvailability.tenant.timeSlots;
  }, [monthlyAvailability, selectedStaffId]);

  const showReservationsOnly = useMemo(() => {
    return selectedStaffId === "all" || selectedStaffId === "unassigned" || reservationsOnlySelected;
  }, [selectedStaffId, reservationsOnlySelected]);


  // 予約データを日付ごとにグループ化
  useEffect(() => {
    const grouped: DayReservations = {};
    reservations.forEach((reservation) => {
      const date = format(new Date(reservation.datetime), "yyyy-MM-dd");
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

  const handleMonthChange = useCallback((activeStartDate: Date) => {
    setCurrentMonth(startOfMonth(activeStartDate));
    setSelectedDate(null);
  }, []);

  const selectedDateString = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;
  const selectedDayTimeSlots = useMemo(() => {
    if (!monthlyAvailability || !selectedDate) return [];
    
    // 「全員」「担当なし」選択時、または「予約だけ表示」がONの場合は空き情報を表示しない
    if (selectedStaffId === "all" || selectedStaffId === "unassigned" || reservationsOnlySelected) {
      return [];
    }
    
    return monthlyAvailability.staffMembers.find(
      (staff) => staff.id === selectedStaffId
    )?.timeSlots.filter(
      slot => isSameDay(new Date(slot.datetime), selectedDate),
    ) ?? [];
  }, [monthlyAvailability, selectedDate, selectedStaffId, reservationsOnlySelected])

  // 統合されたタイムスロットを計算
  const timeSlotsWithReservation = useMemo(() => {
    const currentDayReservations = selectedDateString
      ? dayReservations[selectedDateString] || []
      : [];
    
    // 「全員」「担当なし」選択時、または「予約だけ表示」がONの場合は予約情報のみを表示（空き情報は表示しない）
    if (showReservationsOnly) {
      return reservationOnlyTimeSlots(currentDayReservations)
    }
    return consolidateTimeSlots(
      selectedDayTimeSlots,
      currentDayReservations,
    );
  }, [selectedDayTimeSlots, selectedDateString, dayReservations, showReservationsOnly]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            予約カレンダー
          </h3>
          {selectedStaffId && selectedStaffId !== "all" && selectedStaffId !== "unassigned" && (
            <div className="flex items-center space-x-3">
              <Switch
                checked={reservationsOnlySelected}
                onCheckedChange={setReservationsOnlySelected}
                id="reservations-only-toggle"
              />
              <label 
                htmlFor="reservations-only-toggle"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                予約だけ表示
              </label>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* カレンダー部分 */}
          <div className="w-full overflow-hidden">
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
          <div className="flex flex-col min-h-[400px] lg:min-h-96">
            <h4 className="text-md font-medium text-gray-900 mb-3">
              {selectedDate
                ? format(selectedDate, "M月d日の予約")
                : "日付を選択してください"}
            </h4>

            {selectedDate ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* タイムスロット一覧 */}
                <div className="flex-1 overflow-hidden">
                  <div className="space-y-2 max-h-80 lg:max-h-96 overflow-y-auto">
                    {timeSlotsWithReservation.map((slot, index) => {
                      const displayTime = slot.endTime
                        ? `${slot.startTime}-${slot.endTime}`
                        : slot.startTime;

                      return (
                        <div
                          key={`${slot.startTime}-${index}`}
                          className={`border rounded-lg p-3 ${
                            slot.reservation
                              ? "border-orange-200 bg-orange-50"
                              : "border-green-200 bg-green-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {displayTime}
                                </span>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    slot.reservation
                                      ? "bg-red-100 text-orange-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {slot.reservation ? "予約済み" : "空き"}
                                </span>

                                {slot.reservation && (
                                  <>
                                    <span className="text-sm font-medium text-gray-700">
                                      {slot.reservation!.users?.name || "ユーザー名が取得できませんでした"}
                                    </span>
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        slot.reservation!.member_type ===
                                        "regular"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {slot.reservation!.member_type ===
                                      "regular"
                                        ? "会員"
                                        : "ゲスト"}
                                    </span>
                                  </>
                                )}
                              </div>

                              {slot.reservation?.note && (
                                <p className="text-sm text-gray-600 mt-1">
                                  備考: {slot.reservation!.note}
                                </p>
                              )}
                            </div>

                            {slot.reservation ? (
                              <button
                                onClick={() =>{
                                  if (!tenantId) throw new Error("テナントIDが見つかりません");
                                  onDeleteReservation(tenantId, slot.reservation!.id)
                                }}
                                className="text-red-600 hover:text-red-900 text-sm ml-2"
                              >
                                削除
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedDateTime(slot.datetime);
                                  setIsModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 text-sm ml-2"
                              >
                                予約追加
                              </button>
                            )}
                          </div>
                        </div>
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
      </div>

      {/* 予約作成モーダル */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedDateTime={selectedDateTime}
        availableUsers={availableUsers}
        reservationMenu={reservationMenu}
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
