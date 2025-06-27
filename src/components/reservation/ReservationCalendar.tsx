import { useState, useEffect } from "react";
import { CalendarView } from "./Calendar/CalendarView";
import { TimeSlotList } from "./TimeSlot/TimeSlotList";
import { useMonthlyAvailability } from "./hooks/useMonthlyAvailability";
import { useTimeSlots } from "./hooks/useTimeSlots";
import { useReservationMenu } from "./hooks/useReservationMenu";
import { startOfMonth } from "date-fns";

interface ReservationCalendarProps {
  tenantId: string | null;
  selectedDateTime: string | null;
  onDateTimeSelect: (datetime: string | null) => void;
}

export function ReservationCalendar({
  tenantId,
  selectedDateTime,
  onDateTimeSelect,
}: ReservationCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date()),
  );

  // 予約メニューを取得
  const { reservationMenu, loading: menuLoading } =
    useReservationMenu(tenantId);

  // 月間空き状況を取得
  const { availabilityData, loading: availabilityLoading } =
    useMonthlyAvailability(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1, // 1-indexed month
      tenantId,
    );

  // 選択された日の時間スロットを取得
  const { availableSlots, loading: slotsLoading } = useTimeSlots(
    selectedDate,
    tenantId,
  );

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // 日付が変更されたら時間選択をリセット
    onDateTimeSelect(null);
  };

  const handleMonthChange = (activeStartDate: Date) => {
    setCurrentMonth(startOfMonth(activeStartDate));
    // 月が変更されたら選択をリセット
    setSelectedDate(null);
    onDateTimeSelect(null);
  };

  const handleTimeSelect = (datetime: string) => {
    onDateTimeSelect(datetime);
  };

  // selectedDateTimeからselectedDateを復元
  useEffect(() => {
    if (selectedDateTime && !selectedDate) {
      const date = new Date(selectedDateTime);
      setSelectedDate(date);
    }
  }, [selectedDateTime, selectedDate]);

  return (
    <div className="space-y-6">
      {/* メニュー情報表示 */}
      {reservationMenu && !menuLoading && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {reservationMenu.name}
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>所要時間: {reservationMenu.duration_minutes}分</p>
            <p>
              開始可能時間: 毎時
              {reservationMenu.start_minutes_options.map((min, index) => (
                <span key={min}>
                  {index > 0 && "、"}
                  {min.toString().padStart(2, "0")}分
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* カレンダー表示 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          予約日を選択
        </h2>
        <CalendarView
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          currentMonth={currentMonth}
          onActiveStartDateChange={handleMonthChange}
          availabilityData={availabilityData}
          loading={availabilityLoading}
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
