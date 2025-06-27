import { DayAvailability } from '../types'
import { format, isBefore, startOfDay } from 'date-fns'

interface CalendarTileProps {
  date: Date
  availabilityData: DayAvailability[]
  reservationCount?: number
}

export function CalendarTile({ date, availabilityData, reservationCount }: CalendarTileProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayAvailability = availabilityData.find(item => item.date === dateStr)
  const today = startOfDay(new Date())
  const isPastDate = isBefore(startOfDay(date), today)

  const getIndicator = () => {
    // 管理者モードの場合、予約数を表示
    if (typeof reservationCount === 'number') {
      if (reservationCount > 0) {
        return (
          <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {reservationCount}
          </div>
        )
      }
      return null
    }
    
    // 通常モードの場合、空き状況を表示
    if (isPastDate || !dayAvailability?.hasAvailability) {
      return <span className="text-red-500 font-bold">×</span>
    }
    return <span className="text-green-500 font-bold">⚪︎</span>
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-xs mb-1">
        {getIndicator()}
      </div>
    </div>
  )
}