import React from 'react';
import { formatDateTimeWithTz } from '@/utils/date';

interface DateTimeDisplayProps {
  datetime: string | Date;
  format?: 'short' | 'full' | 'time-only' | 'date-only';
  timeZone?: string;
  className?: string;
}

export const DateTimeDisplay: React.FC<DateTimeDisplayProps> = ({
  datetime,
  format = 'short',
  timeZone = 'Asia/Tokyo',
  className = '',
}) => {
  const formatMap = {
    short: 'M月d日 HH:mm',
    full: 'yyyy年M月d日(EEEE) HH:mm',
    'time-only': 'HH:mm',
    'date-only': 'M月d日',
  };

  const formatString = formatMap[format];
  const formattedDateTime = formatDateTimeWithTz(
    datetime,
    timeZone,
    formatString
  );

  return <span className={className}>{formattedDateTime}</span>;
};
