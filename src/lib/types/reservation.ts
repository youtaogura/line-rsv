import type { Reservation } from '@/lib/supabase';

export interface ReservationWithStaff extends Reservation {
  staff_members?: {
    id: string;
    name: string;
  } | null;
  users?: {
    user_id: string;
    name: string;
  } | null;
}
