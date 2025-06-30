'use client';

import { useState } from 'react';
import { format as formatTz } from 'date-fns-tz';
import type { ReservationMenu } from '@/lib/supabase';

export interface CreateReservationParams {
  user_id: string;
  name: string;
  datetime: string;
  note?: string;
  member_type: 'regular' | 'guest';
  phone?: string;
  reservation_menu_id?: string;
  staff_member_id?: string;
}
interface ReservationInputFormProps {
  initialUser: {
    user_id: string;
    name: string;
    phone?: string;
    member_type: 'regular' | 'guest';
  };
  selectedDateTime: string | null;
  reservationMenu: ReservationMenu | null;
  selectedStaffId: string;
  onSubmit: (
    reservationData: CreateReservationParams
  ) => Promise<{ success: boolean; error?: string }>;
  submitting: boolean;
  onSubmittingChange: (submitting: boolean) => void;
}

export function ReservationInputForm({
  initialUser,
  selectedDateTime,
  reservationMenu,
  selectedStaffId,
  onSubmit,
  submitting,
  onSubmittingChange,
}: ReservationInputFormProps) {
  const [name, setName] = useState(initialUser.name || '');
  const [phone, setPhone] = useState(initialUser.phone || '');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDateTime || !name.trim()) {
      alert('必要な項目を入力してください。');
      return;
    }

    const finalUserId = initialUser?.user_id || '';

    if (!finalUserId) {
      alert('ユーザー情報が不正です。');
      return;
    }

    onSubmittingChange(true);

    try {
      const reservationData: CreateReservationParams = {
        user_id: finalUserId,
        name: name.trim(),
        datetime: selectedDateTime,
        note: note.trim() || undefined,
        member_type: initialUser.member_type,
        phone: phone.trim() || undefined,
        reservation_menu_id: reservationMenu?.id || undefined,
        staff_member_id: selectedStaffId || undefined,
      };

      const result = await onSubmit(reservationData);

      if (result.success) {
        setNote('');
      }
    } finally {
      onSubmittingChange(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">予約情報入力</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 名前 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            お名前 <span className="text-red-500">*</span>
          </label>
          {initialUser.member_type === 'regular' ? (
            <div className="flex gap-4 items-center">
              <p>{name}</p>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                登録済み
              </span>
            </div>
          ) : (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors disabled:bg-gray-100"
              placeholder="お名前を入力してください"
            />
          )}
        </div>

        {/* 選択した日時の表示 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            予約日時 <span className="text-red-500">*</span>
          </label>
          <div
            className={`w-full px-4 py-3 border rounded-md transition-colors ${
              selectedDateTime
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-red-300 bg-red-50 text-red-800'
            }`}
          >
            {selectedDateTime ? (
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-medium">
                  {formatTz(new Date(selectedDateTime), 'yyyy年M月d日 HH:mm', {
                    timeZone: 'Asia/Tokyo',
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>日時を選択してください。</span>
              </div>
            )}
          </div>
        </div>

        {/* 電話番号 */}
        {initialUser.member_type === 'guest' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話番号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
              placeholder="電話番号を入力してください"
            />
          </div>
        )}

        {/* メモ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メモ（任意）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
            placeholder="特記事項やご要望があればご記入ください"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedDateTime || !name.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitting ? '登録中...' : '予約する'}
        </button>
      </form>
    </div>
  );
}
