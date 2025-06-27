import { DayAvailability } from '../types'
import { format, isBefore, startOfDay } from 'date-fns'

interface CalendarTileProps {
  date: Date
  availabilityData: DayAvailability[]
  reservationCount?: number
  availableSlots?: number
}

export function CalendarTile({ date, availabilityData, reservationCount, availableSlots }: CalendarTileProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayAvailability = availabilityData.find(item => item.date === dateStr)
  const today = startOfDay(new Date())
  const isPastDate = isBefore(startOfDay(date), today)

  const getIndicator = () => {
    // 管理者モードの場合も○×表示に統一
    if (typeof reservationCount === 'number') {
      // 空きスロットがある場合は○、ない場合は×
      if (typeof availableSlots === 'number' && availableSlots > 0) {
        return <span className="text-green-500 font-bold">⚪︎</span>
      } else {
        return <span className="text-red-500 font-bold">×</span>
      }
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