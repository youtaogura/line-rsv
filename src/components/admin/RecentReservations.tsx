import Link from 'next/link';
import React from 'react';
import { UI_TEXT } from '@/constants/ui';
import { ROUTES } from '@/constants/routes';
import { MEMBER_TYPES } from '@/constants/business';

interface Reservation {
  id: string;
  name: string;
  member_type: string;
  datetime: string;
}

interface RecentReservationsProps {
  reservations: Reservation[];
  maxDisplay?: number;
}

export const RecentReservations: React.FC<RecentReservationsProps> = ({
  reservations,
  maxDisplay = 5,
}) => {
  const displayedReservations = reservations.slice(0, maxDisplay);
  const hasMoreReservations = reservations.length > maxDisplay;

  const formatMemberType = (memberType: string) => {
    return memberType === MEMBER_TYPES.REGULAR ? UI_TEXT.MEMBER : UI_TEXT.GUEST;
  };

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
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
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <span className="font-medium">{reservation.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({formatMemberType(reservation.member_type)})
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDateTime(reservation.datetime)}
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