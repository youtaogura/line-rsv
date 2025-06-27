'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarView } from './Calendar/CalendarView'
import { useMonthlyAvailability } from './hooks/useMonthlyAvailability'
import { startOfMonth, format } from 'date-fns'
import type { Reservation } from '@/lib/supabase'

interface AdminReservationCalendarProps {
  tenantId: string | null
  reservations: Reservation[]
  onDeleteReservation: (id: string) => void
}

interface DayReservations {
  [date: string]: Reservation[]
}

export function AdminReservationCalendar({
  tenantId,
  reservations,
  onDeleteReservation
}: AdminReservationCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()))
  const [dayReservations, setDayReservations] = useState<DayReservations>({})

  // 月間空き状況を取得
  const { availabilityData, loading: availabilityLoading } = useMonthlyAvailability(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    tenantId
  )

  // 予約データを日付ごとにグループ化
  useEffect(() => {
    const grouped: DayReservations = {}
    reservations.forEach(reservation => {
      const date = format(new Date(reservation.datetime), 'yyyy-MM-dd')
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(reservation)
    })
    setDayReservations(grouped)
  }, [reservations])

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const handleMonthChange = useCallback((activeStartDate: Date) => {
    setCurrentMonth(startOfMonth(activeStartDate))
    setSelectedDate(null)
  }, [])


  const selectedDateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
  const selectedDayReservations = selectedDateString ? dayReservations[selectedDateString] || [] : []

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">予約カレンダー</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* カレンダー部分 */}
          <div>
            <CalendarView
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              currentMonth={currentMonth}
              onActiveStartDateChange={handleMonthChange}
              availabilityData={availabilityData}
              loading={availabilityLoading}
              reservationCount={dayReservations}
            />
          </div>

          {/* 選択日の予約詳細 */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              {selectedDate ? format(selectedDate, 'M月d日の予約') : '日付を選択してください'}
            </h4>
            
            {selectedDate ? (
              <div className="space-y-3">
                {selectedDayReservations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">この日の予約はありません</p>
                ) : (
                  selectedDayReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-medium text-gray-900">{reservation.name}</h5>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              reservation.member_type === 'regular' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {reservation.member_type === 'regular' ? '会員' : 'ゲスト'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            時間: {format(new Date(reservation.datetime), 'HH:mm')}
                          </p>
                          {reservation.note && (
                            <p className="text-sm text-gray-600">
                              備考: {reservation.note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteReservation(reservation.id)}
                          className="text-red-600 hover:text-red-900 text-sm ml-2"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                カレンダーから日付を選択すると、その日の予約詳細が表示されます
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 月間統計 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {format(currentMonth, 'yyyy年M月')}の統計
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {reservations.filter(r => {
                const reservationDate = new Date(r.datetime)
                return reservationDate.getFullYear() === currentMonth.getFullYear() &&
                       reservationDate.getMonth() === currentMonth.getMonth()
              }).length}
            </div>
            <div className="text-sm text-gray-500">総予約数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {reservations.filter(r => {
                const reservationDate = new Date(r.datetime)
                return reservationDate.getFullYear() === currentMonth.getFullYear() &&
                       reservationDate.getMonth() === currentMonth.getMonth() &&
                       r.member_type === 'regular'
              }).length}
            </div>
            <div className="text-sm text-gray-500">会員予約</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {reservations.filter(r => {
                const reservationDate = new Date(r.datetime)
                return reservationDate.getFullYear() === currentMonth.getFullYear() &&
                       reservationDate.getMonth() === currentMonth.getMonth() &&
                       r.member_type === 'guest'
              }).length}
            </div>
            <div className="text-sm text-gray-500">ゲスト予約</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {Object.keys(dayReservations).filter(date => {
                const d = new Date(date)
                return d.getFullYear() === currentMonth.getFullYear() &&
                       d.getMonth() === currentMonth.getMonth()
              }).length}
            </div>
            <div className="text-sm text-gray-500">予約日数</div>
          </div>
        </div>
      </div>
    </div>
  )
}