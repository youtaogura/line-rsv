import type { ReservationMenu } from '@/lib/supabase';
import { addMinutes } from 'date-fns';
import { format as formatTz } from 'date-fns-tz';

interface TimeSlotItemProps {
  datetime: string;
  isSelected: boolean;
  onClick: () => void;
  reservationMenu?: ReservationMenu | null;
}

export function TimeSlotItem({
  datetime,
  isSelected,
  onClick,
  reservationMenu,
}: TimeSlotItemProps) {
  const formatTimeRange = (datetime: string) => {
    const startTime = new Date(datetime);
    const duration = reservationMenu?.duration_minutes || 30;
    const endTime = addMinutes(startTime, duration);

    const startStr = formatTz(startTime, 'HH:mm', { timeZone: 'Asia/Tokyo' });
    const endStr = formatTz(endTime, 'HH:mm', { timeZone: 'Asia/Tokyo' });

    return `${startStr} - ${endStr}`;
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-4 py-3 text-left rounded-xs border transition-colors
        ${
          isSelected
            ? 'bg-blue-100 text-gray-700 border-blue-500 shadow-md'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
        }
      `}
    >
      <div className="flex flex-col">
        <span className="font-medium">{formatTimeRange(datetime)}</span>
        {reservationMenu && (
          <span className="text-xs opacity-75 mt-1">
            {reservationMenu.duration_minutes}分
          </span>
        )}
      </div>
    </button>
  );
}
