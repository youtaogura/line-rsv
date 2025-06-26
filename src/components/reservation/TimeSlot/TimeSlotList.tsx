import { TimeSlotItem } from './TimeSlotItem'
import { TimeSlotContainer } from './TimeSlotContainer'
import { TimeSlot } from '../types'
import { format } from 'date-fns'

interface TimeSlotListProps {
  selectedDate: Date | null
  availableSlots: TimeSlot[]
  selectedDateTime: string | null
  onTimeSelect: (datetime: string) => void
  loading: boolean
}

export function TimeSlotList({
  selectedDate,
  availableSlots,
  selectedDateTime,
  onTimeSelect,
  loading
}: TimeSlotListProps) {
  if (!selectedDate) {
    return null
  }

  const formatSelectedDate = (date: Date) => {
    return format(date, 'yyyy年M月d日')
  }

  const title = `${formatSelectedDate(selectedDate)}の予約可能時間`

  if (loading) {
    return (
      <TimeSlotContainer title={title}>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">時間を読み込み中...</div>
        </div>
      </TimeSlotContainer>
    )
  }

  if (availableSlots.length === 0) {
    return (
      <TimeSlotContainer title={title}>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">この日は予約可能な時間がありません</div>
        </div>
      </TimeSlotContainer>
    )
  }

  return (
    <TimeSlotContainer title={title}>
      {availableSlots.map((slot) => (
        <TimeSlotItem
          key={slot.datetime}
          datetime={slot.datetime}
          isSelected={selectedDateTime === slot.datetime}
          onClick={() => onTimeSelect(slot.datetime)}
        />
      ))}
    </TimeSlotContainer>
  )
}