import { useState, useEffect } from 'react'
import { CalendarView } from './Calendar/CalendarView'
import { TimeSlotList } from './TimeSlot/TimeSlotList'
import { useMonthlyAvailability } from './hooks/useMonthlyAvailability'
import { useTimeSlots } from './hooks/useTimeSlots'
import { startOfMonth } from 'date-fns'

interface ReservationCalendarProps {
  tenantId: string | null
  selectedDateTime: string | null
  onDateTimeSelect: (datetime: string | null) => void
}

export function ReservationCalendar({
  tenantId,
  selectedDateTime,
  onDateTimeSelect
}: ReservationCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()))

  // 月間空き状況を取得
  const { availabilityData, loading: availabilityLoading } = useMonthlyAvailability(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1, // 1-indexed month
    tenantId
  )

  // 選択された日の時間スロットを取得
  const { availableSlots, loading: slotsLoading } = useTimeSlots(
    selectedDate,
    tenantId
  )

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    // 日付が変更されたら時間選択をリセット
    onDateTimeSelect(null)
  }

  const handleMonthChange = (activeStartDate: Date) => {
    setCurrentMonth(startOfMonth(activeStartDate))
    // 月が変更されたら選択をリセット
    setSelectedDate(null)
    onDateTimeSelect(null)
  }

  const handleTimeSelect = (datetime: string) => {
    onDateTimeSelect(datetime)
  }

  // selectedDateTimeからselectedDateを復元
  useEffect(() => {
    if (selectedDateTime && !selectedDate) {
      const date = new Date(selectedDateTime)
      setSelectedDate(date)
    }
  }, [selectedDateTime, selectedDate])

  return (
    <div className="space-y-6">
      {/* カレンダー表示 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">予約日を選択</h2>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <TimeSlotList
            selectedDate={selectedDate}
            availableSlots={availableSlots}
            selectedDateTime={selectedDateTime}
            onTimeSelect={handleTimeSelect}
            loading={slotsLoading}
          />
        </div>
      )}
    </div>
  )
}