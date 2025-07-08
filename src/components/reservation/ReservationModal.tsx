'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format as formatTz } from 'date-fns-tz';
import { useEffect, useState } from 'react';
import { MemberTypeBadge } from '../common';

interface User {
  user_id: string;
  name: string;
  phone?: string;
  member_type: 'guest' | 'regular';
}
interface ReservationMenuSimple {
  id: string;
  name: string;
}
interface ReservationData {
  user_id: string;
  name: string;
  datetime: string;
  note?: string | null;
  member_type: string;
  phone?: string | null;
  admin_note?: string | null;
  is_admin_mode: boolean;
  reservation_menu_id?: string | null;
}
interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDateTime: string;
  availableUsers: User[];
  reservationMenu: ReservationMenuSimple | null;
  selectedStaffId?: string;
  onCreateReservation: (reservationData: ReservationData) => Promise<void>;
}

export function ReservationModal({
  isOpen,
  onClose,
  preselectedDateTime,
  availableUsers,
  reservationMenu,
  selectedStaffId,
  onCreateReservation,
}: ReservationModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userMode, setUserMode] = useState<'existing' | 'new'>('existing');
  const [selectedUserId, setSelectedUserId] = useState('');

  // モーダルが開いたときの初期化
  useEffect(() => {
    if (isOpen) {
      if (availableUsers.length > 0) {
        const firstUser = availableUsers[0];
        setSelectedUserId(firstUser.user_id);
        setName(firstUser.name);
        setPhone(firstUser.phone || '');
      }
    } else {
      // モーダルが閉じたときのリセット
      setName('');
      setPhone('');
      setAdminNote('');
      setUserMode('existing');
      setSelectedUserId('');
    }
  }, [isOpen, availableUsers]);

  const handleExistingUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = availableUsers.find((u) => u.user_id === userId);
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  };

  const handleUserModeChange = (mode: 'existing' | 'new') => {
    setUserMode(mode);
    if (mode === 'new') {
      setSelectedUserId('');
      setName('');
      setPhone('');
    } else if (availableUsers.length > 0) {
      handleExistingUserSelect(availableUsers[0].user_id);
    }
  };

  const generateUserId = () => {
    return `admin_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('お客様の名前を入力してください。');
      return;
    }

    let finalUserId = '';
    if (userMode === 'existing') {
      finalUserId = selectedUserId;
    } else {
      finalUserId = generateUserId();
    }

    if (!finalUserId) {
      alert('ユーザー情報が不正です。');
      return;
    }

    setSubmitting(true);

    try {
      const reservationData = {
        user_id: finalUserId,
        name: name.trim(),
        datetime: preselectedDateTime,
        note: null,
        member_type: userMode === 'new' ? 'guest' : 'regular',
        phone: userMode === 'new' ? phone.trim() || null : undefined,
        admin_note: adminNote.trim() || null,
        is_admin_mode: true,
        reservation_menu_id: reservationMenu?.id || null,
        staff_member_id: selectedStaffId || null,
      };

      await onCreateReservation(reservationData);
      alert('予約を登録しました！');
      onClose();
    } catch (error) {
      console.error('Reservation error:', error);
      alert('予約処理でエラーが発生しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDateTime = preselectedDateTime
    ? formatTz(new Date(preselectedDateTime), 'yyyy年M月d日 HH:mm', {
        timeZone: 'Asia/Tokyo',
      })
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>予約追加</DialogTitle>
        </DialogHeader>

        {/* 予約日時表示 */}
        <div className="mb-6 p-3 bg-blue-50 rounded-xs border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-1">予約日時</h3>
          <p className="text-blue-800">{formattedDateTime}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ユーザー選択 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">お客様選択</Label>
            <RadioGroup
              value={userMode}
              onValueChange={(value) =>
                handleUserModeChange(value as 'existing' | 'new')
              }
              className="flex space-x-4"
              disabled={submitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing">登録済ユーザー</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new">新規登録</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 既存ユーザー選択 */}
          {userMode === 'existing' && (
            <div className="space-y-2">
              <Label htmlFor="user-select">お客様を選択</Label>
              <Select
                value={selectedUserId}
                onValueChange={handleExistingUserSelect}
                disabled={submitting}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.name}
                      <MemberTypeBadge memberType={user.member_type} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 名前入力 */}
          <div className="space-y-2">
            <Label htmlFor="name">お名前 *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting || userMode === 'existing'}
              required
            />
          </div>

          {/* 電話番号入力 */}
          {userMode === 'new' && (
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
            </div>
          )}

          {/* 管理者メモ */}
          <div className="space-y-2">
            <Label htmlFor="admin-note">管理者メモ</Label>
            <textarea
              id="admin-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '登録中...' : '予約登録'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
