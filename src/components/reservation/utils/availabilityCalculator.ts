import { format, addMinutes, isSameDay, isBefore, isAfter } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import type { BusinessHour, Reservation, ReservationMenu } from '@/lib/supabase'

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
 * 指定した日の営業時間と予約メニューからタイムスロットを生成
 */
export function generateTimeSlots(date: Date, businessHours: BusinessHour[], reservationMenu?: ReservationMenu): TimeSlot[] {
  const dayOfWeek = date.getDay()
  
  // その日の営業時間を取得
  const dayBusinessHours = businessHours.filter(bh => bh.day_of_week === dayOfWeek)
  
  if (dayBusinessHours.length === 0) {
    return []
  }

  // 予約メニューがない場合は従来の30分間隔を使用
  const startMinutesOptions = reservationMenu?.start_minutes_options || [0, 30]
  const menuDuration = reservationMenu?.duration_minutes || 30

  const timeSlots: TimeSlot[] = []

  // 各営業時間枠でタイムスロットを生成
  dayBusinessHours.forEach(businessHour => {
    const [startHour, startMinute] = businessHour.start_time.split(':').map(Number)
    const [endHour, endMinute] = businessHour.end_time.split(':').map(Number)
    
    const businessStartTime = new Date(date)
    businessStartTime.setHours(startHour, startMinute, 0, 0)
    
    const businessEndTime = new Date(date)
    businessEndTime.setHours(endHour, endMinute, 0, 0)
    
    // 営業時間内の各時間帯について、許可された開始分をチェック
    let currentHour = startHour
    while (currentHour < endHour || (currentHour === endHour && 0 < endMinute)) {
      startMinutesOptions.forEach(startMinute => {
        const slotStartTime = new Date(date)
        slotStartTime.setHours(currentHour, startMinute, 0, 0)
        
        const slotEndTime = addMinutes(slotStartTime, menuDuration)
        
        // スロットが営業時間内に収まる場合のみ追加
        if (!isBefore(slotStartTime, businessStartTime) && !isAfter(slotEndTime, businessEndTime)) {
          const timeStr = format(slotStartTime, 'HH:mm')
          // 日本時間からUTCに変換してからISO文字列に変換
          const utcDateTime = fromZonedTime(slotStartTime, 'Asia/Tokyo')
          const datetimeStr = utcDateTime.toISOString()
          
          timeSlots.push({
            time: timeStr,
            datetime: datetimeStr,
            isAvailable: true // 初期値、後で予約状況を反映
          })
        }
      })
      currentHour++
    }
  })

  return timeSlots.sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * 予約情報を考慮してタイムスロットの空き状況を更新（duration_minutes対応）
 */
export function updateSlotsWithReservations(timeSlots: TimeSlot[], reservations: Reservation[], reservationMenu?: ReservationMenu): TimeSlot[] {
  const menuDuration = reservationMenu?.duration_minutes || 30

  return timeSlots.map(slot => {
    const slotStartTime = new Date(slot.datetime)
    const slotEndTime = addMinutes(slotStartTime, menuDuration)
    
    const isReserved = reservations.some(reservation => {
      const reservationStartTime = new Date(reservation.datetime)
      const reservationDuration = reservation.duration_minutes || 30
      const reservationEndTime = addMinutes(reservationStartTime, reservationDuration)
      
      const overlaps = slotStartTime < reservationEndTime && slotEndTime > reservationStartTime
      
      // 時間重複をチェック（より厳密な重複判定）
      // 2つの時間帯が重複する条件: スロット開始 < 予約終了 AND スロット終了 > 予約開始
      return overlaps
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
  reservations: Reservation[],
  reservationMenu?: ReservationMenu
): DayAvailabilityInfo {
  const dateStr = format(date, 'yyyy-MM-dd')
  
  // その日の予約を抽出
  const dayReservations = reservations.filter(reservation => 
    isSameDay(new Date(reservation.datetime), date)
  )
  
  // タイムスロットを生成
  let timeSlots = generateTimeSlots(date, businessHours, reservationMenu)
  
  // 予約状況を反映
  timeSlots = updateSlotsWithReservations(timeSlots, dayReservations, reservationMenu)
  
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
  reservations: Reservation[],
  reservationMenu?: ReservationMenu
): Map<string, DayAvailabilityInfo> {
  const availabilityMap = new Map<string, DayAvailabilityInfo>()
  
  let currentDate = new Date(startDate)
  
  while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
    const dayInfo = calculateDayAvailability(currentDate, businessHours, reservations, reservationMenu)
    availabilityMap.set(dayInfo.date, dayInfo)
    
    currentDate = new Date(currentDate)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return availabilityMap
}