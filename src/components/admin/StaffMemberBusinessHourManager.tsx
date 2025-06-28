import React, { useState, useEffect } from "react";
import type { StaffMember } from "@/lib/supabase";
import { useStaffMemberBusinessHours } from "@/hooks/useAdminData";
import { LoadingSpinner } from "@/components/common";
import { DAYS_OF_WEEK } from "@/constants/time";

interface StaffMemberBusinessHourManagerProps {
  staffMember: StaffMember;
  onClose: () => void;
}

export const StaffMemberBusinessHourManager: React.FC<StaffMemberBusinessHourManagerProps> = ({
  staffMember,
  onClose,
}) => {
  const {
    businessHours,
    loading,
    fetchStaffMemberBusinessHours,
    createStaffMemberBusinessHour,
    deleteStaffMemberBusinessHour,
  } = useStaffMemberBusinessHours();

  const [dayOfWeek, setDayOfWeek] = useState(1); // 月曜日
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaffMemberBusinessHours(staffMember.id);
  }, [staffMember.id, fetchStaffMemberBusinessHours]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    const success = await createStaffMemberBusinessHour({
      staff_member_id: staffMember.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
    
    if (success) {
      setDayOfWeek(1);
      setStartTime("09:00");
      setEndTime("18:00");
      // 再取得
      await fetchStaffMemberBusinessHours(staffMember.id);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await deleteStaffMemberBusinessHour(id);
    // 再取得
    await fetchStaffMemberBusinessHours(staffMember.id);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* 営業時間追加フォーム */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-md font-medium text-gray-900 mb-4">
          新しい営業時間を追加
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="dayOfWeek"
                className="block text-sm font-medium text-gray-700"
              >
                曜日
              </label>
              <select
                id="dayOfWeek"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-700"
              >
                開始時間
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min="09:00"
                max="18:00"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-700"
              >
                終了時間
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min="09:00"
                max="18:00"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>
          <div className="flex justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? "追加中..." : "営業時間を追加"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-medium"
            >
              閉じる
            </button>
          </div>
        </form>
      </div>

      {/* 現在の営業時間一覧 */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">
          現在の営業時間
        </h3>
        {businessHours.length === 0 ? (
          <p className="text-gray-500">営業時間が設定されていません</p>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    曜日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businessHours.map((hour) => (
                  <tr key={hour.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {DAYS_OF_WEEK[hour.day_of_week]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {hour.start_time} - {hour.end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDelete(hour.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};