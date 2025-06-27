import React from "react";
import type { Reservation } from "@/lib/supabase";
import { MemberTypeBadge, DateTimeDisplay } from "@/components/common";
import { UI_TEXT } from "@/constants/ui";

interface ReservationListProps {
  reservations: Reservation[];
  onDeleteReservation: (id: string) => Promise<void>;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  onDeleteReservation,
}) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              名前
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              会員種別
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              予約日時
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              備考
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              予約作成日時
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reservations.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                予約がありません
              </td>
            </tr>
          ) : (
            reservations.map((reservation) => (
              <tr key={reservation.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {reservation.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <MemberTypeBadge memberType={reservation.member_type} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <DateTimeDisplay datetime={reservation.datetime} format="full" />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {reservation.note || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <DateTimeDisplay datetime={reservation.created_at} format="short" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onDeleteReservation(reservation.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    {UI_TEXT.DELETE}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
