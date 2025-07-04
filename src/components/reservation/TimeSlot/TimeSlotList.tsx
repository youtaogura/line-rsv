import type { ReservationMenuApiResponse } from '@/app/api/public/reservation-menu/route';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { TimeSlot } from '../types';
import { TimeSlotContainer } from './TimeSlotContainer';
import { TimeSlotItem } from './TimeSlotItem';

interface TimeSlotListProps {
  selectedDate: Date | null;
  availableSlots: TimeSlot[];
  selectedDateTime: string | null;
  onTimeSelect: (datetime: string) => void;
  reservationMenu: ReservationMenuApiResponse;
}

export function TimeSlotList({
  selectedDate,
  availableSlots,
  selectedDateTime,
  onTimeSelect,
  reservationMenu,
}: TimeSlotListProps) {
  useEffect(() => {
    console.log(availableSlots);
  }, [availableSlots]);

  if (!selectedDate) {
    return null;
  }

  const formatSelectedDate = (date: Date) => {
    return format(date, 'yyyy年M月d日');
  };

  const title = `${formatSelectedDate(selectedDate)}の予約可能時間`;

  if (availableSlots.length === 0) {
    return (
      <TimeSlotContainer title={title}>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">
            この日は予約可能な時間がありません
          </div>
        </div>
      </TimeSlotContainer>
    );
  }

  return (
    <TimeSlotContainer title={title}>
      {availableSlots.map((slot) => (
        <TimeSlotItem
          key={slot.datetime}
          datetime={slot.datetime}
          isSelected={selectedDateTime === slot.datetime}
          onClick={() => onTimeSelect(slot.datetime)}
          reservationMenu={reservationMenu}
        />
      ))}
    </TimeSlotContainer>
  );
}
