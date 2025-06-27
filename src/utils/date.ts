import { format as formatTz } from "date-fns-tz";
import { TIME_CONFIG, DAY_NAMES_JP } from '@/constants/time';

export function formatDateTime(datetime: string): string {
  return new Date(datetime).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTimeWithTz(
  datetime: string | Date,
  timeZone: string = "Asia/Tokyo",
  formatString: string = "M月d日 HH:mm"
): string {
  return formatTz(
    typeof datetime === 'string' ? new Date(datetime) : datetime,
    formatString,
    { timeZone }
  );
}

export function getDayName(date: Date): string {
  return DAY_NAMES_JP[date.getDay()];
}

export interface TimeOption {
  value: string;
  label: string;
}

export function generateTimeOptions(): TimeOption[] {
  const options: TimeOption[] = [];
  
  for (let hour = 0; hour <= TIME_CONFIG.HOURS_IN_DAY; hour++) {
    for (let minute = 0; minute < TIME_CONFIG.MINUTES_IN_HOUR; minute += TIME_CONFIG.TIME_SLOT_INTERVAL) {
      if (hour === TIME_CONFIG.HOURS_IN_DAY && minute > 0) break;
      
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      options.push({
        value: timeString,
        label: timeString,
      });
    }
  }
  
  return options;
}

// Memoized time options for performance
export const TIME_OPTIONS = generateTimeOptions();