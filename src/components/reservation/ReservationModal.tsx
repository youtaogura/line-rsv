'use client';

import { useState, useEffect } from 'react';
// import { X } from 'lucide-react'
import { format as formatTz } from 'date-fns-tz';
import type {
  User,
  ReservationMenuSimple,
  ReservationData,
} from '@/lib/supabase';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDateTime: string;
  availableUsers: User[];
  reservationMenu: ReservationMenuSimple | null;
  onCreateReservation: (reservationData: ReservationData) => Promise<void>;
}

export function ReservationModal({
  isOpen,
  onClose,
  preselectedDateTime,
  availableUsers,
  reservationMenu,
  onCreateReservation,
}: ReservationModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
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
      setNote('');
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
        note: note.trim() || null,
        member_type: userMode === 'new' ? 'guest' : 'regular',
        phone: userMode === 'new' ? phone.trim() || null : undefined,
        admin_note: adminNote.trim() || null,
        is_admin_mode: true,
        reservation_menu_id: reservationMenu?.id || null,
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

  if (!isOpen) return null;

  const formattedDateTime = preselectedDateTime
    ? formatTz(new Date(preselectedDateTime), 'yyyy年M月d日 HH:mm', {
        timeZone: 'Asia/Tokyo',
      })
    : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">予約追加</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            ✕
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* 予約日時表示 */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-1">予約日時</h3>
            <p className="text-blue-800">{formattedDateTime}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ユーザー選択 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                お客様選択
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="existing"
                    checked={userMode === 'existing'}
                    onChange={(e) =>
                      handleUserModeChange(e.target.value as 'existing')
                    }
                    className="mr-2"
                    disabled={submitting}
                  />
                  既存のお客様
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="new"
                    checked={userMode === 'new'}
                    onChange={(e) =>
                      handleUserModeChange(e.target.value as 'new')
                    }
                    className="mr-2"
                    disabled={submitting}
                  />
                  新規のお客様
                </label>
              </div>
            </div>

            {/* 既存ユーザー選択 */}
            {userMode === 'existing' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お客様を選択
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleExistingUserSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                  required
                >
                  <option value="">選択してください</option>
                  {availableUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.name} (
                      {user.member_type === 'regular' ? '会員' : 'ゲスト'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 名前入力 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting || userMode === 'existing'}
                required
              />
            </div>

            {/* 電話番号入力 */}
            {userMode === 'new' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>
            )}

            {/* メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お客様メモ
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>

            {/* 管理者メモ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理者メモ
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
            </div>

            {/* 送信ボタン */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                disabled={submitting}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? '登録中...' : '予約登録'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
