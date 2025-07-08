import { DateTimeDisplay, MemberTypeBadge } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ReservationWithStaff } from '@/lib/types/reservation';
import { DialogDescription } from '@radix-ui/react-dialog';
import React, { useMemo, useState } from 'react';

// ローカル型定義
interface TimeSlot {
  time: string;
  datetime: string;
  isAvailable: boolean;
}

interface StaffTimeSlots {
  id: string;
  timeSlots: TimeSlot[];
}

interface MonthlyAvailability {
  tenant: {
    timeSlots: TimeSlot[];
  };
  staffMembers: StaffTimeSlots[];
}

interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationWithStaff;
  monthlyAvailability?: MonthlyAvailability | null;
  staffMembers?: Array<{
    id: string;
    name: string;
  }>;
  onAdminNoteUpdate?: (
    reservationId: string,
    adminNote: string
  ) => Promise<void>;
  onStaffAssignment?: (reservationId: string, staffId: string) => Promise<void>;
}

export const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  isOpen,
  onClose,
  reservation,
  monthlyAvailability,
  staffMembers = [],
  onAdminNoteUpdate,
  onStaffAssignment,
}) => {
  const [adminNote, setAdminNote] = useState(reservation.admin_note || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isAssigningStaff, setIsAssigningStaff] = useState(false);

  // reservation.admin_noteが変更されたらローカルstateを更新
  React.useEffect(() => {
    setAdminNote(reservation.admin_note || '');
  }, [reservation.admin_note]);

  // 予約日時に空きがあるスタッフを取得
  const availableStaffs = useMemo(() => {
    if (!monthlyAvailability || !staffMembers.length) return [];

    return staffMembers.filter((staff) => {
      const staffTimeSlots =
        monthlyAvailability.staffMembers.find((s) => s.id === staff.id)
          ?.timeSlots || [];

      return staffTimeSlots.some(
        (slot) =>
          new Date(slot.datetime).getTime() ===
            new Date(reservation.datetime).getTime() && slot.isAvailable
      );
    });
  }, [monthlyAvailability, staffMembers, reservation.datetime]);

  const handleAdminNoteUpdate = async () => {
    if (!onAdminNoteUpdate) return;

    setIsUpdating(true);
    try {
      await onAdminNoteUpdate(reservation.id, adminNote);
      setIsEditing(false);
    } catch (_error) {
      alert('管理者メモの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setAdminNote(reservation.admin_note || '');
    setIsEditing(false);
  };

  const handleStaffAssignment = async () => {
    if (!onStaffAssignment || !selectedStaffId) return;

    setIsAssigningStaff(true);
    try {
      await onStaffAssignment(reservation.id, selectedStaffId);
      setSelectedStaffId('');
    } catch (_error) {
      alert('担当スタッフの割り当てに失敗しました');
    } finally {
      setIsAssigningStaff(false);
    }
  };

  // 担当スタッフがいない場合にスタッフ割り当てを可能にする
  const canAssignStaff =
    !reservation.staff_members && availableStaffs.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>予約詳細</DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>
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
              <DateTimeDisplay datetime={reservation.datetime} format="short" />
            </div>
            {!canAssignStaff && (
              <div className="text-sm text-gray-600 mt-1">
                担当: {reservation.staff_members?.name || '-'}
              </div>
            )}
            {canAssignStaff && onStaffAssignment && (
              <div className="mt-2">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  担当スタッフを割り当て
                </div>
                <div className="flex gap-2">
                  <Select
                    value={selectedStaffId}
                    onValueChange={setSelectedStaffId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="スタッフを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStaffs.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleStaffAssignment}
                    disabled={!selectedStaffId || isAssigningStaff}
                  >
                    {isAssigningStaff ? '更新中...' : '更新'}
                  </Button>
                </div>
              </div>
            )}
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
                <Button size="sm" onClick={() => setIsEditing(true)}>
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
