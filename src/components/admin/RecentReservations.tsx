import { DateTimeDisplay, MemberTypeBadge } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants/routes';
import { UI_TEXT } from '@/constants/ui';
import Link from 'next/link';
import React from 'react';

interface Reservation {
  id: string;
  name: string;
  member_type: string;
  datetime: string;
  is_created_by_user: boolean;
  users?: {
    user_id: string;
    name: string;
  } | null;
  staff_members?: {
    id: string;
    name: string;
  } | null;
}

interface RecentReservationsProps {
  reservations: Reservation[];
  maxDisplay?: number;
}

export const RecentReservations: React.FC<RecentReservationsProps> = ({
  reservations,
  maxDisplay = 5,
}) => {
  // APIで既にソート済みなので、そのまま使用
  const displayedReservations = reservations.slice(0, maxDisplay);
  const hasMoreReservations = reservations.length > maxDisplay;

  return (
    <div className="mt-8 bg-white rounded-xs border shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-md font-medium text-gray-900">
          {UI_TEXT.RECENT_RESERVATIONS}
        </h2>
      </div>
      <div className="px-6 py-4">
        {reservations.length === 0 ? (
          <p className="text-gray-500">{UI_TEXT.NO_RESERVATIONS}</p>
        ) : (
          <div className="space-y-2">
            {displayedReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-100 last:border-b-0 gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-sm truncate">
                      {reservation.users?.name ||
                        'ユーザー名が取得できませんでした'}
                    </span>
                    {reservation.is_created_by_user && (
                      <Badge variant="secondary" className="text-xs">
                        LINE予約
                      </Badge>
                    )}
                    <MemberTypeBadge memberType={reservation.member_type} />
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    担当: {reservation.staff_members?.name || '未指定'}
                  </div>
                </div>
                <div className="text-sm text-gray-500 flex-shrink-0">
                  <DateTimeDisplay
                    datetime={reservation.datetime}
                    format="short"
                  />
                </div>
              </div>
            ))}
            {hasMoreReservations && (
              <div className="pt-2">
                <Link
                  href={ROUTES.ADMIN.RESERVATIONS}
                  className="text-primary hover:text-primary-hover text-sm"
                >
                  {UI_TEXT.VIEW_ALL_RESERVATIONS}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
