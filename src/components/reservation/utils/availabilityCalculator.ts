import { format, addMinutes, isSameDay, isBefore } from 'date-fns'
import type { BusinessHour, Reservation } from '@/lib/supabase'

export interface TimeSlot {
  time: string
  datetime: string
  isAvailable: boolean
}

export interface DayAvailabilityInfo {
  date: string
  totalSlots: number
  availableSlots: number
  reservedSlots: number
  timeSlots: TimeSlot[]
}

/**
 * 指定した日の営業時間から30分間隔のタイムスロットを生成
 */
export function generateTimeSlots(date: Date, businessHours: BusinessHour[]): TimeSlot[] {
  const dayOfWeek = date.getDay()
  
  // その日の営業時間を取得
  const dayBusinessHours = businessHours.filter(bh => bh.day_of_week === dayOfWeek)
  
  if (dayBusinessHours.length === 0) {
    return []
  }

  const timeSlots: TimeSlot[] = []

  // 各営業時間枠でタイムスロットを生成
  dayBusinessHours.forEach(businessHour => {
    const [startHour, startMinute] = businessHour.start_time.split(':').map(Number)
    const [endHour, endMinute] = businessHour.end_time.split(':').map(Number)
    
    const startTime = new Date(date)
    startTime.setHours(startHour, startMinute, 0, 0)
    
    const endTime = new Date(date)
    endTime.setHours(endHour, endMinute, 0, 0)
    
    let currentTime = startTime
    
    while (isBefore(currentTime, endTime)) {
      const timeStr = format(currentTime, 'HH:mm')
      const datetimeStr = format(currentTime, "yyyy-MM-dd'T'HH:mm:ss")
      
      timeSlots.push({
        time: timeStr,
        datetime: datetimeStr,
        isAvailable: true // 初期値、後で予約状況を反映
      })
      
      currentTime = addMinutes(currentTime, 30)
    }
  })

  return timeSlots.sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * 予約情報を考慮してタイムスロットの空き状況を更新
 */
export function updateSlotsWithReservations(timeSlots: TimeSlot[], reservations: Reservation[]): TimeSlot[] {
  return timeSlots.map(slot => {
    const isReserved = reservations.some(reservation => {
      const reservationTime = format(new Date(reservation.datetime), 'HH:mm')
      return reservationTime === slot.time
    })
    
    return {
      ...slot,
      isAvailable: !isReserved
    }
  })
}

/**
 * 指定した日の空き状況情報を計算
 */
export function calculateDayAvailability(
  date: Date, 
  businessHours: BusinessHour[], 
  reservations: Reservation[]
): DayAvailabilityInfo {
  const dateStr = format(date, 'yyyy-MM-dd')
  
  // その日の予約を抽出
  const dayReservations = reservations.filter(reservation => 
    isSameDay(new Date(reservation.datetime), date)
  )
  
  // タイムスロットを生成
  let timeSlots = generateTimeSlots(date, businessHours)
  
  // 予約状況を反映
  timeSlots = updateSlotsWithReservations(timeSlots, dayReservations)
  
  const totalSlots = timeSlots.length
  const availableSlots = timeSlots.filter(slot => slot.isAvailable).length
  const reservedSlots = totalSlots - availableSlots
  
  return {
    date: dateStr,
    totalSlots,
    availableSlots,
    reservedSlots,
    timeSlots
  }
}

/**
 * 月間の空き状況マップを計算
 */
export function calculateMonthlyAvailability(
  startDate: Date,
  endDate: Date,
  businessHours: BusinessHour[],
  reservations: Reservation[]
): Map<string, DayAvailabilityInfo> {
  const availabilityMap = new Map<string, DayAvailabilityInfo>()
  
  let currentDate = new Date(startDate)
  
  while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
    const dayInfo = calculateDayAvailability(currentDate, businessHours, reservations)
    availabilityMap.set(dayInfo.date, dayInfo)
    
    currentDate = new Date(currentDate)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return availabilityMap
}