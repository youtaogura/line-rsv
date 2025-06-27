import React from "react";
import type { BusinessHour } from "@/lib/supabase";
import { getDayName } from "@/lib/admin-types";

interface BusinessHourListProps {
  businessHours: BusinessHour[];
  onDeleteBusinessHour: (id: string) => Promise<void>;
}

export const BusinessHourList: React.FC<BusinessHourListProps> = ({
  businessHours,
  onDeleteBusinessHour,
}) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">現在の営業時間</h2>
      </div>
      <div className="min-w-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                曜日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                開始時間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                終了時間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {businessHours.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  営業時間が設定されていません
                </td>
              </tr>
            ) : (
              businessHours
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .sort((a, b) => a.day_of_week - b.day_of_week)
                .map((businessHour) => (
                  <tr key={businessHour.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getDayName(businessHour.day_of_week)}曜日
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {businessHour.start_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {businessHour.end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => onDeleteBusinessHour(businessHour.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
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
