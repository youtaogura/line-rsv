'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CalendarView } from './Calendar/CalendarView'
import { useMonthlyAvailability } from './hooks/useMonthlyAvailability'
import { useBusinessHours } from './hooks/useBusinessHours'
import { useReservationMenu } from './hooks/useReservationMenu'
import { startOfMonth, endOfMonth, format, addMinutes } from 'date-fns'
import { calculateMonthlyAvailability, type DayAvailabilityInfo, type TimeSlot } from './utils/availabilityCalculator'
import type { Reservation } from '@/lib/supabase'

interface AdminReservationCalendarProps {
  tenantId: string | null
  reservations: Reservation[]
  onDeleteReservation: (id: string) => void
  onCreateReservation?: (datetime: string) => void
}

interface DayReservations {
  [date: string]: Reservation[]
}

interface ConsolidatedSlot {
  startTime: string // "14:00"
  endTime?: string // "15:00" (予約ありの場合のみ)
  isAvailable: boolean
  isConflicted: boolean // 予約不可（重複のため）
  reservation?: Reservation
  datetime: string
}

// タイムスロットを統合する関数
function consolidateTimeSlots(
  timeSlots: TimeSlot[], 
  reservations: Reservation[]
): ConsolidatedSlot[] {
  const consolidatedSlots: ConsolidatedSlot[] = []
  const processedSlots = new Set<string>()

  timeSlots.forEach(slot => {
    if (processedSlots.has(slot.time)) return
    
    // このスロットに対応する予約を探す
    const reservation = reservations.find(r => 
      format(new Date(r.datetime), 'HH:mm') === slot.time
    )

    if (reservation) {
      // 予約ありスロット：実際の予約時間で統合
      const reservationStart = new Date(reservation.datetime)
      const reservationDuration = reservation.duration_minutes || 30
      const reservationEnd = addMinutes(reservationStart, reservationDuration)
      
      const startTime = format(reservationStart, 'HH:mm')
      const endTime = format(reservationEnd, 'HH:mm')
      
      consolidatedSlots.push({
        startTime,
        endTime,
        isAvailable: false,
        isConflicted: false,
        reservation,
        datetime: slot.datetime
      })

      // この予約によってカバーされるスロットをマーク
      timeSlots.forEach(s => {
        const sTime = new Date(s.datetime)
        if (sTime >= reservationStart && sTime < reservationEnd) {
          processedSlots.add(s.time)
        }
      })
    } else if (!slot.isAvailable) {
      // 予約不可スロット（重複により）
      consolidatedSlots.push({
        startTime: slot.time,
        isAvailable: false,
        isConflicted: true,
        datetime: slot.datetime
      })
      processedSlots.add(slot.time)
    } else {
      // 空きスロット
      consolidatedSlots.push({
        startTime: slot.time,
        isAvailable: true,
        isConflicted: false,
        datetime: slot.datetime
      })
      processedSlots.add(slot.time)
    }
  })

  return consolidatedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function AdminReservationCalendar({
  tenantId,
  reservations,
  onDeleteReservation,
  onCreateReservation
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

  // 営業時間を取得
  const { businessHours } = useBusinessHours(tenantId)
  
  // 予約メニューを取得
  const { reservationMenu } = useReservationMenu(tenantId)

  // 月間の空きスロット計算
  const monthlyAvailabilityInfo = useMemo(() => {
    if (!businessHours.length) return new Map<string, DayAvailabilityInfo>()
    
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    
    return calculateMonthlyAvailability(monthStart, monthEnd, businessHours, reservations, reservationMenu || undefined)
  }, [currentMonth, businessHours, reservations, reservationMenu])

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
  const selectedDayAvailability = selectedDateString ? monthlyAvailabilityInfo.get(selectedDateString) : null

  // 統合されたタイムスロットを計算
  const consolidatedSlots = useMemo(() => {
    if (!selectedDayAvailability?.timeSlots) return []
    const currentDayReservations = selectedDateString ? dayReservations[selectedDateString] || [] : []
    return consolidateTimeSlots(selectedDayAvailability.timeSlots, currentDayReservations)
  }, [selectedDayAvailability, selectedDateString, dayReservations])

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
              availabilityInfo={monthlyAvailabilityInfo}
            />
          </div>

          {/* 選択日の予約詳細 */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              {selectedDate ? format(selectedDate, 'M月d日の予約') : '日付を選択してください'}
            </h4>
            
            {selectedDate ? (
              <div className="space-y-4">
                {/* 空き状況サマリー */}
                {selectedDayAvailability && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">空き状況</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {selectedDayAvailability.availableSlots}
                        </div>
                        <div className="text-blue-800">空き</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {selectedDayAvailability.reservedSlots}
                        </div>
                        <div className="text-red-800">予約済み</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">
                          {selectedDayAvailability.totalSlots}
                        </div>
                        <div className="text-gray-800">合計</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* タイムスロット一覧 */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">タイムスロット一覧</h5>
                  {consolidatedSlots.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {consolidatedSlots.map((slot, index) => {
                        const displayTime = slot.endTime ? `${slot.startTime}-${slot.endTime}` : slot.startTime
                        const isReserved = slot.reservation
                        const isConflicted = slot.isConflicted
                        
                        return (
                          <div
                            key={`${slot.startTime}-${index}`}
                            className={`border rounded-lg p-3 ${
                              slot.isAvailable 
                                ? 'border-green-200 bg-green-50' 
                                : isConflicted
                                ? 'border-orange-200 bg-orange-50'
                                : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">{displayTime}</span>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    slot.isAvailable 
                                      ? 'bg-green-100 text-green-800' 
                                      : isConflicted
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {slot.isAvailable ? '空き' : isConflicted ? '予約不可' : '予約済み'}
                                  </span>
                                  
                                  {isReserved && (
                                    <>
                                      <span className="text-sm font-medium text-gray-700">
                                        {slot.reservation!.name}
                                      </span>
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        slot.reservation!.member_type === 'regular' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {slot.reservation!.member_type === 'regular' ? '会員' : 'ゲスト'}
                                      </span>
                                    </>
                                  )}
                                </div>
                                
                                {isReserved && slot.reservation!.note && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    備考: {slot.reservation!.note}
                                  </p>
                                )}
                              </div>
                              
                              {slot.isAvailable ? (
                                onCreateReservation && (
                                  <button
                                    onClick={() => onCreateReservation(slot.datetime)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 ml-2"
                                  >
                                    予約追加
                                  </button>
                                )
                              ) : isReserved ? (
                                <button
                                  onClick={() => onDeleteReservation(slot.reservation!.id)}
                                  className="text-red-600 hover:text-red-900 text-sm ml-2"
                                >
                                  削除
                                </button>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">この日は営業時間外です</p>
                  )}
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