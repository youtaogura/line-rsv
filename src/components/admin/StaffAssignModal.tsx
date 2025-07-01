import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ReservationSimple, StaffMemberSimple } from '@/lib/supabase';
import React, { useState } from 'react';

interface StaffAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationSimple | null;
  staffMembers: StaffMemberSimple[];
  onAssignStaff: (reservationId: string, staffId: string) => Promise<void>;
  onRemoveStaff: (reservationId: string) => Promise<void>;
}

export const StaffAssignModal: React.FC<StaffAssignModalProps> = ({
  isOpen,
  onClose,
  reservation,
  staffMembers,
  onAssignStaff,
  onRemoveStaff,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation || !selectedStaffId) return;

    setIsLoading(true);
    try {
      await onAssignStaff(reservation.id, selectedStaffId);
      alert('担当スタッフを設定しました');
      onClose();
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('スタッフの設定に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStaffClick = async () => {
    if (!reservation) return;

    setIsLoading(true);
    try {
      await onRemoveStaff(reservation.id);
      alert('担当スタッフを解除しました');
      onClose();
    } catch (error) {
      console.error('Error removing staff:', error);
      alert('スタッフの解除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>担当スタッフの設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">予約情報</h3>
            <div className="bg-gray-50 p-3 rounded-xs">
              <p className="text-sm flex items-center gap-2">
                <span className="font-medium">お客様:</span>{' '}
                {reservation.users?.name || '名前不明'}
                {reservation.is_created_by_user && (
                  <Badge className="bg-green-50 text-green-800">LINE予約</Badge>
                )}
              </p>
              <p className="text-sm">
                <span className="font-medium">日時:</span>{' '}
                {new Date(reservation.datetime).toLocaleString('ja-JP')}
              </p>
              <p className="text-sm">
                <span className="font-medium">現在の担当:</span>{' '}
                {reservation.staff_members?.name || '未指定'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="staff-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                担当スタッフを選択
              </label>
              <select
                id="staff-select"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">スタッフを選択してください</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between space-x-3 pt-4">
              {reservation.staff_members && (
                <button
                  type="button"
                  onClick={handleRemoveStaffClick}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xs hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  担当解除
                </button>
              )}

              <div className="flex space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedStaffId}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-xs hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? '設定中...' : '設定'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
