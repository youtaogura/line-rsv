import { DateTimeDisplay, MemberTypeBadge } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import React from 'react';

interface ReservationCardProps {
  reservation: {
    id: string;
    name: string;
    member_type: string;
    datetime: string;
    is_created_by_user: boolean;
    note?: string;
    admin_note?: string;
    created_at?: string;
    users?: {
      user_id: string;
      name: string;
    } | null;
    staff_members?: {
      id: string;
      name: string;
    } | null;
  };
  variant?: 'compact' | 'detailed';
  actions?: React.ReactNode;
  onReservationClick?: (reservation: any) => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  actions,
  onReservationClick,
}) => {
  return (
    <>
      <Card
        className="py-0 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onReservationClick?.(reservation)}
      >
        <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-2 relative">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col items-start gap-2 flex-wrap md:flex-row md:items-center">
              <div className="text-md font-semibold flex-shrink-0">
                <DateTimeDisplay
                  datetime={reservation.datetime}
                  format="short"
                />
              </div>
              <div className="flex gap-2">
                <span className="font-sm truncate">
                  {reservation.users?.name ||
                    'ユーザー名が取得できませんでした'}
                </span>
                {reservation.is_created_by_user && (
                  <Badge className="bg-green-50 text-green-800">LINE予約</Badge>
                )}
                <MemberTypeBadge memberType={reservation.member_type} />
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              担当: {reservation.staff_members?.name || '-'}
            </div>
            {reservation.note && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                備考: {reservation.note}
              </div>
            )}
            {reservation.admin_note && (
              <div className="text-xs text-gray-500 mt-1 truncate pr-8">
                管理者メモ: {reservation.admin_note}
              </div>
            )}
          </div>
          <div className="absolute right-2 bottom-2">{actions ?? <></>}</div>
        </CardContent>
      </Card>

    </>
  );
};
