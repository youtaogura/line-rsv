import { DateTimeDisplay, MemberTypeBadge } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { ReservationWithStaff } from '@/lib/types/reservation';
import { CircleAlert } from 'lucide-react';
import React from 'react';

interface UnassignedReservationsProps {
  reservations: ReservationWithStaff[];
  onReservationClick: (reservation: ReservationWithStaff) => void;
}

export const UnassignedReservations: React.FC<UnassignedReservationsProps> = ({
  reservations,
  onReservationClick,
}) => {
  return (
    <div className="mb-8 bg-white border border-amber-200 rounded-xs shadow">
      <div className="px-6 py-4 border-b border-amber-200 bg-amber-50">
        <div className="flex items-center space-x-2">
          <CircleAlert className="w-5 h-5 text-amber-600" />
          <h2 className="text-md font-medium text-amber-800">
            担当未設定の予約
          </h2>
          {reservations.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-amber-800 bg-amber-200 rounded-full">
              {reservations.length}件
            </span>
          )}
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="space-y-2">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-4 bg-white border rounded-xs gap-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onReservationClick?.(reservation)}
            >
              <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="text-md text-gray-900 font-semibold">
                  <DateTimeDisplay
                    datetime={reservation.datetime}
                    format="short"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-sm text-gray-900 truncate">
                    {reservation.users?.name ||
                      'ユーザー名が取得できませんでした'}
                  </span>
                  {reservation.is_created_by_user && (
                    <Badge className="bg-green-50 text-green-800">
                      LINE予約
                    </Badge>
                  )}
                  <MemberTypeBadge memberType={reservation.member_type} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
