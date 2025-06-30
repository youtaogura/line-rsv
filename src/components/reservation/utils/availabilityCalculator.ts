import type {
  BusinessHour,
  Reservation,
  ReservationMenu,
  StaffMemberBusinessHour,
} from '@/lib/supabase';
import { addMinutes, format, isAfter, isBefore, isSameDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { DayAvailabilityInfo, TimeSlot } from '../types';

/**
 * 指定した日の営業時間と予約メニューからタイムスロットを生成
 */
export function generateTimeSlots(
  date: Date,
  businessHours: BusinessHour[],
  reservationMenu?: ReservationMenu
): TimeSlot[] {
  const dayOfWeek = date.getDay();

  // その日の営業時間を取得（is_activeがtrueのもののみ）
  const dayBusinessHours = businessHours.filter(
    (bh) => bh.day_of_week === dayOfWeek && bh.is_active
  );

  if (dayBusinessHours.length === 0) {
    return [];
  }

  // 予約メニューがない場合は従来の30分間隔を使用
  const startMinutesOptions = reservationMenu?.start_minutes_options || [0, 30];
  const menuDuration = reservationMenu?.duration_minutes || 30;

  const timeSlots: TimeSlot[] = [];

  // 各営業時間枠でタイムスロットを生成
  dayBusinessHours.forEach((businessHour) => {
    const [startHour, startMinute] = businessHour.start_time
      .split(':')
      .map(Number);
    const [endHour, endMinute] = businessHour.end_time.split(':').map(Number);

    const businessStartTime = new Date(date);
    businessStartTime.setHours(startHour, startMinute, 0, 0);

    const businessEndTime = new Date(date);
    businessEndTime.setHours(endHour, endMinute, 0, 0);

    // 営業時間内の各時間帯について、許可された開始分をチェック
    let currentHour = startHour;
    while (
      currentHour < endHour ||
      (currentHour === endHour && 0 < endMinute)
    ) {
      startMinutesOptions.forEach((minuteOption) => {
        const slotStartTime = new Date(date);
        slotStartTime.setHours(currentHour, minuteOption, 0, 0);

        const slotEndTime = addMinutes(slotStartTime, menuDuration);

        // スロットが営業時間内に収まる場合のみ追加
        if (
          !isBefore(slotStartTime, businessStartTime) &&
          !isAfter(slotEndTime, businessEndTime)
        ) {
          const timeStr = format(slotStartTime, 'HH:mm');
          // 日本時間からUTCに変換してからISO文字列に変換
          const utcDateTime = fromZonedTime(slotStartTime, 'Asia/Tokyo');
          const datetimeStr = utcDateTime.toISOString();

          timeSlots.push({
            time: timeStr,
            datetime: datetimeStr,
            isAvailable: true, // 初期値、後で予約状況を反映
          });
        }
      });
      currentHour++;
    }
  });

  return timeSlots.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * 予約情報を考慮してタイムスロットの空き状況を更新（duration_minutes対応）
 */
export function updateSlotsWithReservations(
  timeSlots: TimeSlot[],
  reservations: Reservation[],
  reservationMenu?: ReservationMenu
): TimeSlot[] {
  const menuDuration = reservationMenu?.duration_minutes || 30;

  return timeSlots.map((slot) => {
    const slotStartTime = new Date(slot.datetime);
    const slotEndTime = addMinutes(slotStartTime, menuDuration);

    const isReserved = reservations.some((reservation) => {
      const reservationStartTime = new Date(reservation.datetime);
      const reservationDuration = reservation.duration_minutes || 30;
      const reservationEndTime = addMinutes(
        reservationStartTime,
        reservationDuration
      );

      const overlaps =
        slotStartTime < reservationEndTime &&
        slotEndTime > reservationStartTime;

      // 時間重複をチェック（より厳密な重複判定）
      // 2つの時間帯が重複する条件: スロット開始 < 予約終了 AND スロット終了 > 予約開始
      return overlaps;
    });

    return {
      ...slot,
      isAvailable: !isReserved,
    };
  });
}

/**
 * 指定した日の空き状況情報を計算
 */
export function calculateDayAvailability(
  date: Date,
  businessHours: BusinessHour[],
  reservations: Reservation[],
  reservationMenu?: ReservationMenu,
  staffBusinessHours?: StaffMemberBusinessHour[]
): DayAvailabilityInfo {
  const dateStr = format(date, 'yyyy-MM-dd');

  // その日の予約を抽出
  const dayReservations = reservations.filter((reservation) =>
    isSameDay(new Date(reservation.datetime), date)
  );

  // スタッフ営業時間が提供されている場合は新しいロジックを使用
  let timeSlots;
  if (staffBusinessHours) {
    timeSlots = calculateAvailabilityWithoutStaffSelection(
      date,
      businessHours,
      staffBusinessHours,
      dayReservations,
      reservationMenu
    );
  } else {
    // タイムスロットを生成
    timeSlots = generateTimeSlots(date, businessHours, reservationMenu);

    // 予約状況を反映
    timeSlots = updateSlotsWithReservations(
      timeSlots,
      dayReservations,
      reservationMenu
    );
  }

  const totalSlots = timeSlots.length;
  const availableSlots = timeSlots.filter((slot) => slot.isAvailable).length;
  const reservedSlots = totalSlots - availableSlots;

  return {
    date: dateStr,
    totalSlots,
    availableSlots,
    reservedSlots,
    timeSlots,
  };
}

/**
 * スタッフ未選択時の空き状況を計算（一人でも空いているスタッフがいる時間のみ利用可能）
 */
export function calculateAvailabilityWithoutStaffSelection(
  date: Date,
  generalBusinessHours: BusinessHour[],
  staffBusinessHours: StaffMemberBusinessHour[],
  reservations: Reservation[],
  reservationMenu?: ReservationMenu
): TimeSlot[] {
  const dayOfWeek = date.getDay();

  // テナント全体の営業時間でベースとなる時間枠を生成
  const baseTimeSlots = generateTimeSlots(
    date,
    generalBusinessHours,
    reservationMenu
  );

  if (baseTimeSlots.length === 0) {
    return [];
  }

  // 各スタッフの営業時間を取得
  const dayStaffBusinessHours = staffBusinessHours.filter(
    (sbh) => sbh.day_of_week === dayOfWeek && sbh.is_active
  );

  // 各時間スロットについて、利用可能なスタッフがいるかチェック
  return baseTimeSlots.map((slot) => {
    const slotStartTime = new Date(slot.datetime);
    const slotEndTime = addMinutes(
      slotStartTime,
      reservationMenu?.duration_minutes || 30
    );

    // 少なくとも一人のスタッフが利用可能かチェック
    const hasAvailableStaff = dayStaffBusinessHours.some((staffBH) => {
      // スタッフの営業時間内かチェック
      const [startHour, startMinute] = staffBH.start_time
        .split(':')
        .map(Number);
      const [endHour, endMinute] = staffBH.end_time.split(':').map(Number);

      const staffStartTime = new Date(date);
      staffStartTime.setHours(startHour, startMinute, 0, 0);

      const staffEndTime = new Date(date);
      staffEndTime.setHours(endHour, endMinute, 0, 0);

      // スロットがスタッフの営業時間内に収まるかチェック
      const isWithinStaffHours =
        !isBefore(slotStartTime, staffStartTime) &&
        !isAfter(slotEndTime, staffEndTime);

      if (!isWithinStaffHours) {
        return false;
      }

      // そのスタッフに既存の予約がないかチェック
      const staffReservations = reservations.filter(
        (reservation) =>
          reservation.staff_member_id === staffBH.staff_member_id &&
          isSameDay(new Date(reservation.datetime), date)
      );

      const isStaffReserved = staffReservations.some((reservation) => {
        const reservationStartTime = new Date(reservation.datetime);
        const reservationDuration = reservation.duration_minutes || 30;
        const reservationEndTime = addMinutes(
          reservationStartTime,
          reservationDuration
        );

        const overlaps =
          slotStartTime < reservationEndTime &&
          slotEndTime > reservationStartTime;

        return overlaps;
      });

      return !isStaffReserved;
    });

    return {
      ...slot,
      isAvailable: hasAvailableStaff,
    };
  });
}
