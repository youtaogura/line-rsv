import React, { useState } from "react";
import { generateTimeOptions } from "@/lib/admin-types";

interface BusinessHourFormProps {
  onCreateBusinessHour: (businessHour: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }) => Promise<boolean>;
}

export const BusinessHourForm: React.FC<BusinessHourFormProps> = ({
  onCreateBusinessHour,
}) => {
  const [newBusinessHour, setNewBusinessHour] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "18:00",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await onCreateBusinessHour(newBusinessHour);
    if (success) {
      setNewBusinessHour({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "18:00",
      });
    }
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">営業時間を追加</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="dayOfWeek"
              className="block text-sm font-medium text-gray-700"
            >
              曜日
            </label>
            <select
              id="dayOfWeek"
              value={newBusinessHour.day_of_week}
              onChange={(e) =>
                setNewBusinessHour({
                  ...newBusinessHour,
                  day_of_week: parseInt(e.target.value),
                })
              }
              className="mt-1 block w-full h-8 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value={1}>月曜日</option>
              <option value={2}>火曜日</option>
              <option value={3}>水曜日</option>
              <option value={4}>木曜日</option>
              <option value={5}>金曜日</option>
              <option value={6}>土曜日</option>
              <option value={0}>日曜日</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="startTime"
              className="block text-sm font-medium text-gray-700"
            >
              開始時間
            </label>
            <select
              id="startTime"
              value={newBusinessHour.start_time}
              onChange={(e) =>
                setNewBusinessHour({
                  ...newBusinessHour,
                  start_time: e.target.value,
                })
              }
              className="mt-1 block w-full h-8 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="endTime"
              className="block text-sm font-medium text-gray-700"
            >
              終了時間
            </label>
            <select
              id="endTime"
              value={newBusinessHour.end_time}
              onChange={(e) =>
                setNewBusinessHour({
                  ...newBusinessHour,
                  end_time: e.target.value,
                })
              }
              className="mt-1 block w-full h-8 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              追加
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
