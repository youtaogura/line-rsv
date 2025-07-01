import { DateTimeDisplay, MemberTypeBadge } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import React, { useState } from 'react';

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
  onAdminNoteUpdate?: (
    reservationId: string,
    adminNote: string
  ) => Promise<void>;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  actions,
  onAdminNoteUpdate,
}) => {
  const [adminNote, setAdminNote] = useState(reservation.admin_note || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // reservation.admin_noteが変更されたらローカルstateを更新
  React.useEffect(() => {
    setAdminNote(reservation.admin_note || '');
  }, [reservation.admin_note]);

  const handleAdminNoteUpdate = async () => {
    if (!onAdminNoteUpdate) return;

    setIsUpdating(true);
    try {
      await onAdminNoteUpdate(reservation.id, adminNote);
      setIsEditing(false);
    } catch (error) {
      alert('管理者メモの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setAdminNote(reservation.admin_note || '');
    setIsEditing(false);
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="py-0 cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 gap-2">
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
              <div className="text-xs text-gray-600 mt-1">
                担当: {reservation.staff_members?.name || '未指定'}
              </div>
              {reservation.note && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  備考: {reservation.note}
                </div>
              )}
              {reservation.admin_note && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  管理者メモ: {reservation.admin_note}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500 flex-shrink-0">
              <DateTimeDisplay datetime={reservation.datetime} format="short" />
            </div>
            {actions ?? <></>}
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>予約詳細</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="font-medium">
              {reservation.users?.name || 'ユーザー名が取得できませんでした'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {reservation.is_created_by_user && (
                <Badge variant="secondary" className="text-xs">
                  LINE予約
                </Badge>
              )}
              <MemberTypeBadge memberType={reservation.member_type} />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">
              日時:{' '}
              <DateTimeDisplay datetime={reservation.datetime} format="full" />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              担当: {reservation.staff_members?.name || '未指定'}
            </div>
          </div>
          {reservation.note && (
            <div>
              <div className="text-sm font-medium text-gray-700">
                お客様メモ
              </div>
              <div className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                {reservation.note}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                管理者メモ
              </div>
              {onAdminNoteUpdate && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  編集
                </Button>
              )}
            </div>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={adminNote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setAdminNote(e.target.value)
                  }
                  placeholder="管理者メモを入力..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAdminNoteUpdate}
                    disabled={isUpdating}
                  >
                    {isUpdating ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 mt-1 p-2 bg-blue-50 rounded min-h-[2.5rem] flex items-center">
                {reservation.admin_note || '管理者メモはありません'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
