import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Tenant = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type User = {
  user_id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  member_type: 'regular' | 'guest';
  created_at: string;
};

export type ReservationMenu = {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes: number;
  start_minutes_options: number[];
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  datetime: string;
  note?: string;
  admin_note?: string;
  member_type: 'regular' | 'guest';
  reservation_menu_id?: string;
  duration_minutes?: number;
  staff_member_id?: string;
  created_at: string;
};

export type AvailableSlot = {
  tenant_id: string;
  datetime: string;
  is_booked: boolean;
};

export type BusinessHour = {
  id: string;
  tenant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
};

export type StaffMember = {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type StaffMemberBusinessHour = {
  id: string;
  staff_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// 予約作成時に使用するデータ型
export interface ReservationData {
  user_id: string;
  name: string;
  datetime: string;
  note?: string | null;
  member_type: string;
  phone?: string | null;
  admin_note?: string | null;
  is_admin_mode: boolean;
  reservation_menu_id?: string | null;
}

// コンポーネントで使用される簡略版の型
export type ReservationMenuSimple = Pick<ReservationMenu, 'id' | 'name'>;
export type BusinessHourSimple = Pick<
  BusinessHour,
  'id' | 'day_of_week' | 'start_time' | 'end_time'
>;
export type StaffMemberSimple = Pick<StaffMember, 'id' | 'name'>;
export type ReservationSimple = Pick<
  Reservation,
  'id' | 'name' | 'member_type' | 'datetime'
> & {
  users?: {
    user_id: string;
    name: string;
  } | null;
  staff_members?: {
    id: string;
    name: string;
  } | null;
};

export type Admin = {
  id: string;
  tenant_id: string;
  username: string;
  password_hash: string;
  name: string;
  created_at: string;
  updated_at: string;
};
