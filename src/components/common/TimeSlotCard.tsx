import { Reservation } from '@/lib/supabase';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MemberTypeBadge } from './MemberTypeBadge';

export interface ReservationWithUser extends Reservation {
  users?: {
    user_id: string;
    name: string;
  } | null;
}

export interface TimeSlotWithReservation {
  startTime: string;
  endTime?: string;
  datetime: string;
  reservation?: ReservationWithUser;
}

interface Props {
  slot: TimeSlotWithReservation;
  onDeleteReservation: () => void;
  onAddReservation: () => void;
  onReservationClick?: (reservation: ReservationWithUser) => void;
}

export function TimeSlotCard({
  slot,
  onDeleteReservation,
  onAddReservation,
  onReservationClick,
}: Props) {

  const displayTime = slot.endTime
    ? `${slot.startTime}-${slot.endTime}`
    : slot.startTime;

  const handleReservationClick = () => {
    if (slot.reservation && onReservationClick) {
      onReservationClick(slot.reservation);
    }
  };

  return (
    <div
      key={slot.datetime}
      className={`border rounded-xs px-3 py-2 relative ${
        slot.reservation ? 'border' : 'border-green-200 bg-green-50'
      }`}
    >
      <div onClick={handleReservationClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{displayTime}</span>
            <Badge
              className={`${
                slot.reservation
                  ? 'bg-transparent text-gray-700'
                  : 'bg-transparent text-green-800'
              }`}
            >
              {slot.reservation ? '予約有' : '空き'}
            </Badge>
          </div>

          {!slot.reservation && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAddReservation();
              }}
              variant="ghost"
              className="p-1 text-green-800 hover:bg-green-200 rounded transition-colors"
              title="予約を追加"
            >
              <Plus size={16} />
            </Button>
          )}
        </div>

        {slot.reservation && (
          <>
            {/* 2行目: 名前 */}
            <div className="my-2 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {slot.reservation!.users?.name ||
                  'ユーザー名が取得できませんでした'}
              </span>

              {slot.reservation!.is_created_by_user && (
                <Badge className="bg-green-50 text-green-800">LINE予約</Badge>
              )}
              {<MemberTypeBadge memberType={slot.reservation!.member_type} />}
            </div>
          </>
        )}

        {slot.reservation?.note && (
          <p className="text-sm text-gray-600 mt-2">
            備考: {slot.reservation!.note}
          </p>
        )}
      </div>

      {slot.reservation && (
        <div className="absolute bottom-2 right-3">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteReservation();
            }}
            variant="ghost"
            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-100 rounded transition-colors"
            title="予約を削除"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )}

    </div>
  );
}
