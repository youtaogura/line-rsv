export const TIME_CONFIG = {
  HOURS_IN_DAY: 24,
  MINUTES_IN_HOUR: 60,
  TIME_SLOT_INTERVAL: 15,
  DEFAULT_DURATION: 30,
} as const;

export const DAY_NAMES_JP = [
  '日曜日',
  '月曜日', 
  '火曜日',
  '水曜日',
  '木曜日',
  '金曜日',
  '土曜日',
] as const;

export const DAY_NAMES_SHORT_JP = [
  '日',
  '月',
  '火', 
  '水',
  '木',
  '金',
  '土',
] as const;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;