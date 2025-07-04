import { ReservationCard } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { UI_TEXT } from '@/constants/ui';
import Link from 'next/link';
import React from 'react';
import { ReservationWithStaff } from './ReservationList';

interface RecentReservationsProps {
  reservations: ReservationWithStaff[];
  maxDisplay?: number;
  onReservationClick: (reservation: ReservationWithStaff) => void;
}

export const RecentReservations: React.FC<RecentReservationsProps> = ({
  reservations,
  maxDisplay = 5,
  onReservationClick,
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
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                variant="compact"
                onReservationClick={onReservationClick}
              />
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
