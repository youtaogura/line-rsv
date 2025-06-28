import React from "react";
import type { Reservation } from "@/lib/supabase";
import { MemberTypeBadge, DateTimeDisplay } from "@/components/common";
import { MonthNavigation } from "@/components/admin/MonthNavigation";
import { UI_TEXT } from "@/constants/ui";

interface ReservationWithStaff extends Reservation {
  staff_members?: {
    id: string;
    name: string;
  } | null;
  users?: {
    user_id: string;
    name: string;
  } | null;
}

interface ReservationListProps {
  tenantId: string | null;
  reservations: ReservationWithStaff[];
  onDeleteReservation: (tenantId: string, id: string) => Promise<void>;
  selectedStaffId: string;
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  tenantId,
  reservations,
  onDeleteReservation,
  selectedStaffId,
  currentMonth,
  onMonthChange,
}) => {
  const filteredReservations = reservations.filter((reservation) => {
    if (selectedStaffId === "all") {
      return true;
    }
    if (selectedStaffId === "unassigned") {
      return !reservation.staff_member_id;
    }
    return reservation.staff_member_id === selectedStaffId;
  });
  return (
    <div>
      <MonthNavigation 
        currentMonth={currentMonth}
        onMonthChange={onMonthChange}
      />
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
              担当スタッフ
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
          {filteredReservations.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                予約がありません
              </td>
            </tr>
          ) : (
            filteredReservations.map((reservation) => (
              <tr key={reservation.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {reservation.users?.name || "ユーザー名が取得できませんでした"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <MemberTypeBadge memberType={reservation.member_type} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {reservation.staff_members?.name || "未指定"}
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
                    onClick={() => {
                      if (!tenantId) throw new Error("テナントIDが見つかりません");
                      onDeleteReservation(tenantId, reservation.id)
                    }}
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
    </div>
  );
};
