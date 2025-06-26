import { format as formatTz } from 'date-fns-tz'

interface TimeSlotItemProps {
  datetime: string
  isSelected: boolean
  onClick: () => void
}

export function TimeSlotItem({ datetime, isSelected, onClick }: TimeSlotItemProps) {
  const formatDateTime = (datetime: string) => {
    return formatTz(
      new Date(datetime),
      'HH:mm',
      { timeZone: 'Asia/Tokyo' }
    )
  }

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-4 py-3 text-left rounded-md border transition-colors
        ${isSelected 
          ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
        }
      `}
    >
      {formatDateTime(datetime)}
    </button>
  )
}