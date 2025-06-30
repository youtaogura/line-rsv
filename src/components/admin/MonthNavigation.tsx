import React from 'react';

interface MonthNavigationProps {
  currentMonth: string; // YYYY-MM format
  onMonthChange: (month: string) => void;
}

export const MonthNavigation: React.FC<MonthNavigationProps> = ({
  currentMonth,
  onMonthChange,
}) => {
  const currentDate = new Date(currentMonth + '-01');

  const previousMonth = new Date(currentDate);
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthStr = previousMonth.toISOString().substring(0, 7);

  const nextMonth = new Date(currentDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().substring(0, 7);

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xs shadow mb-4">
      <button
        onClick={() => onMonthChange(previousMonthStr)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xs hover:bg-gray-200 transition-colors"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {formatMonth(previousMonthStr)}
      </button>

      <h2 className="text-lg font-semibold text-gray-900">
        {formatMonth(currentMonth)}
      </h2>

      <button
        onClick={() => onMonthChange(nextMonthStr)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xs hover:bg-gray-200 transition-colors"
      >
        {formatMonth(nextMonthStr)}
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
};
