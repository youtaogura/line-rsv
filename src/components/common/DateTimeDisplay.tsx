import { formatDateTimeWithTz } from '@/utils/date';
import React from 'react';

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
    short: 'MM/dd HH:mm',
    full: 'yyyy/MM/dd(EEEE) HH:mm',
    'time-only': 'HH:mm',
    'date-only': 'MM/dd',
  };

  const formatString = formatMap[format];
  const formattedDateTime = formatDateTimeWithTz(
    datetime,
    timeZone,
    formatString
  );

  return <span className={className}>{formattedDateTime}</span>;
};
