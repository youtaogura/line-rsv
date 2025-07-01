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
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  variant = 'compact',
  actions,
}) => {
  if (variant === 'compact') {
    return (
      <Card className="py-0">
        <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sm truncate">
                {reservation.users?.name || 'ユーザー名が取得できませんでした'}
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
            <DateTimeDisplay datetime={reservation.datetime} format="short" />
          </div>
          {actions ?? <></>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">
                {reservation.users?.name || 'ユーザー名が取得できませんでした'}
              </h3>
              {reservation.is_created_by_user && (
                <Badge variant="secondary" className="text-xs">
                  LINE予約
                </Badge>
              )}
            </div>
            <div className="mt-1">
              <MemberTypeBadge memberType={reservation.member_type} />
            </div>
          </div>
          {actions}
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              予約日時
            </span>
            <DateTimeDisplay datetime={reservation.datetime} format="full" />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">
              担当スタッフ
            </span>
            <span className="text-sm">
              {reservation.staff_members?.name || '未指定'}
            </span>
          </div>

          {reservation.note && (
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">
                備考
              </span>
              <span className="text-sm text-right flex-1 ml-4">
                {reservation.note}
              </span>
            </div>
          )}

          {reservation.created_at && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                予約作成日時
              </span>
              <DateTimeDisplay
                datetime={reservation.created_at}
                format="short"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
