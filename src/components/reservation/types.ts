export interface DayAvailability {
  date: string;
  hasAvailability: boolean;
}

export interface TimeSlot {
  datetime: string;
  is_booked: boolean;
}

export interface CalendarState {
  selectedDate: Date | null;
  currentMonth: Date;
  availabilityData: DayAvailability[];
  loading: boolean;
  error: string | null;
}

export interface TimeSlotState {
  selectedDateTime: string | null;
  availableSlots: TimeSlot[];
  loading: boolean;
  error: string | null;
}

export interface ReservationFormData {
  name: string;
  phone: string;
  note: string;
  selectedDateTime: string | null;
}

export interface User {
  user_id: string;
  displayName: string;
  pictureUrl?: string;
}

export interface DbUser {
  user_id: string;
  name: string;
  phone?: string;
  member_type: "regular" | "guest";
  display_name?: string;
  created_at: string;
  tenant_id: string;
}
